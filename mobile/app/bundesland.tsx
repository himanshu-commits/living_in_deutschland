import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BUNDESLAENDER } from "@/questions";
import { useStore } from "@/storage";
import { radius, spacing, type, useColors } from "@/theme";

export default function BundeslandPicker() {
  const c = useColors();
  const { state, setState } = useStore();

  async function choose(land: string) {
    await setState(land);
    router.replace("/");
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
    >
      <Text style={{ ...type.body, color: c.textMuted, marginBottom: spacing.sm }}>
        Im Test bekommst du 3 Fragen zu deinem Bundesland. Wähle das Land, in dem du den Test
        ablegst.
      </Text>

      {BUNDESLAENDER.map((land) => {
        const selected = land === state;
        return (
          <Pressable
            key={land}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => choose(land)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: selected ? c.surfaceAlt : c.surface,
              borderColor: selected ? c.accent : c.border,
              borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
              borderRadius: radius.md,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ ...type.body, fontWeight: "600", color: c.text }}>{land}</Text>
            {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent }} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
