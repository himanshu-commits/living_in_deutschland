import { Redirect } from "expo-router";
import { View } from "react-native";
import { poolFor } from "@/questions";
import { QuestionList } from "@/reader";
import { useStore, useT } from "@/storage";
import { useColors } from "@/theme";

export default function Marked() {
  const c = useColors();
  const { ready, lang, state, marked } = useStore();
  const { t } = useT();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;

  const questions = poolFor(state).filter((q) => marked.includes(q.id));
  return <QuestionList title={t.marked} questions={questions} empty={t.noMarked} />;
}
