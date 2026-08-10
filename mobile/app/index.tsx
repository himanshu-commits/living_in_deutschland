import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Label, ProgressBar } from "@/components";
import { EXAM, poolFor } from "@/questions";
import { useStore, useT } from "@/storage";
import { radius, spacing, type, useColors } from "@/theme";

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

export default function Home() {
  const c = useColors();
  const { ready, lang, state, marked, lastTest } = useStore();
  const { t } = useT();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  // language decides the whole interface, so it is asked before anything else
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;

  const pool = poolFor(state);
  const passed = lastTest ? lastTest.correct >= EXAM.pass : false;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
    >
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label>{t.lastTest}</Label>
          {lastTest && (
            <Text style={{ ...type.label, color: passed ? c.correct : c.wrong }}>
              {passed ? t.passed : t.notPassed}
            </Text>
          )}
        </View>
        {lastTest ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginVertical: spacing.sm }}>
              <Text style={{ ...type.title, ...type.mono, fontSize: 44, color: passed ? c.correct : c.text }}>
                {lastTest.correct}
              </Text>
              <Text style={{ ...type.heading, color: c.textMuted }}>/ {lastTest.total}</Text>
            </View>
            <ProgressBar value={lastTest.correct / lastTest.total} passMark={EXAM.pass / lastTest.total} />
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, marginTop: spacing.sm }}>
              {t.passAt}
            </Text>
          </>
        ) : (
          <Text style={{ ...type.body, color: c.textMuted, marginTop: spacing.sm }}>{t.noTestYet}</Text>
        )}
      </Card>

      <Tile
        title={t.allQuestions}
        note={`${t.allQuestionsNote} · ${state}`}
        count={String(pool.length)}
        onPress={() => router.push("/read")}
      />
      <Tile
        title={t.marked}
        note={t.markedNote}
        count={String(marked.length)}
        onPress={() => router.push("/marked")}
      />
      <Tile
        title={t.test}
        note={t.testNote}
        count="→"
        filled
        onPress={() => router.push("/exam")}
      />

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <Pressable style={{ flex: 1 }} onPress={() => router.push("/language")} accessibilityRole="button">
          <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
            {t.chooseLanguage} · {t.change}
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => router.push("/bundesland")} accessibilityRole="button">
          <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
            {state} · {t.change}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
