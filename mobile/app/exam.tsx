import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Button, Card, Label, Option, ProgressBar } from "@/components";
import { HeaderBackButton, ScreenHeader } from "@/header";
import { Illustration, ImageOptions } from "@/media";
import { EXAM, examPaper, shuffledOptionIndices, type Question } from "@/questions";
import { useStore, useT } from "@/storage";
import { spacing, type, useColors } from "@/theme";

function mmss(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Exam() {
  const c = useColors();
  const { t } = useT();
  const { ready, state, record, saveTest } = useStore();
  const paper = useMemo<Question[]>(() => (state ? examPaper(state) : []), [state]);

  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => Array(EXAM.general + EXAM.state).fill(null));
  const [left, setLeft] = useState(EXAM.minutes * 60);
  const [done, setDone] = useState(false);
  const recorded = useRef(false);
  const q = paper[at];
  // Recomputed when navigation opens another question (including revisits).
  const optionOrder = useMemo(() => shuffledOptionIndices(q?.options.length ?? 0), [q?.id, at]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [done]);

  // time up ends the exam; doing this in its own effect keeps the tick pure
  useEffect(() => {
    if (left === 0) setDone(true);
  }, [left]);

  // stats are written once, at the end, so a half-finished exam does not skew them
  useEffect(() => {
    if (!done || recorded.current) return;
    recorded.current = true;
    paper.forEach((q, i) => record(q.id, answers[i] === q.answer));
    saveTest({
      correct: paper.filter((q, i) => answers[i] === q.answer).length,
      total: paper.length,
      at: Date.now(),
    });
  }, [done]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!state) return <Redirect href="/bundesland" />;

  const correct = paper.filter((q, i) => answers[i] === q.answer).length;

  if (done) {
    const passed = correct >= EXAM.pass;
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader
          title={t.test}
          menu={false}
          left={<HeaderBackButton label={t.back} onPress={() => router.replace("/")} />}
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <Card>
          <Label>{passed ? "Bestanden" : "Nicht bestanden"}</Label>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginVertical: spacing.sm }}>
            <Text style={{ ...type.title, fontSize: 52, color: passed ? c.correct : c.wrong }}>{correct}</Text>
            <Text style={{ ...type.heading, color: c.textMuted }}>/ {paper.length}</Text>
          </View>
          <ProgressBar value={correct / paper.length} />
          <Text style={{ ...type.body, color: c.textMuted, marginTop: spacing.md }}>
            Zum Bestehen des Einbürgerungstests brauchst du {EXAM.pass} richtige Antworten,
            für den Orientierungskurs 15.
          </Text>
        </Card>

        {paper.map((q, i) => {
          const ok = answers[i] === q.answer;
          return (
            <Card key={q.id}>
              <Label>
                {i + 1}. {ok ? "Richtig" : "Falsch"}
              </Label>
              <Text style={{ ...type.body, color: c.text, marginVertical: spacing.sm }}>{q.question}</Text>
              <Text style={{ ...type.body, fontSize: 14, color: ok ? c.correct : c.wrong }}>
                {answers[i] === null ? "Nicht beantwortet" : `Deine Antwort: ${q.options[answers[i]!]}`}
              </Text>
              {!ok && (
                <Text style={{ ...type.body, fontSize: 14, color: c.correct, marginTop: spacing.xs }}>
                  Richtig: {q.answer !== null ? q.options[q.answer] : "—"}
                </Text>
              )}
            </Card>
          );
        })}

        <Button label="Zurück" onPress={() => router.replace("/")} />
        </ScrollView>
      </View>
    );
  }

  const answeredCount = answers.filter((a) => a !== null).length;

  function pick(index: number) {
    setAnswers((prev) => prev.map((a, i) => (i === at ? index : a)));
  }

  function finish() {
    const missing = answers.filter((a) => a === null).length;
    if (missing === 0) return setDone(true);
    Alert.alert(
      "Prüfung abgeben?",
      `${missing} ${missing === 1 ? "Frage ist" : "Fragen sind"} noch unbeantwortet.`,
      [
        { text: "Weiter bearbeiten", style: "cancel" },
        { text: "Abgeben", style: "destructive", onPress: () => setDone(true) },
      ]
    );
  }

  function exitTest() {
    Alert.alert(t.exitTestTitle, t.exitTestMessage, [
      { text: t.cancel, style: "cancel" },
      { text: t.exit, style: "destructive", onPress: () => router.replace("/") },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        title={t.test}
        menu={false}
        left={<HeaderBackButton label={t.exit} onPress={exitTest} />}
      />
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label>
            Frage {at + 1} von {paper.length}
          </Label>
          <Text style={{ ...type.mono, fontWeight: "700", color: left < 300 ? c.wrong : c.textMuted }}>
            {mmss(left)}
          </Text>
        </View>
        <ProgressBar value={answeredCount / paper.length} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}>
        <Text style={{ ...type.question, color: c.text, marginBottom: spacing.sm }}>{q.question}</Text>

        {q.media && q.media.kind !== "options" && <Illustration media={q.media} />}

        {q.media?.kind === "options" ? (
          <ImageOptions
            media={q.media}
            picked={answers[at]}
            answer={null}
            answered={false}
            order={optionOrder}
            onPick={pick}
          />
        ) : (
          optionOrder.map((originalIndex, displayIndex) => (
            <Option
              key={originalIndex}
              index={displayIndex}
              text={q.options[originalIndex]}
              state={answers[at] === originalIndex ? "revealed" : "idle"}
              onPress={() => pick(originalIndex)}
            />
          ))
        )}

        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
          {at > 0 && (
            <View style={{ flex: 1 }}>
              <Button label="Zurück" variant="ghost" onPress={() => setAt((i) => i - 1)} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            {at < paper.length - 1 ? (
              <Button label="Weiter" onPress={() => setAt((i) => i + 1)} />
            ) : (
              <Button label="Abgeben" onPress={finish} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
