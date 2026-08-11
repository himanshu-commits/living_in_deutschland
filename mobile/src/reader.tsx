import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Option } from "./components";
import { Illustration } from "./media";
import { images } from "./imageMap";
import { Image } from "react-native";
import { shuffle, type Question } from "./questions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore, useT, type Progress } from "./storage";
import { radius, spacing, type, useColors } from "./theme";

/** Display order for a question's options, re-rolled each time it's opened
 *  (see the useMemo keyed on q.id below) so the answer can't be learned by
 *  its position instead of its content. */
function optionOrder(count: number): number[] {
  return shuffle(Array.from({ length: count }, (_, i) => i));
}

type QStatus = "unanswered" | "correct" | "incorrect";

/** Same rule as storage.ts's mastered()/weakest(): most-recent-tendency wins. */
function statusFor(progress: Progress, id: string): QStatus {
  const s = progress[id];
  if (!s || s.seen === 0) return "unanswered";
  if (s.correct > 0 && s.correct >= s.wrong) return "correct";
  if (s.wrong > 0) return "incorrect";
  return "unanswered";
}

/** The translate control that sits in every reader header. */
export function TranslateToggle() {
  const c = useColors();
  const { lang, translate, setTranslate } = useStore();
  if (!lang || lang === "de") return null; // nothing to translate into
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: translate }}
      accessibilityLabel={`Translation ${translate ? "on" : "off"}`}
      onPress={() => setTranslate(!translate)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: translate ? c.accent : c.surface,
        borderColor: translate ? c.accent : c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: 5,
        paddingHorizontal: 11,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontSize: 12 }}>🌐</Text>
      <Text
        style={{
          ...type.label,
          fontSize: 11,
          color: translate ? c.accentText : c.textMuted,
        }}
      >
        {lang.toUpperCase()}
      </Text>
    </Pressable>
  );
}

function Star({ on, onPress }: { on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={on ? "Marked" : "Not marked"}
      hitSlop={10}
      onPress={onPress}
    >
      <Text style={{ fontSize: 19, color: on ? c.accent : c.textMuted }}>{on ? "★" : "☆"}</Text>
    </Pressable>
  );
}

export type Mode = "read" | "attempt";

/** A question card.
 *  read    - study material, the correct answer is always visible
 *  attempt - nothing is revealed until the user picks an option */
function QuestionCard({
  q,
  position,
  mode,
  picked,
  onPick,
}: {
  q: Question;
  position: string;
  mode: Mode;
  picked?: number;
  onPick?: (index: number) => void;
}) {
  const c = useColors();
  const { t, fill } = useT();
  const { lang, translate, marked, toggleMark } = useStore();
  const tr = lang && lang !== "de" && translate ? q.tr?.[lang] : undefined;
  const isMarked = marked.includes(q.id);
  const picture = q.media?.kind === "options" && q.media.files.length === 4;
  const answered = mode === "read" || picked !== undefined;
  // in attempt mode the answer stays hidden until the user commits to one
  const reveal = (i: number) => answered && i === q.answer;
  const wrongPick = (i: number) => picked !== undefined && i === picked && i !== q.answer;
  // re-rolled on every new question (q.id changes), so the answer can't be
  // learned by its on-screen slot
  const order = useMemo(
    () => optionOrder(picture ? q.media!.files.length : q.options.length),
    [q.id]
  );
  const answerLetter = "ABCD"[order.indexOf(q.answer ?? 0)] ?? "?";

  return (
    // no card around it: one question already fills the screen, and a border
    // inside a border is what made this feel cramped next to the exam
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.xs,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}>
          <Text style={{ ...type.heading, ...type.mono, fontSize: 20, color: c.text }}>
            {position}
          </Text>
          {/* the catalogue's own Aufgabe number, for cross-checking against the PDF */}
          <Text style={{ ...type.label, color: c.textMuted }}>
            {q.scope === "ALL" ? `Aufgabe ${q.num}` : `${q.scope} ${q.num}`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          {!q.verified && (
            <Text style={{ ...type.label, fontSize: 10, color: c.warn }}>!</Text>
          )}
          <Star on={isMarked} onPress={() => toggleMark(q.id)} />
        </View>
      </View>

      <Text style={{ ...type.question, color: c.text }}>{q.question}</Text>
      {tr && <Translated text={tr.question} />}

      {q.media && q.media.kind !== "options" && <Illustration media={q.media} />}

      {picture ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xs }}>
          {order.map((origIdx, pos) => (
            <Pressable
              key={q.media!.files[origIdx]}
              disabled={mode === "read" || picked !== undefined}
              onPress={() => onPick?.(origIdx)}
              accessibilityRole={mode === "attempt" ? "radio" : "image"}
              accessibilityState={{ selected: picked === origIdx }}
              style={{
                width: "47%",
                flexGrow: 1,
                borderColor: reveal(origIdx) ? c.correct : wrongPick(origIdx) ? c.wrong : c.border,
                borderWidth: reveal(origIdx) || wrongPick(origIdx) ? 2 : StyleSheet.hairlineWidth,
                borderRadius: radius.md,
                padding: spacing.sm,
                backgroundColor: c.surface,
              }}
            >
              <Image
                source={images[q.media!.files[origIdx]]}
                resizeMode="contain"
                accessibilityLabel={q.media!.alt[origIdx]}
                style={{ width: "100%", height: 96 }}
              />
              <Text
                style={{
                  ...type.label,
                  fontSize: 10,
                  textAlign: "center",
                  color: reveal(origIdx) ? c.correct : wrongPick(origIdx) ? c.wrong : c.textMuted,
                }}
              >
                Bild {pos + 1}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.xs }}>
          {order.map((origIdx, pos) => (
            <Option
              key={origIdx}
              index={pos}
              text={q.options[origIdx]}
              disabled={mode === "read" || picked !== undefined}
              onPress={() => onPick?.(origIdx)}
              state={reveal(origIdx) ? "correct" : wrongPick(origIdx) ? "wrong" : "idle"}
              subtitle={tr ? <Translated text={tr.options[origIdx]} small /> : undefined}
            />
          ))}
        </View>
      )}

      {mode === "attempt" && picked !== undefined && (
        <Text
          style={{
            ...type.body,
            fontWeight: "700",
            color: picked === q.answer ? c.correct : c.wrong,
            marginTop: spacing.xs,
          }}
        >
          {picked === q.answer
            ? t.correct
            : `${t.wrong} — ${fill(t.answerIs, { letter: answerLetter })}`}
        </Text>
      )}
    </View>
  );
}

