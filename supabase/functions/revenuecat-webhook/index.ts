import { createClient } from "jsr:@supabase/supabase-js@2";

const GRANT_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "NON_RENEWING_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "SUBSCRIPTION_EXTENDED",
  "REFUND_REVERSED",
]);
const REVOKE_EVENTS = new Set(["CANCELLATION", "EXPIRATION"]);
const KNOWN_STORES = new Set([
  "app_store", "play_store", "mac_app_store", "amazon", "stripe", "rc_billing", "promotional", "test",
]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ENTITLEMENT_ID = Deno.env.get("REVENUECAT_ENTITLEMENT_ID") ?? "premium";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

function normalizeStore(store: unknown): string | null {
  if (typeof store !== "string") return null;
  const lower = store.toLowerCase();
  return KNOWN_STORES.has(lower) ? lower : null;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

async function applyEvent(params: {
  userId: string;
  active: boolean;
  productId: string | null;
  store: string | null;
  purchasedAtMs: number | null;
  eventTimestampMs: number;
}): Promise<void> {
  const { error } = await supabase.rpc("apply_entitlement_event", {
    p_user_id: params.userId,
    p_active: params.active,
    p_product_id: params.productId,
    p_store: params.store,
    p_purchased_at: params.purchasedAtMs ? new Date(params.purchasedAtMs).toISOString() : null,
    p_event_time: new Date(params.eventTimestampMs).toISOString(),
  });
  if (error) throw error;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  const provided = req.headers.get("Authorization") ?? "";
  if (!expected || !provided || !(await timingSafeEqual(provided, expected))) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Malformed JSON", { status: 400 });
  }

  const event = (body as { event?: unknown })?.event as Record<string, unknown> | undefined;
  if (!event || typeof event.type !== "string" || typeof event.id !== "string") {
    return new Response("Malformed event envelope", { status: 400 });
  }
  const type = event.type;

  if (type === "TEST") return new Response(JSON.stringify({ ok: true, noop: "test" }), { status: 200 });

  const eventTimestampMs = typeof event.event_timestamp_ms === "number" ? event.event_timestamp_ms : Date.now();
  const store = normalizeStore(event.store);
  const productId = typeof event.product_id === "string" ? event.product_id : null;
  const purchasedAtMs = typeof event.purchased_at_ms === "number" ? event.purchased_at_ms : null;

  try {
    if (type === "TRANSFER") {
      const from = Array.isArray(event.transferred_from) ? event.transferred_from : [];
      const to = Array.isArray(event.transferred_to) ? event.transferred_to : [];
      for (const userId of from) {
        if (!isUuid(userId)) continue;
        await applyEvent({ userId, active: false, productId: null, store, purchasedAtMs: null, eventTimestampMs });
      }
      for (const userId of to) {
        if (!isUuid(userId)) continue;
        await applyEvent({ userId, active: true, productId: null, store, purchasedAtMs: null, eventTimestampMs });
      }
      return new Response(JSON.stringify({ ok: true, transferred: { from: from.length, to: to.length } }), { status: 200 });
    }

    const appUserId = event.app_user_id;
    if (!isUuid(appUserId)) {
      // Pre-login (anonymous RevenueCat ID) or malformed — nothing a retry fixes.
      console.log(`revenuecat-webhook: skipping ${type}, non-UUID app_user_id`);
      return new Response(JSON.stringify({ ok: true, noop: "non-uuid-app-user-id" }), { status: 200 });
    }

    const entitlementIds = Array.isArray(event.entitlement_ids) ? event.entitlement_ids : [];
    if (!entitlementIds.includes(ENTITLEMENT_ID)) {
      return new Response(JSON.stringify({ ok: true, noop: "entitlement-not-tracked" }), { status: 200 });
    }

    if (GRANT_EVENTS.has(type) || REVOKE_EVENTS.has(type)) {
      await applyEvent({
        userId: appUserId,
        active: GRANT_EVENTS.has(type),
        productId,
        store,
        purchasedAtMs,
        eventTimestampMs,
      });
      return new Response(JSON.stringify({ ok: true, applied: type }), { status: 200 });
    }

    // Any other event type (BILLING_ISSUE, SUBSCRIBER_ALIAS, paywall events,
    // future types) — acknowledged, deliberately not written.
    return new Response(JSON.stringify({ ok: true, noop: "unhandled-type" }), { status: 200 });
  } catch (error) {
    console.error("revenuecat-webhook: infrastructure error", error);
    return new Response(JSON.stringify({ ok: false, error: "internal error" }), { status: 500 });
  }
});
