import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Illustration } from "./media";
import { images } from "./imageMap";
import { Image } from "react-native";
import type { Question } from "./questions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore, useT } from "./storage";
import { radius, spacing, type, useColors } from "./theme";

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

  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
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

      <Text style={{ ...type.body, fontWeight: "600", color: c.text }}>{q.question}</Text>
      {tr && <Translated text={tr.question} />}

      {q.media && q.media.kind !== "options" && <Illustration media={q.media} />}

      {picture ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs }}>
          {q.media!.files.map((file, i) => (
            <Pressable
              key={file}
              disabled={mode === "read" || picked !== undefined}
              onPress={() => onPick?.(i)}
              accessibilityRole={mode === "attempt" ? "radio" : "image"}
              accessibilityState={{ selected: picked === i }}
              style={{
                width: "47%",
                flexGrow: 1,
                borderColor: reveal(i) ? c.correct : wrongPick(i) ? c.wrong : c.border,
                borderWidth: reveal(i) || wrongPick(i) ? 2 : StyleSheet.hairlineWidth,
                borderRadius: radius.md,
                padding: spacing.sm,
                backgroundColor: c.surface,
              }}
            >
              <Image
                source={images[file]}
                resizeMode="contain"
                accessibilityLabel={q.media!.alt[i]}
                style={{ width: "100%", height: 84 }}
              />
              <Text
                style={{
                  ...type.label,
                  fontSize: 10,
                  textAlign: "center",
                  color: reveal(i) ? c.correct : wrongPick(i) ? c.wrong : c.textMuted,
                }}
              >
                Bild {i + 1}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        q.options.map((text, i) => {
          const right = reveal(i);
          const bad = wrongPick(i);
          return (
            <Pressable
              key={i}
              disabled={mode === "read" || picked !== undefined}
              onPress={() => onPick?.(i)}
              accessibilityRole={mode === "attempt" ? "radio" : "text"}
              accessibilityState={{ selected: picked === i }}
              accessibilityLabel={`${"ABCD"[i]}. ${text}`}
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                alignItems: "flex-start",
                borderRadius: radius.md,
                borderWidth: mode === "attempt" ? StyleSheet.hairlineWidth : 0,
                borderColor: right ? c.correct : bad ? c.wrong : c.border,
                backgroundColor: right ? c.correctBg : bad ? c.wrongBg : "transparent",
                padding: mode === "attempt" ? spacing.md : 0,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  marginTop: 2,
                  backgroundColor: right ? c.correct : bad ? c.wrong : c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.label, fontSize: 9, color: right || bad ? "#fff" : c.textMuted }}>
                  {"ABCD"[i]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...type.body,
                    fontSize: 15,
                    color: right ? c.correct : bad ? c.wrong : mode === "attempt" ? c.text : c.textMuted,
                    fontWeight: right ? "600" : "400",
                  }}
                >
                  {text}
                </Text>
                {tr && <Translated text={tr.options[i]} small />}
              </View>
            </Pressable>
          );
        })
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
            : `${t.wrong} — ${fill(t.answerIs, { letter: "ABCD"[q.answer ?? 0] })}`}
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
  const { record } = useStore();
  const [active, setActive] = useState<string>(filters?.[0]?.key ?? "");
  const [at, setAt] = useState(0);
  // answers are kept per question id, so going back shows what you picked
  const [picks, setPicks] = useState<Record<string, number>>({});
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
            contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
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
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ ...type.label, ...type.mono, color: c.textMuted }}>
                {fill(t.questionOf, { n: index + 1, total: shown.length })}
              </Text>
              {mode === "attempt" && answeredCount > 0 && (
                <Text style={{ ...type.label, ...type.mono, fontSize: 11, color: c.correct }}>
                  {fill(t.yourScore, { n: rightCount, total: answeredCount })}
                </Text>
              )}
            </View>
            <NavButton
              label={t.next}
              disabled={index >= shown.length - 1}
              onPress={() => go(1)}
            />
          </View>
        </>
      )}
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
