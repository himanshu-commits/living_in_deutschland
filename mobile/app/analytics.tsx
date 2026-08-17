import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  analyse,
  analyseCategories,
  analyseTopics,
  persistentErrors,
  questionsNeededToPass,
  readinessConfidence,
} from "@/analysis";
import { useEntitlement } from "@/entitlements";
import { ScreenHeader } from "@/header";
import { poolFor } from "@/questions";
import { useStore } from "@/storage";
import { layout, radius, spacing, type, useColors } from "@/theme";

export default function Analytics() {
  const c = useColors();
  const { status } = useEntitlement();
  const { ready, lang, state, progress } = useStore();
  const [allTopicsOpen, setAllTopicsOpen] = useState(false);

  if (!ready || status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;
  if (status !== "premium") {
    return <Redirect href={{ pathname: "/premium", params: { feature: "analytics" } }} />;
  }

  const pool = poolFor(state);
  const summary = analyse(pool, progress);
  const topics = analyseTopics(pool, progress, state);
  const ranked = [...topics].sort((a, b) => {
    if (a.accuracy === null) return b.accuracy === null ? 0 : 1;
    if (b.accuracy === null) return -1;
    return a.accuracy - b.accuracy || a.mastery / a.questions - b.mastery / b.questions;
  });
  const totalAnswers = pool.reduce(
    (sum, question) => sum + (progress[question.id]?.correct ?? 0) + (progress[question.id]?.wrong ?? 0),
    0,
  );
  const coverage = Math.round((summary.attempted / summary.pool) * 100);
  const accuracy = summary.accuracy === null ? null : Math.round(summary.accuracy * 100);
  const priority = ranked.find((topic) => topic.attempted > 0);
  const confidence = readinessConfidence(pool, progress);
  const neededToPass = questionsNeededToPass(pool, progress);
  const categories = analyseCategories(pool, progress, state);
  const stubborn = persistentErrors(pool, progress);
  const visibleTopics = allTopicsOpen ? ranked : ranked.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title="Readiness analytics" />
      <ScrollView
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            overflow: "hidden",
            borderRadius: radius.xl,
            padding: spacing.xl,
            backgroundColor: c.text,
            gap: spacing.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.lg }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={{ ...type.label, color: c.bg, opacity: 0.65, textTransform: "uppercase" }}>
                Your exam outlook
              </Text>
              <Text style={{ ...type.title, color: c.bg }}>
                {summary.ready ? "You’re on track" : "Build your score"}
              </Text>
              <Text style={{ ...type.body, fontSize: 13, color: c.bg, opacity: 0.7 }}>
                Projection based on mastered questions, not just recent answers.
              </Text>
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: spacing.xs,
                  paddingVertical: 5,
                  paddingHorizontal: spacing.sm,
                  borderRadius: radius.pill,
                  backgroundColor: c.bg,
                }}
              >
                <Text style={{ ...type.label, fontSize: 10, color: c.text }}>
                  {confidence.level.toUpperCase()} CONFIDENCE · {Math.round(confidence.evidence * 100)}% EVIDENCE
                </Text>
              </View>
            </View>
            <View
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                borderWidth: 7,
                borderColor: summary.ready ? c.correct : c.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ ...type.title, fontSize: 34, color: c.bg }}>{summary.projected}</Text>
              <Text style={{ ...type.label, fontSize: 10, color: c.bg, opacity: 0.65 }}>OF 33</Text>
            </View>
          </View>
          <View style={{ gap: spacing.xs }}>
            <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: c.bg, opacity: 0.2 }}>
              <View
                style={{
                  width: `${Math.min(100, (summary.projected / 33) * 100)}%`,
                  height: "100%",
                  borderRadius: radius.pill,
                  backgroundColor: summary.ready ? c.correct : c.accent,
                }}
              />
            </View>
            <Text style={{ ...type.label, fontSize: 10, color: c.bg, opacity: 0.65 }}>
              PASS MARK 17 · PROJECTED {summary.projected}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Metric label="Coverage" value={`${coverage}%`} note={`${summary.attempted}/${summary.pool}`} />
          <Metric label="Accuracy" value={accuracy === null ? "—" : `${accuracy}%`} note="all attempts" />
          <Metric label="Answers" value={String(totalAnswers)} note="practice" />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...type.heading, color: c.text }}>Exam areas</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {categories.map((category) => {
              const mastery = category.mastery / Math.max(1, category.questions);
              const categoryAccuracy = category.accuracy === null ? null : Math.round(category.accuracy * 100);
              const tone = categoryAccuracy === null ? c.textMuted : categoryAccuracy >= 80 ? c.correct : categoryAccuracy >= 60 ? c.warn : c.wrong;
              return (
                <View
                  key={category.id}
                  style={{
                    width: "48%",
                    flexGrow: 1,
                    minWidth: 145,
                    padding: spacing.md,
                    borderRadius: radius.md,
                    backgroundColor: c.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: c.border,
                    gap: spacing.sm,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
                    <Text numberOfLines={2} style={{ ...type.label, color: c.text, flex: 1 }}>
                      {category.name}
                    </Text>
                    <Text style={{ ...type.label, ...type.mono, color: tone }}>
                      {categoryAccuracy === null ? "—" : `${categoryAccuracy}%`}
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.surfaceAlt }}>
                    <View style={{ width: `${mastery * 100}%`, height: "100%", borderRadius: radius.pill, backgroundColor: tone }} />
                  </View>
                  <Text style={{ ...type.body, fontSize: 11, color: c.textMuted }}>
                    {category.mastery}/{category.questions} mastered
                  </Text>
                  <View style={{ flexDirection: "row", gap: spacing.xs }}>
                    <AreaAction
                      label="Review all"
                      onPress={() => router.push({ pathname: "/focus", params: { kind: "category", category: category.id, mode: "read" } })}
                    />
                    <AreaAction
                      label="Practise 20"
                      filled
                      onPress={() => router.push({ pathname: "/focus", params: { kind: "category", category: category.id } })}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={{
            padding: spacing.lg,
            borderRadius: radius.lg,
            backgroundColor: c.surface,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.border,
            borderLeftWidth: 4,
            borderLeftColor: priority ? c.warn : c.accent,
            gap: spacing.sm,
          }}
        >
          <Text style={{ ...type.label, color: priority ? c.warn : c.accent, textTransform: "uppercase" }}>
            {priority ? "Your next best move" : "Start your baseline"}
          </Text>
          <Text style={{ ...type.heading, color: c.text }}>
            {priority ? `Strengthen ${priority.name}` : "Take an adaptive diagnostic"}
          </Text>
          <Text style={{ ...type.body, fontSize: 13, color: c.textMuted }}>
            {priority
              ? `${priority.wrong} wrong answers in this topic. ${neededToPass > 0 ? `Strengthen about ${neededToPass} more catalogue questions to enter the projected pass zone.` : "You are already in the projected pass zone—stabilize weak topics now."}`
              : "A short mixed session gives the app enough evidence to identify your first priority."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/adaptive")}
            style={({ pressed }) => ({
              alignSelf: "flex-start",
              marginTop: spacing.xs,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.pill,
              backgroundColor: c.accent,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ ...type.label, color: c.accentText }}>Start focused drill →</Text>
          </Pressable>
        </View>

        {stubborn.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <Text style={{ ...type.heading, color: c.text }}>Persistent errors</Text>
              <Text style={{ ...type.label, color: c.wrong }}>needs another look</Text>
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
              {stubborn.map((question, index) => {
                const stat = progress[question.id]!;
                return (
                  <View
                    key={question.id}
                    style={{
                      flexDirection: "row",
                      gap: spacing.md,
                      padding: spacing.md,
                      borderTopWidth: index ? StyleSheet.hairlineWidth : 0,
                      borderTopColor: c.border,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: c.wrongBg,
                      }}
                    >
                      <Text style={{ ...type.label, ...type.mono, color: c.wrong }}>{stat.wrong}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...type.label, color: c.textMuted }}>
                        {question.scope === "ALL" ? `Aufgabe ${question.num}` : `${question.scope} ${question.num}`}
                      </Text>
                      <Text numberOfLines={2} style={{ ...type.body, fontSize: 13, color: c.text }}>
                        {question.question}
                      </Text>
                    </View>
                  </View>
                );
              })}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: "/focus", params: { kind: "errors" } })}
                style={({ pressed }) => ({
                  alignItems: "center",
                  padding: spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.border,
                  backgroundColor: pressed ? c.surfaceAlt : c.wrongBg,
                })}
              >
                <Text style={{ ...type.label, color: c.wrong }}>Fix these errors →</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <View>
              <Text style={{ ...type.heading, color: c.text }}>Topic priorities</Text>
              <Text style={{ ...type.body, fontSize: 12, color: c.textMuted }}>Weakest topics first</Text>
            </View>
            <Text style={{ ...type.label, color: c.textMuted }}>
              {visibleTopics.length} of {ranked.length}
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
            {visibleTopics.map((topic, index) => <TopicRow key={topic.id} topic={topic} divided={index > 0} />)}
            {ranked.length > 5 && (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: allTopicsOpen }}
                onPress={() => setAllTopicsOpen((open) => !open)}
                style={({ pressed }) => ({
                  alignItems: "center",
                  padding: spacing.md,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: c.border,
                  backgroundColor: pressed ? c.surfaceAlt : c.surface,
                })}
              >
                <Text style={{ ...type.label, color: c.accent }}>
                  {allTopicsOpen ? "Show priorities only ↑" : `View all ${ranked.length} topics ↓`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function AreaAction({ label, filled, onPress }: { label: string; filled?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} this exam area`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: filled ? c.accent : c.border,
        backgroundColor: filled ? c.accent : "transparent",
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ ...type.label, fontSize: 10, color: filled ? c.accentText : c.text }}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  const c = useColors();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: c.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.border,
        gap: 1,
      }}
    >
      <Text style={{ ...type.label, fontSize: 10, color: c.textMuted, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ ...type.heading, color: c.text }}>{value}</Text>
      <Text numberOfLines={1} style={{ ...type.body, fontSize: 11, color: c.textMuted }}>{note}</Text>
    </View>
  );
}

function TopicRow({ topic, divided }: { topic: ReturnType<typeof analyseTopics>[number]; divided: boolean }) {
  const c = useColors();
  const accuracy = topic.accuracy === null ? null : Math.round(topic.accuracy * 100);
  const status = accuracy === null ? "New" : accuracy >= 80 ? "Strong" : accuracy >= 60 ? "Developing" : "Priority";
  const tone = accuracy === null ? c.textMuted : accuracy >= 80 ? c.correct : accuracy >= 60 ? c.warn : c.wrong;
  const mastery = topic.mastery / Math.max(1, topic.questions);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Practise ${topic.name}`}
      onPress={() => router.push({ pathname: "/topic", params: { id: topic.id, mode: "attempt" } })}
      style={({ pressed }) => ({
        padding: spacing.md,
        gap: spacing.sm,
        borderTopWidth: divided ? StyleSheet.hairlineWidth : 0,
        borderTopColor: c.border,
        backgroundColor: pressed ? c.surfaceAlt : c.surface,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone }} />
        <Text style={{ ...type.body, fontWeight: "700", color: c.text, flex: 1 }}>{topic.name}</Text>
        <Text style={{ ...type.label, fontSize: 11, color: tone }}>{status}</Text>
        <Text style={{ ...type.label, ...type.mono, color: c.text, minWidth: 36, textAlign: "right" }}>
          {accuracy === null ? "—" : `${accuracy}%`}
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.surfaceAlt }}>
        <View style={{ width: `${mastery * 100}%`, height: "100%", borderRadius: radius.pill, backgroundColor: tone }} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Text style={{ ...type.body, fontSize: 12, color: c.textMuted, flex: 1 }}>
          {topic.mastery} mastered · {topic.attempted}/{topic.questions} covered · {topic.wrong} wrong
        </Text>
        <Text style={{ ...type.label, fontSize: 10, color: c.accent }}>Practise →</Text>
      </View>
    </Pressable>
  );
}
