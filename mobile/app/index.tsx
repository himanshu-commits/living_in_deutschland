import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { analyse } from "@/analysis";
import { Card, Label, ProgressBar } from "@/components";
import { ScreenHeader } from "@/header";
import { BUNDESLAND_CODES, EXAM, poolFor } from "@/questions";
import { PremiumWelcomeBanner, type PremiumWelcomeKind } from "@/premium-welcome-banner";
import { stateName } from "@/stateNames";
import { useStore, useT } from "@/storage";
import { layout, radius, spacing, type, useColors } from "@/theme";
import { useFreeExamRemaining } from "@/exam-limits";
import { AdBanner } from "@/ads";
import { useEntitlement } from "@/entitlements";
import { usePremiumGate } from "@/premium";
import { useSession } from "@/sync";

function Tile({
  title,
  note,
  count,
  onPress,
  filled,
}: {
  title: string;
  note: string;
  count: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${count}. ${note}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        backgroundColor: filled ? c.text : c.surface,
        borderColor: filled ? c.text : c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: spacing.lg,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ ...type.body, fontWeight: "600", color: filled ? c.bg : c.text }}>
          {title}
        </Text>
        <Text style={{ ...type.body, fontSize: 13, color: filled ? c.bg : c.textMuted, opacity: filled ? 0.7 : 1 }}>
          {note}
        </Text>
      </View>
      <Text
        style={{
          ...type.heading,
          ...type.mono,
          fontSize: 22,
          color: filled ? c.bg : c.accent,
        }}
      >
        {count}
      </Text>
    </Pressable>
  );
}

function UtilityPill({
  icon,
  label,
  accessibilityLabel,
  onPress,
}: {
  icon: string;
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        backgroundColor: pressed ? c.surfaceAlt : c.surface,
        borderColor: c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text accessibilityElementsHidden style={{ fontSize: 17, color: c.accent }}>
        {icon}
      </Text>
      <Text style={{ ...type.label, color: c.text, flexShrink: 1 }} numberOfLines={1}>
        {label}
      </Text>
      <Text accessibilityElementsHidden style={{ fontSize: 15, color: c.textMuted }}>›</Text>
    </Pressable>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 1 }}>
      <Text style={{ ...type.heading, ...type.mono, fontSize: 17, color: tone }}>{value}</Text>
      <Text numberOfLines={1} style={{ ...type.label, fontSize: 10, color: c.textMuted }}>{label}</Text>
    </View>
  );
}

