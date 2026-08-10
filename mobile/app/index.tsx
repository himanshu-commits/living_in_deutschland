import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { analyse } from "@/analysis";
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

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  const c = useColors();
  return (
    <View>
      <Text style={{ ...type.heading, ...type.mono, fontSize: 19, color: tone }}>{value}</Text>
      <Text style={{ ...type.label, color: c.textMuted }}>{label}</Text>
    </View>
  );
}

export default function Home() {
  const c = useColors();
  const { ready, lang, state, marked, lastTest, progress } = useStore();
  const { t, fill } = useT();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  // language decides the whole interface, so it is asked before anything else
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;

  const pool = poolFor(state);
  const a = analyse(pool, progress);
  const passed = lastTest ? lastTest.correct >= EXAM.pass : false;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
    >
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label>{t.readiness}</Label>
          <Text style={{ ...type.label, color: a.ready ? c.correct : c.textMuted }}>
            {a.ready ? t.readyYes : t.readyNo}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginVertical: spacing.sm }}>
          <Text style={{ ...type.title, ...type.mono, fontSize: 46, color: a.ready ? c.correct : c.text }}>
            {a.projected}
          </Text>
          <Text style={{ ...type.heading, color: c.textMuted }}>/ {EXAM.general + EXAM.state}</Text>
        </View>

        <ProgressBar
          value={a.projected / (EXAM.general + EXAM.state)}
          passMark={EXAM.pass / (EXAM.general + EXAM.state)}
        />
        <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, marginTop: spacing.sm }}>
          {t.passAt} · {fill(t.basedOn, { n: a.attempted, total: a.pool })}
          {a.accuracy !== null ? ` · ${fill(t.accuracy, { p: Math.round(a.accuracy * 100) })}` : ""}
        </Text>

        <View style={{ flexDirection: "row", gap: spacing.lg, marginTop: spacing.lg }}>
          <Stat label={t.strong} value={a.strong} tone={c.correct} />
          <Stat label={t.shaky} value={a.shaky} tone={c.wrong} />
          <Stat label={t.unseen} value={a.unseen} tone={c.textMuted} />
        </View>

        {lastTest && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: c.border,
              marginTop: spacing.lg,
              paddingTop: spacing.md,
            }}
          >
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted }}>{t.lastTest}</Text>
            <Text style={{ ...type.body, fontSize: 13, fontWeight: "600", color: passed ? c.correct : c.wrong }}>
              {lastTest.correct} / {lastTest.total} · {passed ? t.passed : t.notPassed}
            </Text>
          </View>
        )}
      </Card>

      <Tile
        title={t.allQuestions}
        note={`${t.allQuestionsNote} · ${state}`}
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
