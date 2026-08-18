import { Redirect } from "expo-router";
import { useRef } from "react";
import { View } from "react-native";
import { adaptiveDrill } from "@/adaptive";
import { useEntitlement } from "@/entitlements";
import { ALL } from "@/questions";
import { QuestionList } from "@/reader";
import { useStore } from "@/storage";
import { useT } from "@/storage";
import { useColors } from "@/theme";

export default function Adaptive() {
  const c = useColors();
  const { status } = useEntitlement();
  const { ready, lang, state, progress } = useStore();
  const { t } = useT();
  const drillRef = useRef<ReturnType<typeof adaptiveDrill> | null>(null);
  // Freeze the generated paper for this visit. Answering a question updates
  // progress, but must not reorder or replace questions halfway through a drill.
  if (ready && !drillRef.current) {
    drillRef.current = adaptiveDrill(ALL, progress, state ?? undefined);
  }

  if (!ready || status === "loading") return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!lang) return <Redirect href="/language" />;
  if (status !== "premium") {
    return <Redirect href={{ pathname: "/premium", params: { feature: "adaptive" } }} />;
  }
  const drill = drillRef.current!;

  return (
    <QuestionList
      title={drill.diagnostic ? t.readiness : t.practice}
      questions={drill.questions}
      mode="attempt"
      empty={t.practiceNote}
    />
  );
}
