import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Button, Card, Label, Notice } from "@/components";
import { useEntitlement } from "@/entitlements";
import { ScreenHeader } from "@/header";
import type { PremiumFeature } from "@/premium";
import { useSession } from "@/sync";
import { layout, spacing, type, useColors } from "@/theme";
import { buyLifetime, hasPremium, loadLifetimePackage, purchasesConfigured, restorePremium } from "@/purchases";

const BENEFITS = [
  "Detailed explanations and translated hints",
  "Audio pronunciation",
  "Adaptive weak-topic practice",
  "Unlimited mock exams",
  "Advanced readiness analytics",
  "Cloud sync across devices",
  "A personalized study plan",
  "No advertisements",
];

const FEATURE_NOTE: Partial<Record<PremiumFeature, string>> = {
  explanations: "Unlock explanations for every answer.",
  audio: "Listen to German questions and answers.",
  adaptive: "Focus automatically on the topics that need work.",
  unlimited_exams: "Take another complete mock exam whenever you want.",
  analytics: "See detailed readiness and topic-level performance.",
  cloud_sync: "Keep your progress on all your devices.",
  study_plan: "Get a study plan based on your exam date and progress.",
  remove_ads: "Study without advertisements.",
};

export default function Premium() {
  const c = useColors();
  const { feature } = useLocalSearchParams<{ feature?: PremiumFeature }>();
  const { session } = useSession();
  const { status, isPremium, grantVerifiedPremium } = useEntitlement();
  const [offer, setOffer] = useState<PurchasesPackage | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const storeConfigured = purchasesConfigured();

  useEffect(() => {
    if (!session || (isPremium && !__DEV__) || !storeConfigured) return;
    let active = true;
    setLoadingOffer(true);
    loadLifetimePackage(session.user.id)
      .then((item) => {
        if (!active) return;
        setOffer(item);
        if (!item) setMessage("The lifetime product is not available in the store yet.");
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to load the store product.");
      })
      .finally(() => { if (active) setLoadingOffer(false); });
    return () => { active = false; };
  }, [isPremium, session, storeConfigured]);

  async function purchase() {
    if (!offer) return;
    setBusy("purchase");
    setMessage(null);
    try {
      const customerInfo = await buyLifetime(offer);
      if (!hasPremium(customerInfo)) throw new Error("The purchase completed, but Premium was not returned by the store.");
      await grantVerifiedPremium();
      router.replace({ pathname: "/", params: { premiumResult: "activated" } });
    } catch (error: unknown) {
      const cancelled = typeof error === "object" && error !== null && "userCancelled" in error && error.userCancelled === true;
      if (cancelled) {
        setMessage("Purchase cancelled. No charge was made.");
      } else {
        const detail = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
          ? error.message
          : "The purchase could not be completed.";
        setMessage(detail);
      }
    } finally {
      setBusy(null);
    }
  }

  async function restore() {
    if (!session) return;
    setBusy("restore");
    setMessage(null);
    try {
      const customerInfo = await restorePremium(session.user.id);
      if (!hasPremium(customerInfo)) {
        setMessage("No previous Premium purchase was found for this store account.");
        return;
      }
      await grantVerifiedPremium();
      router.replace({ pathname: "/", params: { premiumResult: "restored" } });
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Purchases could not be restored.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Premium" />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: layout.contentMaxWidth,
        alignSelf: "center", padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}>
        <Card>
          <Label>Lifetime access</Label>
          <Text style={{ ...type.title, color: c.text, marginTop: spacing.sm }}>Prepare with confidence</Text>
          <Text style={{ ...type.body, color: c.textMuted, marginTop: spacing.sm }}>
            One purchase unlocks Premium permanently. No subscription and no recurring charge.
          </Text>
        </Card>

        {feature && FEATURE_NOTE[feature] ? <Notice tone="info">{FEATURE_NOTE[feature]}</Notice> : null}
        {isPremium ? <Notice tone="info">Premium is active on this account.</Notice> : null}
        {message ? <Notice tone="info">{message}</Notice> : null}

        <Card>
          <Label>Everything in Premium</Label>
          <View style={{ marginTop: spacing.md, gap: spacing.md }}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={{ flexDirection: "row", gap: spacing.md }}>
                <Text style={{ ...type.body, color: c.correct }}>✓</Text>
                <Text style={{ ...type.body, color: c.text, flex: 1 }}>{benefit}</Text>
              </View>
            ))}
          </View>
        </Card>

        {!isPremium && !session ? (
          <>
            <Button
              label="Continue to lifetime purchase"
              onPress={() => router.push({ pathname: "/login", params: { returnTo: "premium" } })}
            />
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
              Log in or create an account to secure and restore your purchase. Free study remains available without an account.
            </Text>
          </>
        ) : null}

        {!isPremium && session ? (
          <>
            {!storeConfigured ? <Notice tone="info">Store purchases are ready in the app but still need RevenueCat public SDK keys.</Notice> : null}
            <Button
              label={loadingOffer ? "Loading store price…" : offer ? `Unlock forever — ${offer.product.priceString}` : "Lifetime purchase unavailable"}
              onPress={purchase}
              disabled={!offer || busy !== null || loadingOffer}
            />
            <Button
              label={busy === "restore" ? "Restoring…" : "Restore purchases"}
              variant="ghost"
              onPress={restore}
              disabled={!storeConfigured || busy !== null}
            />
          </>
        ) : null}

        {__DEV__ && isPremium && session && storeConfigured ? (
          <Card>
            <Label>Development testing</Label>
            <Text style={{ ...type.body, color: c.textMuted, marginVertical: spacing.md }}>
              Open the Test Store dialog again to verify cancellation and purchase-error handling. This section is excluded from release builds.
            </Text>
            <Button
              label={loadingOffer ? "Loading test product…" : "Test purchase outcomes"}
              onPress={purchase}
              disabled={!offer || busy !== null || loadingOffer}
            />
          </Card>
        ) : null}

        {status === "loading" ? <Notice tone="info">Checking Premium access…</Notice> : null}
      </ScrollView>
    </View>
  );
}
