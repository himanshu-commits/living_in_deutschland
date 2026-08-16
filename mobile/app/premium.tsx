import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, Label, Notice } from "@/components";
import { useEntitlement } from "@/entitlements";
import { ScreenHeader } from "@/header";
import type { PremiumFeature } from "@/premium";
import { useSession } from "@/sync";
import { layout, spacing, type, useColors } from "@/theme";

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
  const { status, isPremium } = useEntitlement();

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
            <Button label="Log in to continue" onPress={() => router.push("/login")} />
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
              Free study remains available without an account.
            </Text>
          </>
        ) : null}

        {!isPremium && session ? (
          <>
            <Button label="Lifetime purchase — coming soon" onPress={() => {}} disabled />
            <Button label="Restore purchases — coming soon" variant="ghost" onPress={() => {}} disabled />
          </>
        ) : null}

        {status === "loading" ? <Notice tone="info">Checking Premium access…</Notice> : null}
      </ScrollView>
    </View>
  );
}
