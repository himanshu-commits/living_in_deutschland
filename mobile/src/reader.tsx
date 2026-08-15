import { useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Option } from "./components";
import { HeaderBackButton, ScreenHeader } from "./header";
import { Illustration } from "./media";
import { images } from "./imageMap";
import { Image } from "react-native";
import { shuffledOptionIndices, type Question } from "./questions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStore, useT } from "./storage";
import { layout, radius, spacing, type, useColors } from "./theme";

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
  const { t } = useT();
  const label = on ? t.markedAction : t.markAction;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: on ? c.accent : c.border,
        backgroundColor: on ? c.accent : c.surface,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text style={{ fontSize: 15, color: on ? c.accentText : c.textMuted }}>{on ? "★" : "☆"}</Text>
      <Text style={{ ...type.label, fontSize: 11, color: on ? c.accentText : c.text }}>{label}</Text>
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
  optionOrder,
  picked,
  onPick,
}: {
  q: Question;
  position: string;
  mode: Mode;
  optionOrder: number[];
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
          {optionOrder.map((originalIndex, displayIndex) => {
            const file = q.media!.files[originalIndex];
            return (
            <Pressable
              key={file}
              disabled={mode === "read" || picked !== undefined}
              onPress={() => onPick?.(originalIndex)}
              accessibilityRole={mode === "attempt" ? "radio" : "image"}
              accessibilityState={{ selected: picked === originalIndex }}
              style={{
                width: "47%",
                flexGrow: 1,
                borderColor: reveal(originalIndex) ? c.correct : wrongPick(originalIndex) ? c.wrong : c.border,
                borderWidth: reveal(originalIndex) || wrongPick(originalIndex) ? 2 : StyleSheet.hairlineWidth,
                borderRadius: radius.md,
                padding: spacing.sm,
                backgroundColor: c.surface,
              }}
            >
              <Image
                source={images[file]}
                resizeMode="contain"
                accessibilityLabel={q.media!.alt[originalIndex]}
                style={{ width: "100%", height: 96 }}
              />
              <Text
                style={{
                  ...type.label,
                  fontSize: 10,
                  textAlign: "center",
                  color: reveal(originalIndex) ? c.correct : wrongPick(originalIndex) ? c.wrong : c.textMuted,
                }}
              >
                Bild {displayIndex + 1}
              </Text>
            </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.xs }}>
          {optionOrder.map((originalIndex, displayIndex) => (
            <Option
              key={originalIndex}
              index={displayIndex}
              text={q.options[originalIndex]}
              disabled={mode === "read" || picked !== undefined}
              onPress={() => onPick?.(originalIndex)}
              state={reveal(originalIndex) ? "correct" : wrongPick(originalIndex) ? "wrong" : "idle"}
              subtitle={tr ? <Translated text={tr.options[originalIndex]} small /> : undefined}
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
            : `${t.wrong} — ${fill(t.answerIs, {
                letter: "ABCD"[q.answer === null ? 0 : optionOrder.indexOf(q.answer)],
              })}`}
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
  title,
  questions,
  filters,
  empty,
  mode = "read",
}: {
  title: string;
  questions: Question[];
  filters?: { key: string; label: string; test: (q: Question) => boolean }[];
  empty?: string;
  mode?: Mode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { t, fill } = useT();
  const { record, marked, mistakes, progress } = useStore();
  const [active, setActive] = useState<string>(filters?.[0]?.key ?? "");
  const [at, setAt] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [revealedQuestion, setRevealedQuestion] = useState<string | null>(null);
  // Latest attempts drive the session score and picker colors; reveal state is
  // separate so revisiting a practice question starts a clean new attempt.
  const [picks, setPicks] = useState<Record<string, number>>({});
  const scroller = useRef<ScrollView>(null);
  // One random order per question and QuestionList mount. Leaving and returning
  // keeps the order; starting a new reader/practice session creates new ones.
  const optionOrders = useRef<Record<string, number[]>>({});

  const shown = useMemo(() => {
    const f = filters?.find((x) => x.key === active);
    return f ? questions.filter(f.test) : questions;
  }, [questions, filters, active]);

  // changing the filter, or un-marking the last question, can leave the cursor
  // past the end of the list
  const index = Math.min(at, Math.max(0, shown.length - 1));
  const q = shown[index];
  const optionOrder = q
    ? (optionOrders.current[q.id] ??= shuffledOptionIndices(q.options.length))
    : [];

  const answeredIds = Object.keys(picks);
  const answeredCount = answeredIds.length;
  const rightCount = answeredIds.filter(
    (id) => picks[id] === questions.find((x) => x.id === id)?.answer
  ).length;

  function go(delta: number) {
    const next = Math.min(shown.length - 1, Math.max(0, index + delta));
    setRevealedQuestion(null);
    setAt(next);
    scroller.current?.scrollTo({ y: 0, animated: false });
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        title={title}
        left={<HeaderBackButton label={t.back} onPress={() => router.back()} />}
        right={<TranslateToggle />}
      />
      {filters && (
        <View
          style={{
            width: "100%",
            maxWidth: layout.contentMaxWidth,
            alignSelf: "center",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            padding: spacing.lg,
            paddingBottom: spacing.sm,
          }}
        >
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
                  setRevealedQuestion(null);
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
            contentContainerStyle={{
              width: "100%",
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
              padding: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.xl,
            }}
          >
            <QuestionCard
              q={q}
              position={`${index + 1}`}
              mode={mode}
              optionOrder={optionOrder}
              picked={revealedQuestion === q.id ? picks[q.id] : undefined}
              onPick={(choice) => {
                if (revealedQuestion === q.id) return;
                setPicks((prev) => ({ ...prev, [q.id]: choice }));
                setRevealedQuestion(q.id);
                record(q.id, choice === q.answer);
              }}
            />
          </ScrollView>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              width: "100%",
              maxWidth: layout.contentMaxWidth,
              alignSelf: "center",
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
              accessibilityLabel={`Choose question. ${fill(t.questionOf, { n: index + 1, total: shown.length })}`}
              onPress={() => setPickerOpen(true)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                paddingVertical: spacing.xs,
                borderRadius: radius.md,
                backgroundColor: pressed ? c.surfaceAlt : "transparent",
              })}
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

          <Modal
            visible={pickerOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setPickerOpen(false)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: c.bg,
                paddingTop: Math.max(insets.top, spacing.lg),
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.md,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.border,
                }}
              >
                <Text style={{ ...type.heading, color: c.text }}>Choose a question</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close question picker"
                  onPress={() => setPickerOpen(false)}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.pill,
                    backgroundColor: pressed ? c.surfaceAlt : c.surface,
                  })}
                >
                  <Text style={{ ...type.label, color: c.text }}>Close</Text>
                </Pressable>
              </View>

              <FlatList
                data={shown}
                style={{
                  width: "100%",
                  maxWidth: layout.contentMaxWidth,
                  alignSelf: "center",
                }}
                keyExtractor={(item) => item.id}
                initialScrollIndex={index}
                getItemLayout={(_, i) => ({ length: 56, offset: 56 * i, index: i })}
                contentContainerStyle={{
                  padding: spacing.lg,
                  paddingBottom: Math.max(insets.bottom, spacing.lg),
                }}
                renderItem={({ item, index: itemIndex }) => {
                  const selected = itemIndex === index;
                  const picked = picks[item.id];
                  const status =
                    picked !== undefined
                      ? picked === item.answer
                        ? "correct"
                        : "incorrect"
                      : !progress[item.id]
                        ? "unanswered"
                        : mistakes.includes(item.id)
                          ? "incorrect"
                          : "correct";
                  const isMarked = marked.includes(item.id);
                  const statusColor = status === "correct" ? c.correct : status === "incorrect" ? c.wrong : c.border;
                  const statusBackground =
                    status === "correct" ? c.correctBg : status === "incorrect" ? c.wrongBg : c.surface;
                  return (
                    <View style={{ width: "100%", height: 56, justifyContent: "center" }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Question ${itemIndex + 1}, ${status}${isMarked ? ", marked" : ""}`}
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setAt(itemIndex);
                          setRevealedQuestion(null);
                          setPickerOpen(false);
                          scroller.current?.scrollTo({ y: 0, animated: false });
                        }}
                        style={({ pressed }) => ({
                          width: "100%",
                          height: 48,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: radius.md,
                          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                          borderColor: selected ? c.accent : statusColor,
                          backgroundColor: pressed ? c.surfaceAlt : statusBackground,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Text
                          style={{
                            ...type.label,
                            ...type.mono,
                            color: status === "correct" ? c.correct : status === "incorrect" ? c.wrong : c.text,
                          }}
                        >
                          {itemIndex + 1}
                        </Text>
                        {isMarked && (
                          <Text
                            accessibilityElementsHidden
                            style={{ position: "absolute", right: spacing.md, fontSize: 17, color: c.warn }}
                          >
                            ★
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  );
                }}
              />
            </View>
          </Modal>
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
        minWidth: 68,
        paddingHorizontal: spacing.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ ...type.body, fontWeight: "700", color: disabled ? c.textMuted : c.bg }}>
        {label}
      </Text>
    </Pressable>
  );
}
