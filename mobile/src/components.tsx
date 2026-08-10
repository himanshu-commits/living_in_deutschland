import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { radius, spacing, type, useColors, type Colors } from "./theme";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View
      style={[
        { backgroundColor: c.surface, borderColor: c.border, borderWidth: StyleSheet.hairlineWidth,
          borderRadius: radius.lg, padding: spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const c = useColors();
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        backgroundColor: primary ? c.accent : "transparent",
        borderColor: primary ? "transparent" : c.border,
        borderWidth: primary ? 0 : StyleSheet.hairlineWidth,
        borderRadius: radius.pill,
        paddingVertical: 15,
        paddingHorizontal: spacing.xl,
        alignItems: "center",
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ ...type.body, fontWeight: "700", color: primary ? c.accentText : c.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>{children}</Text>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const c = useColors();
  return (
    <View style={{ height: 6, borderRadius: radius.pill, backgroundColor: c.surfaceAlt, overflow: "hidden" }}>
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: "100%",
          backgroundColor: c.accent,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

type OptionState = "idle" | "correct" | "wrong" | "revealed";

function optionColors(c: Colors, state: OptionState) {
  if (state === "correct") return { bg: c.correctBg, border: c.correct, text: c.text };
  if (state === "wrong") return { bg: c.wrongBg, border: c.wrong, text: c.text };
  if (state === "revealed") return { bg: c.surface, border: c.correct, text: c.text };
  return { bg: c.surface, border: c.border, text: c.text };
}

export function Option({
  text,
  index,
  state,
  onPress,
  disabled,
}: {
  text: string;
  index: number;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  const s = optionColors(c, state);
  const letter = "ABCD"[index];
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: state === "correct" || state === "wrong", disabled: !!disabled }}
      accessibilityLabel={`${letter}. ${text}`}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.md,
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: state === "idle" ? StyleSheet.hairlineWidth : 2,
        borderRadius: radius.md,
        padding: spacing.lg,
        opacity: pressed && !disabled ? 0.9 : 1,
      })}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: radius.pill,
          backgroundColor: c.surfaceAlt,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ ...type.label, color: c.textMuted }}>{letter}</Text>
      </View>
      <Text style={{ ...type.body, color: s.text, flex: 1 }}>{text}</Text>
    </Pressable>
  );
}

export function Notice({ children, tone = "warn" }: { children: React.ReactNode; tone?: "warn" }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.surfaceAlt,
        borderRadius: radius.md,
        padding: spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: tone === "warn" ? c.warn : c.accent,
      }}
    >
      <Text style={{ ...type.body, fontSize: 14, color: c.textMuted }}>{children}</Text>
    </View>
  );
}
