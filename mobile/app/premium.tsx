import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Button, Card, Label, Notice } from "@/components";
import { useEntitlement } from "@/entitlements";
import { HeaderBackButton, ScreenHeader } from "@/header";
import type { PremiumFeature } from "@/premium";
import { premiumCopy } from "@/premium-copy";
import { useSession } from "@/sync";
import { useStore } from "@/storage";
import { layout, spacing, type, useColors } from "@/theme";
import { buyLifetime, hasPremium, loadLifetimePackage, purchasesConfigured, restorePremium } from "@/purchases";

export default function Premium() {
  const c = useColors();
  const { lang } = useStore();
  const copy = premiumCopy(lang ?? "de");
  const { feature } = useLocalSearchParams<{ feature?: PremiumFeature }>();
  const { session } = useSession();
  const { status, isPremium, grantVerifiedPremium } = useEntitlement();
  const [offer, setOffer] = useState<PurchasesPackage | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const storeConfigured = purchasesConfigured();

  function closePremium() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  useEffect(() => {
    if (!session || (isPremium && !__DEV__) || !storeConfigured) return;
    let active = true;
    setLoadingOffer(true);
    loadLifetimePackage(session.user.id)
      .then((item) => {
        if (!active) return;
        setOffer(item);
        if (!item) setMessage(copy.unavailable);
      })
      .catch((error: unknown) => {
        if (active) setMessage(copy.purchaseFailed);
      })
      .finally(() => { if (active) setLoadingOffer(false); });
    return () => { active = false; };
  }, [isPremium, session, storeConfigured, copy.unavailable, copy.purchaseFailed]);

  async function purchase() {
    if (!offer) return;
    setBusy("purchase");
    setMessage(null);
    try {
      const customerInfo = await buyLifetime(offer);
      if (!hasPremium(customerInfo)) throw new Error(copy.purchaseFailed);
      await grantVerifiedPremium();
      router.replace({ pathname: "/", params: { premiumResult: "activated" } });
    } catch (error: unknown) {
      const cancelled = typeof error === "object" && error !== null && "userCancelled" in error && error.userCancelled === true;
      if (cancelled) {
        setMessage(copy.cancelled);
      } else {
        setMessage(copy.purchaseFailed);
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
        setMessage(copy.noPrevious);
        return;
      }
      await grantVerifiedPremium();
      router.replace({ pathname: "/", params: { premiumResult: "restored" } });
    } catch (error: unknown) {
      setMessage(copy.restoreFailed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        title="Premium"
        left={<HeaderBackButton label={copy.close} onPress={closePremium} />}
      />
      <ScrollView contentContainerStyle={{ width: "100%", maxWidth: layout.contentMaxWidth,
        alignSelf: "center", padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}>
        <Card>
          <Label>{copy.lifetime}</Label>
          <Text style={{ ...type.title, color: c.text, marginTop: spacing.sm }}>{copy.prepare}</Text>
          <Text style={{ ...type.body, color: c.textMuted, marginTop: spacing.sm }}>
            {copy.intro}
          </Text>
        </Card>

        {feature ? <Notice tone="info">{copy.benefits.join(", ")}</Notice> : null}
        {isPremium ? <Notice tone="info">{copy.active}</Notice> : null}
        {message ? <Notice tone="info">{message}</Notice> : null}

        <Card>
          <Label>{copy.included}</Label>
          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {copy.benefits.map((benefit) => (
              <View key={benefit} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Ionicons name="checkmark-circle" size={18} color={c.correct} />
                <Text style={{ ...type.body, color: c.text, flex: 1 }}>{benefit}</Text>
              </View>
            ))}
          </View>
        </Card>

        {!isPremium && !session ? (
          <>
            <Button
              label={copy.continuePurchase}
              onPress={() => router.push({ pathname: "/login", params: { returnTo: "premium" } })}
            />
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
              {copy.loginNote}
            </Text>
          </>
        ) : null}

        {!isPremium && session ? (
          <>
            {!storeConfigured ? <Notice tone="info">{copy.storeSetup}</Notice> : null}
            <Button
              label={loadingOffer ? copy.loadingPrice : offer ? copy.unlock.replace("{price}", offer.product.priceString) : copy.unavailable}
              onPress={purchase}
              disabled={!offer || busy !== null || loadingOffer}
            />
            <Button
              label={busy === "restore" ? copy.restoring : copy.restore}
              variant="ghost"
              onPress={restore}
              disabled={!storeConfigured || busy !== null}
            />
          </>
        ) : null}

        {status === "loading" ? <Notice tone="info">{copy.checking}</Notice> : null}
      </ScrollView>
    </View>
  );
}
