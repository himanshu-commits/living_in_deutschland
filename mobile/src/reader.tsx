import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Illustration } from "./media";
import { images } from "./imageMap";
import { Image } from "react-native";
import type { Question } from "./questions";
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

/** One question as study material: the correct answer is always visible. */
function QuestionCard({ q }: { q: Question }) {
  const c = useColors();
  const { lang, translate, marked, toggleMark } = useStore();
  const tr = lang && lang !== "de" && translate ? q.tr?.[lang] : undefined;
  const isMarked = marked.includes(q.id);
  const picture = q.media?.kind === "options" && q.media.files.length === 4;

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
        <Text style={{ ...type.label, color: c.textMuted }}>
          {q.scope === "ALL" ? `#${q.num ?? ""}`.replace("#undefined", q.id) : q.id}
        </Text>
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
            <View
              key={file}
              style={{
                width: "47%",
                flexGrow: 1,
                borderColor: i === q.answer ? c.correct : c.border,
                borderWidth: i === q.answer ? 2 : StyleSheet.hairlineWidth,
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
                  color: i === q.answer ? c.correct : c.textMuted,
                }}
              >
                Bild {i + 1}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        q.options.map((text, i) => {
          const right = i === q.answer;
          return (
            <View key={i} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  marginTop: 2,
                  backgroundColor: right ? c.correct : c.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ ...type.label, fontSize: 9, color: right ? "#fff" : c.textMuted }}>
                  {"ABCD"[i]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...type.body,
                    fontSize: 15,
                    color: right ? c.correct : c.textMuted,
                    fontWeight: right ? "600" : "400",
                  }}
                >
                  {text}
                </Text>
                {tr && <Translated text={tr.options[i]} small />}
              </View>
            </View>
          );
        })
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

/** Shared list used by both "All questions" and "Marked questions". */
export function QuestionList({
  questions,
  filters,
  empty,
}: {
  questions: Question[];
  filters?: { key: string; label: string; test: (q: Question) => boolean }[];
  empty?: string;
}) {
  const c = useColors();
  const [active, setActive] = useState<string>(filters?.[0]?.key ?? "");
  const shown = useMemo(() => {
    const f = filters?.find((x) => x.key === active);
    return f ? questions.filter(f.test) : questions;
  }, [questions, filters, active]);

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
                onPress={() => setActive(f.key)}
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

      {shown.length === 0 ? (
        <View style={{ padding: spacing.xl }}>
          <Text style={{ ...type.body, color: c.textMuted, textAlign: "center" }}>{empty}</Text>
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(q) => q.id}
          renderItem={({ item }) => <QuestionCard q={item} />}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md }}
          initialNumToRender={6}
          windowSize={7}
        />
      )}
    </View>
  );
}
