import { useState } from "react";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { poolFor } from "@/questions";
import { QuestionList } from "@/reader";
import { useStore, useT } from "@/storage";
import { useColors } from "@/theme";

export default function Mistakes() {
  const c = useColors();
  const { ready, lang, state, mistakes } = useStore();
  const { t } = useT();

  // Answering correctly removes a question from the mistake set. Taking the list
  // once, on entry, stops the card you are looking at from vanishing underneath
  // you the moment you get it right — cleared questions are gone next visit.
  const [batch] = useState(() => mistakes);

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;

  const questions = poolFor(state).filter((q) => batch.includes(q.id));
  return <QuestionList title={t.mistakes} mode="attempt" questions={questions} empty={t.noMistakes} />;
}