export default function Home() {
  const { premiumResult } = useLocalSearchParams<{ premiumResult?: string }>();
  const handledPremiumResult = useRef<string | null>(null);
  // the last `signInSeq` (see sync.ts) this screen has already evaluated for a
  // login-triggered welcome — guards against re-showing it on every render
  // where the session is simply still present (e.g. reopening the app)
  const handledSignInSeq = useRef(0);
  const [welcome, setWelcome] = useState<PremiumWelcomeKind | null>(null);
  const c = useColors();
  const { ready, lang, state, marked, mistakes, lastTest, progress } = useStore();
  const { t, fill, lang: interfaceLang } = useT();
  const { isPremium, status: entitlementStatus } = useEntitlement();
  const { signInSeq } = useSession();
  const premiumGate = usePremiumGate();
  const freeExamsRemaining = useFreeExamRemaining(isPremium, entitlementStatus === "loading");

  // Right after a purchase or restore on the Premium screen: router.replace
  // there carries `premiumResult` for exactly one navigation.
  useEffect(() => {
    if (!ready || !lang || !state || !premiumResult || handledPremiumResult.current === premiumResult) return;
    handledPremiumResult.current = premiumResult;
    setWelcome(premiumResult === "restored" ? "restored" : "activated");
  }, [lang, premiumResult, ready, state]);

  // A premium user simply logging in (reinstall, new device, etc.), rather
  // than purchasing/restoring in this session. `signInSeq` only advances on a
  // genuine `SIGNED_IN` auth event, never on a session merely restored from
  // storage at cold start, so this does not fire on every ordinary app open —
  // only the first time a fresh login resolves to an already-premium account.
  useEffect(() => {
    if (!ready || !lang || !state) return;
    if (signInSeq === 0 || signInSeq === handledSignInSeq.current) return;
    if (entitlementStatus === "loading") return; // wait for it to resolve before deciding
    handledSignInSeq.current = signInSeq;
    if (isPremium && !premiumResult) setWelcome("login");
  }, [ready, lang, state, signInSeq, entitlementStatus, isPremium, premiumResult]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  // language decides the whole interface, so it is asked before anything else
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;

  const pool = poolFor(state);
  const a = analyse(pool, progress);
  const passed = lastTest ? lastTest.correct >= EXAM.pass : false;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t.home} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        {welcome ? (
          <PremiumWelcomeBanner
            kind={welcome}
            onDismiss={() => setWelcome(null)}
            onOpenAnalytics={() => {
              setWelcome(null);
              premiumGate("analytics", () => router.push("/analytics"));
            }}
          />
        ) : null}

        <Card style={{ padding: spacing.md }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: a.ready ? c.correctBg : c.surfaceAlt,
                borderWidth: 5,
                borderColor: a.ready ? c.correct : c.accent,
              }}
            >
              <Text style={{ ...type.heading, ...type.mono, fontSize: 25, color: a.ready ? c.correct : c.text }}>
                {a.projected}
              </Text>
              <Text style={{ ...type.label, fontSize: 9, color: c.textMuted }}>/ {EXAM.general + EXAM.state}</Text>
            </View>

            <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
                <Label>{t.readiness}</Label>
                <Text style={{ ...type.label, fontSize: 11, color: a.ready ? c.correct : c.textMuted }}>
                  {a.ready ? t.readyYes : t.readyNo}
                </Text>
              </View>
              <ProgressBar
                value={a.projected / (EXAM.general + EXAM.state)}
                passMark={EXAM.pass / (EXAM.general + EXAM.state)}
              />
              <Text numberOfLines={2} style={{ ...type.body, fontSize: 11, lineHeight: 16, color: c.textMuted }}>
                {fill(t.basedOn, { n: a.attempted, total: a.pool })}
                {a.accuracy !== null ? ` · ${fill(t.accuracy, { p: Math.round(a.accuracy * 100) })}` : ""}
                {` · ${t.passAt}`}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.md,
              backgroundColor: c.surfaceAlt,
            }}
          >
            <Stat label={t.strong} value={a.strong} tone={c.correct} />
            <Stat label={t.shaky} value={a.shaky} tone={c.wrong} />
            <Stat label={t.unseen} value={a.unseen} tone={c.textMuted} />
          </View>

          <View
            style={{
              gap: spacing.sm,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: c.border,
              marginTop: spacing.sm,
              paddingTop: spacing.sm,
            }}
          >
            {lastTest ? (
              <Text style={{ ...type.body, fontSize: 11, color: passed ? c.correct : c.wrong }}>
                {t.lastTest}: {lastTest.correct}/{lastTest.total} · {passed ? t.passed : t.notPassed}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPremium ? "Open advanced readiness analytics" : "Unlock Premium readiness analytics"}
              onPress={() => premiumGate("analytics", () => router.push("/analytics"))}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingVertical: isPremium ? spacing.xs : 10,
                paddingHorizontal: isPremium ? 0 : spacing.md,
                borderRadius: radius.md,
                backgroundColor: isPremium ? "transparent" : c.accent,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              {!isPremium && <Text style={{ fontSize: 18, color: c.accentText }}>★</Text>}
              <View style={{ flex: 1 }}>
                <Text style={{ ...type.label, fontSize: isPremium ? 11 : 12, color: isPremium ? c.accent : c.accentText }}>
                  {isPremium ? "Open advanced analytics" : "Unlock your readiness plan"}
                </Text>
                {!isPremium && (
                  <Text style={{ ...type.body, fontSize: 11, lineHeight: 15, color: c.accentText, opacity: 0.8 }}>
                    See weak topics and exactly what to practise next
                  </Text>
                )}
              </View>
              <Text style={{ ...type.body, color: isPremium ? c.accent : c.accentText }}>→</Text>
            </Pressable>
          </View>
        </Card>

      <Tile
        title={t.allQuestions}
        note={`${t.allQuestionsNote} · ${stateName(state, interfaceLang)}`}
        count={String(pool.length)}
        onPress={() => router.push("/read")}
      />
      <Tile
        title={t.practice}
        note={t.practiceNote}
        count={String(pool.length)}
        onPress={() => router.push("/attempt")}
      />
      <Tile
        title={t.mistakes}
        note={t.mistakesNote}
        count={String(mistakes.length)}
        onPress={() => router.push("/mistakes")}
      />
      <Tile
        title={t.test}
        note={`${t.testNote} · ${isPremium ? "Unlimited with Premium" : `${freeExamsRemaining ?? 0} free ${freeExamsRemaining === 1 ? "attempt" : "attempts"} left`}`}
        count="→"
        filled
        onPress={() => router.push("/exam")}
      />
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
        <UtilityPill
          icon="📍"
          label={BUNDESLAND_CODES[state] ?? state}
          accessibilityLabel={`${t.yourState}: ${stateName(state, interfaceLang)}`}
          onPress={() => router.push("/bundesland")}
        />
        <UtilityPill icon="▦" label={t.topics} onPress={() => router.push("/topics")} />
        <UtilityPill
          icon="☆"
          label={`${t.markedAction} ${marked.length}`}
          accessibilityLabel={`${t.marked}: ${marked.length}`}
          onPress={() => router.push("/marked")}
        />
      </View>
      <AdBanner />
      </ScrollView>
    </View>
  );
}
