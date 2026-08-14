import { Redirect } from "expo-router";
import { View } from "react-native";
import { poolFor } from "@/questions";
import { QuestionList } from "@/reader";
import { useStore, useT } from "@/storage";
import { useColors } from "@/theme";

export default function Read() {
  const c = useColors();
  const { ready, lang, state } = useStore();
  const { t } = useT();

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (!state) return <Redirect href="/bundesland" />;

  const pool = poolFor(state);
  return (
    <QuestionList
      title={t.allQuestions}
      questions={pool}
      filters={[
        { key: "all", label: `${t.allQuestions} ${pool.length}`, test: () => true },
        { key: "general", label: `${t.general} 300`, test: (q) => q.scope === "ALL" },
        { key: "state", label: `${state} 10`, test: (q) => q.scope === state },
      ]}
    />
  );
}
