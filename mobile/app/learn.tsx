import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { Button, Label, Notice, Option, ProgressBar } from "@/components";
import { Illustration, ImageOptions } from "@/media";
import { poolFor, shuffle } from "@/questions";
import { useStore } from "@/storage";
import { spacing, type, useColors } from "@/theme";

export default function Learn() {
  const c = useColors();
  const { ready, state, record } = useStore();
  const deck = useMemo(() => (state ? shuffle(poolFor(state)) : []), [state]);

  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  if (!state) return <Redirect href="/bundesland" />;

  const q = deck[at];
  const answered = picked !== null;

  function choose(index: number) {
    if (answered) return;
    setPicked(index);
    record(q.id, index === q.answer);
  }

  function next() {
    setPicked(null);
    setAt((i) => (i + 1) % deck.length);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Label>
            Frage {at + 1} von {deck.length}
          </Label>
          <Label>{q.scope === "ALL" ? "Allgemein" : q.scope}</Label>
        </View>
        <ProgressBar value={(at + 1) / deck.length} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}>
        <Text style={{ ...type.question, color: c.text, marginBottom: spacing.sm }}>{q.question}</Text>

        {q.media && q.media.kind !== "options" && <Illustration media={q.media} />}
        {!q.verified && (
          <Notice>Antwort noch nicht gegengeprüft. Bitte im offiziellen BAMF-Test bestätigen.</Notice>
        )}

        {q.media?.kind === "options" ? (
          <ImageOptions
            media={q.media}
            picked={picked}
            answer={q.answer}
            answered={answered}
            onPick={choose}
          />
        ) : (
          q.options.map((text, i) => (
            <Option
              key={i}
              index={i}
              text={text}
              disabled={answered}
              state={
                !answered ? "idle" : i === q.answer ? "correct" : i === picked ? "wrong" : "idle"
              }
              onPress={() => choose(i)}
            />
          ))
        )}

        {answered && (
          <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
            <Text
              style={{
                ...type.body,
                fontWeight: "700",
                color: picked === q.answer ? c.correct : c.wrong,
              }}
            >
              {picked === q.answer ? "Richtig." : `Falsch — richtig ist ${"ABCD"[q.answer ?? 0]}.`}
            </Text>
            <Button label="Weiter" onPress={next} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