function Translated({ text, small }: { text: string; small?: boolean }) {
  const c = useColors();
  return (
    <Text
      style={{
        ...type.body,
        fontSize: small ? 13 : 14,
        color: c.textMuted,
        borderLeftWidth: small ? 1.5 : 2,
        borderLeftColor: c.accent,
        paddingLeft: spacing.sm,
        marginTop: 3,
      }}
    >
      {text}
    </Text>
  );
}

/** Shared pager used by both "All questions" and "Marked questions".
 *  One question per screen: the catalogue is 310 items long, and a single
 *  scrolling page gives no sense of place or progress. */
export function QuestionList({
  questions,
  filters,
  empty,
  mode = "read",
}: {
  questions: Question[];
  filters?: { key: string; label: string; test: (q: Question) => boolean }[];
  empty?: string;
  mode?: Mode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { t, fill } = useT();
  const { record, progress, marked } = useStore();
  const [active, setActive] = useState<string>(filters?.[0]?.key ?? "");
  const [at, setAt] = useState(0);
  // answers are kept per question id, so going back shows what you picked
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [jumpOpen, setJumpOpen] = useState(false);
  const scroller = useRef<ScrollView>(null);

  const shown = useMemo(() => {
    const f = filters?.find((x) => x.key === active);
    return f ? questions.filter(f.test) : questions;
  }, [questions, filters, active]);

  // changing the filter, or un-marking the last question, can leave the cursor
  // past the end of the list
  const index = Math.min(at, Math.max(0, shown.length - 1));
  const q = shown[index];

  const answeredIds = Object.keys(picks);
  const answeredCount = answeredIds.length;
  const rightCount = answeredIds.filter(
    (id) => picks[id] === questions.find((x) => x.id === id)?.answer
  ).length;

  function go(delta: number) {
    const next = Math.min(shown.length - 1, Math.max(0, index + delta));
    setAt(next);
    scroller.current?.scrollTo({ y: 0, animated: false });
  }

  function jumpTo(i: number) {
    setAt(i);
    scroller.current?.scrollTo({ y: 0, animated: false });
    setJumpOpen(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {filters && (
        <View style={{ flexDirection: "row", gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm }}>
          {filters.map((f) => {
            const on = f.key === active;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setActive(f.key);
                  setAt(0);
                }}
                style={{
                  backgroundColor: on ? c.text : c.surface,
                  borderColor: on ? c.text : c.border,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderRadius: radius.pill,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
              >
                <Text style={{ ...type.label, fontSize: 11, color: on ? c.bg : c.textMuted }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!q ? (
        <View style={{ padding: spacing.xl }}>
          <Text style={{ ...type.body, color: c.textMuted, textAlign: "center" }}>{empty}</Text>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scroller}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl }}
          >
            <QuestionCard
              q={q}
              position={`${index + 1}`}
              mode={mode}
              picked={picks[q.id]}
              onPick={(choice) => {
                if (picks[q.id] !== undefined) return; // first answer counts
                setPicks((prev) => ({ ...prev, [q.id]: choice }));
                record(q.id, choice === q.answer);
              }}
            />
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: c.border,
              backgroundColor: c.bg,
            }}
          >
            <NavButton
              label={t.back}
              disabled={index === 0}
              onPress={() => go(-1)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={fill(t.questionOf, { n: index + 1, total: shown.length })}
              onPress={() => setJumpOpen(true)}
              style={({ pressed }) => ({ flex: 1, alignItems: "center", opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={{ ...type.label, ...type.mono, color: c.textMuted }}>
                {fill(t.questionOf, { n: index + 1, total: shown.length })}
              </Text>
              {mode === "attempt" && answeredCount > 0 && (
                <Text style={{ ...type.label, ...type.mono, fontSize: 11, color: c.correct }}>
                  {fill(t.yourScore, { n: rightCount, total: answeredCount })}
                </Text>
              )}
            </Pressable>
            <NavButton
              label={t.next}
              disabled={index >= shown.length - 1}
              onPress={() => go(1)}
            />
          </View>
        </>
      )}

      <JumpList
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        questions={shown}
        current={index}
        progress={progress}
        marked={marked}
        onJump={jumpTo}
      />
    </View>
  );
}

function NavButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: disabled ? c.surfaceAlt : c.text,
        borderRadius: radius.pill,
        paddingVertical: 12,
        paddingHorizontal: spacing.xl,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ ...type.body, fontWeight: "700", color: disabled ? c.textMuted : c.bg }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Sheet listing every question by number, colored by status, tap to jump. */
function JumpList({
  open,
  onClose,
  questions,
  current,
  progress,
  marked,
  onJump,
}: {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  current: number;
  progress: Progress;
  marked: string[];
  onJump: (index: number) => void;
}) {
  const c = useColors();
  const { t } = useT();
  if (!open) return null;

  const statusStyle: Record<QStatus, { bg: string; border: string }> = {
    unanswered: { bg: c.surface, border: c.border },
    correct: { bg: c.correctBg, border: c.correct },
    incorrect: { bg: c.wrongBg, border: c.wrong },
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "72%",
          backgroundColor: c.bg,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          paddingTop: spacing.lg,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Text style={{ ...type.heading, color: c.text, marginBottom: spacing.md }}>{t.jumpTo}</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginBottom: spacing.md }}>
          <Legend swatch={statusStyle.unanswered} label={t.notAnswered} />
          <Legend swatch={statusStyle.correct} label={t.correct} />
          <Legend swatch={statusStyle.incorrect} label={t.wrong} />
          <Legend star label={t.marked} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {questions.map((q, i) => {
              const status = statusFor(progress, q.id);
              const sc = statusStyle[status];
              const isCurrent = i === current;
              const isMarked = marked.includes(q.id);
              return (
                <Pressable
                  key={q.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${i + 1}, ${status}${isMarked ? ", marked" : ""}`}
                  onPress={() => onJump(i)}
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isCurrent ? c.text : sc.bg,
                    borderColor: isCurrent ? c.text : sc.border,
                    borderWidth: isCurrent ? 2 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      ...type.body,
                      ...type.mono,
                      fontSize: 13,
                      fontWeight: "600",
                      color: isCurrent ? c.bg : c.text,
                    }}
                  >
                    {i + 1}
                  </Text>
                  {isMarked && (
                    <Text style={{ position: "absolute", top: -4, right: -4, fontSize: 12 }}>★</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function Legend({
  label,
  swatch,
  star,
}: {
  label: string;
  swatch?: { bg: string; border: string };
  star?: boolean;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      {star ? (
        <Text style={{ fontSize: 13, color: c.accent }}>★</Text>
      ) : (
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: radius.sm,
            borderWidth: StyleSheet.hairlineWidth,
            backgroundColor: swatch!.bg,
            borderColor: swatch!.border,
          }}
        />
      )}
      <Text style={{ ...type.label, fontSize: 11, color: c.textMuted }}>{label}</Text>
    </View>
  );
}
