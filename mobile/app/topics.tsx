import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/header";
import { TOPICS, type TopicGroup } from "@/topics";
import { useStore, useT } from "@/storage";
import { layout, radius, spacing, type, useColors } from "@/theme";

const groups: TopicGroup[] = ["democracy", "history", "society"];

export default function Topics() {
  const c = useColors();
  const { ready, lang, state } = useStore();
  const { t } = useT();

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
        {groups.map((group) => (
          <View key={group} style={{ gap: spacing.sm }}>
            <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>
              {t.topicGroups[group]}
            </Text>
            {TOPICS.filter((entry) => entry.group === group).map((entry) => (
              <View
                key={entry.id}
                style={{
                  gap: spacing.md,
                  padding: spacing.lg,
                  borderRadius: radius.lg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                }}
              >
                <View>
                  <Text style={{ ...type.body, fontWeight: "700", color: c.text }}>
                    {entry.name}
                  </Text>
                  <Text style={{ ...type.body, fontSize: 13, color: c.textMuted }}>
                    {entry.questionNumbers.length} {t.questionsLabel}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <TopicAction
                    label={t.readTopic}
                    onPress={() =>
                      router.push({ pathname: "/topic", params: { id: entry.id, mode: "read" } })
                    }
                  />
                  <TopicAction
                    label={t.practice}
                    filled
                    onPress={() =>
                      router.push({
                        pathname: "/topic",
                        params: { id: entry.id, mode: "attempt" },
                      })
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
        {state && (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>
              {t.yourState}
            </Text>
            <View
              style={{
                gap: spacing.md,
                padding: spacing.lg,
                borderRadius: radius.lg,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.border,
                backgroundColor: c.surface,
              }}
            >
              <View>
                <Text style={{ ...type.body, fontWeight: "700", color: c.text }}>{state}</Text>
                <Text style={{ ...type.body, fontSize: 13, color: c.textMuted }}>
                  10 {t.questionsLabel}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TopicAction
                  label={t.readTopic}
                  onPress={() =>
                    router.push({ pathname: "/topic", params: { id: "state", mode: "read" } })
                  }
                />
                <TopicAction
                  label={t.practice}
                  filled
                  onPress={() =>
                    router.push({
                      pathname: "/topic",
                      params: { id: "state", mode: "attempt" },
                    })
                  }
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TopicAction({
  label,
  filled,
  onPress,
}: {
  label: string;
  filled?: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: filled ? c.accent : c.border,
        backgroundColor: filled ? c.accent : c.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ ...type.label, color: filled ? c.accentText : c.text }}>{label}</Text>
    </Pressable>
  );
}
