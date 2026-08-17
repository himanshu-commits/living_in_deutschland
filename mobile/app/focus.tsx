import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Label } from "@/components";
import { useEntitlement } from "@/entitlements";
import { focusCategoryName, focusQuestions, type FocusKind } from "@/focus";
import { ScreenHeader } from "@/header";
import { poolFor, type Question } from "@/questions";
import { QuestionList } from "@/reader";
import { useStore } from "@/storage";
import { layout, spacing, type, useColors } from "@/theme";

type Result = { correct: number; total: number; stabilized: number };

export default function FocusDrill() {
  const c = useColors();
  const params = useLocalSearchParams<{ kind?: string; category?: string; mode?: string }>();
  const { status } = useEntitlement();
  const { ready, lang, state, progress } = useStore();
  const [result, setResult] = useState<Result | null>(null);
  const drillRef = useRef<Question[] | null>(null);
  const kind: FocusKind = params.kind === "errors" ? "errors" : "category";
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const readMode = params.mode === "read";
  const pool = state ? poolFor(state) : [];

  function buildDrill(exclude: string[] = []) {
    if (readMode) {
      return focusQuestions(pool, progress, kind, category, state ?? undefined, Number.MAX_SAFE_INTEGER);
    }
    const expanded = focusQuestions(pool, progress, kind, category, state ?? undefined, 40);
    const fresh = expanded.filter((question) => !exclude.includes(question.id));
    const repeated = expanded.filter((question) => exclude.includes(question.id));
    return [...fresh, ...repeated].slice(0, 20);
  }

  if (ready && state && !drillRef.current) {
    drillRef.current = buildDrill();
  }

  if (!ready || status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;
  if (status !== "premium") {
    return <Redirect href={{ pathname: "/premium", params: { feature: "analytics" } }} />;
  }

  const title = kind === "errors" ? "Error recovery" : focusCategoryName(category ?? "", state);
  const questions = drillRef.current ?? [];

  if (result) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title="Session complete" />
        <View
          style={{
            width: "100%",
            maxWidth: layout.contentMaxWidth,
            alignSelf: "center",
            padding: spacing.lg,
            gap: spacing.lg,
          }}
        >
          <Card>
            <Label>{title}</Label>
            <Text style={{ ...type.title, color: c.text, marginTop: spacing.sm }}>
              {result.correct} of {result.total} correct
            </Text>
            <Text style={{ ...type.body, color: c.textMuted, marginTop: spacing.sm }}>
              {kind === "errors"
                ? `${result.stabilized} question${result.stabilized === 1 ? "" : "s"} now have the two-answer streak required for stability.`
                : "Your answers are already reflected in the area scores and recommendations."}
            </Text>
          </Card>
          <Button label="View updated analytics" onPress={() => router.replace("/analytics")} />
          <Button
            label="Start another focused session"
            variant="ghost"
            onPress={() => {
              drillRef.current = buildDrill(questions.map((question) => question.id));
              setResult(null);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <QuestionList
      title={readMode ? `Review · ${title}` : title}
      questions={questions}
      mode={readMode ? "read" : "attempt"}
      empty={kind === "errors" ? "No persistent errors remain. Your recovery queue is clear." : "No questions are available for this area."}
      onComplete={readMode ? undefined : ({ correct, total }) => {
        const stabilized = kind === "errors"
          ? questions.filter((question) => (progress[question.id]?.streak ?? 0) >= 2).length
          : 0;
        setResult({ correct, total, stabilized });
      }}
      completeLabel="Results"
    />
  );
}
