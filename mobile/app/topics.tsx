import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/header";
import { useEntitlement } from "@/entitlements";
import { usePremiumGate } from "@/premium";
import { TOPICS, type TopicGroup } from "@/topics";
import { stateName } from "@/stateNames";
import { useStore, useT } from "@/storage";
import { layout, radius, spacing, type, useColors } from "@/theme";

const groups: TopicGroup[] = ["democracy", "history", "society"];

export default function Topics() {
  const c = useColors();
  const { ready, lang, state } = useStore();
  const { t, lang: interfaceLang } = useT();
  const { isPremium } = useEntitlement();
  const premiumGate = usePremiumGate();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t.topics} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.lg,
          gap: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text style={{ ...type.body, color: c.textMuted }}>{t.topicsNote}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Adaptive weak-topic drill"
          onPress={() => premiumGate("adaptive", () => router.push("/adaptive"))}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.md,
            padding: spacing.lg,
            borderRadius: radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.accent,
            backgroundColor: c.surface,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.body, fontWeight: "700", color: c.text }}>
              Adaptive weak-topic drill
            </Text>
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted }}>
              {isPremium
                ? "20 questions selected from the topics that need work"
                : "Premium · Automatically focus on your weaker topics"}
            </Text>
          </View>
          <Text style={{ ...type.heading, fontSize: 20, color: c.accent }}>
            {isPremium ? "20" : "🔒"}
          </Text>
        </Pressable>
        {groups.map((group) => {
          const entries = TOPICS.filter((entry) => entry.group === group);
          const questionCount = entries.reduce((sum, entry) => sum + entry.questionNumbers.length, 0);
          return (
            <View key={group} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
                <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>
                  {t.topicGroups[group]}
                </Text>
                <Text style={{ ...type.label, fontSize: 11, color: c.textMuted }}>
                  {questionCount} {t.questionsLabel}
                </Text>
              </View>
              <View
                style={{
                  overflow: "hidden",
                  borderRadius: radius.lg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                }}
              >
                {entries.map((entry, index) => (
                  <TopicRow
                    key={entry.id}
                    name={entry.name}
                    count={entry.questionNumbers.length}
                    divided={index > 0}
                    readLabel={t.readTopic}
                    practiceLabel={t.practice}
                    questionsLabel={t.questionsLabel}
                    onRead={() =>
                      router.push({ pathname: "/topic", params: { id: entry.id, mode: "read" } })
                    }
                    onPractice={() =>
                      router.push({ pathname: "/topic", params: { id: entry.id, mode: "attempt" } })
                    }
                  />
                ))}
              </View>
            </View>
          );
        })}
        {state && (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>
              {t.yourState}
            </Text>
            <View
              style={{
                overflow: "hidden",
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.border,
                backgroundColor: c.surface,
              }}
            >
              <TopicRow
                name={stateName(state, interfaceLang)}
                count={10}
                readLabel={t.readTopic}
                practiceLabel={t.practice}
                questionsLabel={t.questionsLabel}
                onRead={() =>
                  router.push({ pathname: "/topic", params: { id: "state", mode: "read" } })
                }
                onPractice={() =>
                  router.push({ pathname: "/topic", params: { id: "state", mode: "attempt" } })
                }
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TopicRow({
  name,
  count,
  divided,
  readLabel,
  practiceLabel,
  questionsLabel,
  onRead,
  onPractice,
}: {
  name: string;
  count: number;
  divided?: boolean;
  readLabel: string;
  practiceLabel: string;
  questionsLabel: string;
  onRead: () => void;
  onPractice: () => void;
}) {
  const c = useColors();
  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
        borderTopWidth: divided ? StyleSheet.hairlineWidth : 0,
        borderTopColor: c.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm }}>
        <Text numberOfLines={2} style={{ ...type.body, fontWeight: "700", color: c.text, flex: 1 }}>
          {name}
        </Text>
        <Text style={{ ...type.label, fontSize: 11, color: c.textMuted }}>
          {count} {questionsLabel}
        </Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
        <CompactAction label={readLabel} onPress={onRead} />
        <CompactAction label={practiceLabel} filled onPress={onPractice} />
      </View>
    </View>
  );
}

function CompactAction({ label, filled, onPress }: { label: string; filled?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        minWidth: 88,
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: filled ? c.accent : c.border,
        backgroundColor: filled ? c.accent : "transparent",
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ ...type.label, fontSize: 11, color: filled ? c.accentText : c.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
