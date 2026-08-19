-- Widen the store CHECK to cover RevenueCat's real `store` enum (lowercased).
-- NULL always passes a CHECK constraint, so the webhook writes NULL for any
-- store value it doesn't recognize rather than guessing a nearest bucket —
-- an unexpected/future RevenueCat store string can never fail a write.
alter table public.entitlements drop constraint if exists entitlements_store_check;
alter table public.entitlements add constraint entitlements_store_check
  check (store is null or store in (
    'app_store', 'play_store', 'mac_app_store', 'amazon',
    'stripe', 'rc_billing', 'promotional', 'test'
  ));

-- Atomic, ordering-safe write path for the RevenueCat webhook. last_verified_at
-- is always the *event's* timestamp, not now(), so the WHERE guard below makes
-- a late-arriving retry or an out-of-order delivery of an older event a no-op
-- instead of clobbering state a newer event already wrote — no separate dedup
-- table needed. coalesce() on the metadata columns means events that don't
-- carry them (e.g. TRANSFER) don't null out data a prior event recorded.
create or replace function public.apply_entitlement_event(
  p_user_id uuid,
  p_active boolean,
  p_product_id text,
  p_store text,
  p_purchased_at timestamptz,
  p_event_time timestamptz
) returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.entitlements (user_id, active, product_id, store, purchased_at, last_verified_at)
  values (p_user_id, p_active, p_product_id, p_store, p_purchased_at, p_event_time)
  on conflict (user_id) do update
    set active = excluded.active,
        product_id = coalesce(excluded.product_id, public.entitlements.product_id),
        store = coalesce(excluded.store, public.entitlements.store),
        purchased_at = coalesce(excluded.purchased_at, public.entitlements.purchased_at),
        last_verified_at = excluded.last_verified_at
  where public.entitlements.last_verified_at < excluded.last_verified_at;
$$;

revoke all on function public.apply_entitlement_event from public, anon, authenticated;
grant execute on function public.apply_entitlement_event to service_role;
