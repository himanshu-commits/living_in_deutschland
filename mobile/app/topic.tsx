import { Redirect, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { ALL } from "@/questions";
import { QuestionList, type Mode } from "@/reader";
import { useStore } from "@/storage";
import { questionsForTopic, TOPICS } from "@/topics";
import { useColors } from "@/theme";

export default function TopicQuestions() {
  const c = useColors();
  const { ready, lang, state } = useStore();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const requestedMode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const topic =
    id === "state" && state
      ? { id: "state", name: state }
      : TOPICS.find((entry) => entry.id === id);
  const mode: Mode = requestedMode === "attempt" ? "attempt" : "read";

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (!topic) return <Redirect href="/topics" />;

  return (
    <QuestionList
      title={topic.name}
      questions={questionsForTopic(topic.id, ALL, state ?? undefined)}
      mode={mode}
    />
  );
}
