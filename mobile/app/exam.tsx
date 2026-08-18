import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { Button, Card, Label, Notice, Option, ProgressBar } from "@/components";
import { useEntitlement } from "@/entitlements";
import { FREE_EXAMS_TOTAL, useFreeExamAccess } from "@/exam-limits";
import { HeaderBackButton, ScreenHeader } from "@/header";
import { Illustration, ImageOptions } from "@/media";
import { EXAM, examPaper, shuffledOptionIndices, type Question } from "@/questions";
import { useStore, useT } from "@/storage";
import { layout, spacing, type, useColors } from "@/theme";
import { useAds } from "@/ads";
import { studyCopy } from "@/study-copy";

function mmss(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Exam() {
  const c = useColors();
  const { t, fill } = useT();
  const { ready, lang, state, record, saveTest } = useStore();
  const copy = studyCopy(lang ?? "de");
  const { isPremium, status: entitlementStatus } = useEntitlement();
  const { showInterstitial } = useAds();
  const examAccess = useFreeExamAccess(isPremium, entitlementStatus === "loading" || !ready || !state);
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
    if (done || examAccess.state !== "allowed") return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [done, examAccess.state]);

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

  if (!ready || examAccess.state === "checking") return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!state) return <Redirect href="/bundesland" />;

  if (examAccess.state === "blocked") {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={t.test} />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <Notice tone="info">{fill(copy.freeExamsUsed, { n: FREE_EXAMS_TOTAL })}</Notice>
          <Button label={copy.seePremium} onPress={() => router.push({ pathname: "/premium", params: { feature: "unlimited_exams" } })} />
          <Button label={t.back} variant="ghost" onPress={() => router.replace("/")} />
        </View>
      </View>
    );
  }

  const correct = paper.filter((q, i) => answers[i] === q.answer).length;

  async function leaveResults() {
    await showInterstitial();
    router.replace("/");
  }

  if (done) {
    const passed = correct >= EXAM.pass;
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader
          title={t.test}
          menu={false}
          left={<HeaderBackButton label={t.back} onPress={leaveResults} />}
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            width: "100%",
            maxWidth: layout.contentMaxWidth,
            alignSelf: "center",
            padding: spacing.lg,
            gap: spacing.lg,
          }}
        >
        <Card>
          <Label>{passed ? t.passed : t.notPassed}</Label>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginVertical: spacing.sm }}>
            <Text style={{ ...type.title, fontSize: 52, color: passed ? c.correct : c.wrong }}>{correct}</Text>
            <Text style={{ ...type.heading, color: c.textMuted }}>/ {paper.length}</Text>
          </View>
          <ProgressBar value={correct / paper.length} />
          <Text style={{ ...type.body, color: c.textMuted, marginTop: spacing.md }}>
            {copy.passSummary}
          </Text>
        </Card>

        {paper.map((q, i) => {
          const ok = answers[i] === q.answer;
          return (
            <Card key={q.id}>
              <Label>
                {i + 1}. {ok ? t.correct : t.wrong}
              </Label>
              <Text style={{ ...type.body, color: c.text, marginVertical: spacing.sm }}>{q.question}</Text>
              <Text style={{ ...type.body, fontSize: 14, color: ok ? c.correct : c.wrong }}>
                {answers[i] === null ? t.notAnswered : `${t.yourAnswer}: ${q.options[answers[i]!]}`}
              </Text>
              {!ok && (
                <Text style={{ ...type.body, fontSize: 14, color: c.correct, marginTop: spacing.xs }}>
                  {t.correct}: {q.answer !== null ? q.options[q.answer] : "—"}
                </Text>
              )}
            </Card>
          );
        })}

        <Button label={t.back} onPress={leaveResults} />
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
      copy.submitTitle,
      fill(copy.unanswered, { n: missing }),
      [
        { text: copy.keepEditing, style: "cancel" },
        { text: t.submit, style: "destructive", onPress: () => setDone(true) },
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
      <View
        style={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label>
            {fill(t.questionOf, { n: at + 1, total: paper.length })}
          </Label>
          <Text style={{ ...type.mono, fontWeight: "700", color: left < 300 ? c.wrong : c.textMuted }}>
            {mmss(left)}
          </Text>
        </View>
        <ProgressBar value={answeredCount / paper.length} />
      </View>

      <ScrollView
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.lg,
          paddingTop: 0,
          gap: spacing.md,
        }}
      >
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
              <Button label={t.back} variant="ghost" onPress={() => setAt((i) => i - 1)} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            {at < paper.length - 1 ? (
              <Button label={t.next} onPress={() => setAt((i) => i + 1)} />
            ) : (
              <Button label={t.submit} onPress={finish} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
