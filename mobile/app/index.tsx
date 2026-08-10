import { Redirect, router } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Button, Card, Label, ProgressBar } from "@/components";
import { EXAM, poolFor } from "@/questions";
import { mastered, useStore } from "@/storage";
import { spacing, type, useColors } from "@/theme";

export default function Home() {
  const c = useColors();
  const { ready, state, progress } = useStore();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!state) return <Redirect href="/bundesland" />;

  const pool = poolFor(state);
  const ids = pool.map((q) => q.id);
  const known = mastered(progress, ids);
  const attempted = ids.filter((id) => progress[id]).length;
  // rough projection of an exam score from what they have actually mastered
  const projected = Math.round((known / pool.length) * (EXAM.general + EXAM.state));

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <Card>
        <Label>Bereitschaft</Label>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.sm }}>
          <Text style={{ ...type.title, fontSize: 44, color: c.text }}>{projected}</Text>
          <Text style={{ ...type.heading, color: c.textMuted }}>/ {EXAM.general + EXAM.state}</Text>
        </View>
        <Text style={{ ...type.body, color: c.textMuted, marginBottom: spacing.md }}>
          {projected >= EXAM.pass
            ? `Über der Bestehensgrenze von ${EXAM.pass}.`
            : `Zum Bestehen brauchst du ${EXAM.pass}.`}
        </Text>
        <ProgressBar value={known / pool.length} />
        <Text style={{ ...type.body, fontSize: 14, color: c.textMuted, marginTop: spacing.sm }}>
          {known} von {pool.length} Fragen sitzen · {attempted} geübt
        </Text>
      </Card>

      <Card>
        <Label>Üben</Label>
        <Text style={{ ...type.heading, color: c.text, marginTop: spacing.xs, marginBottom: spacing.sm }}>
          Alle {pool.length} Fragen
        </Text>
        <Text style={{ ...type.body, color: c.textMuted, marginBottom: spacing.lg }}>
          300 allgemeine Fragen plus 10 für {state}. Sofortiges Feedback nach jeder Antwort.
        </Text>
        <Button label="Üben starten" onPress={() => router.push("/learn")} />
      </Card>

      <Card>
        <Label>Prüfung</Label>
        <Text style={{ ...type.heading, color: c.text, marginTop: spacing.xs, marginBottom: spacing.sm }}>
          {EXAM.general + EXAM.state} Fragen · {EXAM.minutes} Minuten
        </Text>
        <Text style={{ ...type.body, color: c.textMuted, marginBottom: spacing.lg }}>
          Wie im echten Test: {EXAM.general} allgemeine und {EXAM.state} Fragen zu {state}.
          Bestanden ab {EXAM.pass} richtigen Antworten.
        </Text>
        <Button label="Prüfung simulieren" variant="ghost" onPress={() => router.push("/exam")} />
      </Card>

      <Button
        label={`Bundesland ändern (${state})`}
        variant="ghost"
        onPress={() => router.push("/bundesland")}
      />
    </ScrollView>
  );
}
