import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useStore } from "./storage";
import { radius, spacing, type, useColors, useIsDark, type Colors } from "./theme";

/** Manual light/dark override, shown top-right in every screen header. */
export function ThemeToggle() {
  const isDark = useIsDark();
  const { setTheme } = useStore();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={`${isDark ? "Dark" : "Light"} mode, tap to switch`}
      onPress={() => setTheme(isDark ? "light" : "dark")}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ fontSize: 22 }}>{isDark ? "☀️" : "🌙"}</Text>
    </Pressable>
  );
}

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

export function ProgressBar({ value, passMark }: { value: number; passMark?: number }) {
  const c = useColors();
  return (
    // not clipped, so the pass mark can stand slightly proud of the bar
    <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: c.surfaceAlt }}>
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`,
          height: "100%",
          backgroundColor: c.accent,
          borderRadius: radius.pill,
        }}
      />
      {passMark !== undefined && (
        // the threshold is the one number that decides readiness, so it is drawn
        <View
          style={{
            position: "absolute",
            start: `${Math.min(100, Math.max(0, passMark * 100))}%`,
            top: -3,
            bottom: -3,
            width: 2,
            borderRadius: 2,
            backgroundColor: c.text,
            opacity: 0.55,
          }}
        />
      )}
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
  subtitle,
}: {
  text: string;
  index: number;
  state: OptionState;
  onPress: () => void;
  disabled?: boolean;
  /** the translation, shown under the German rather than replacing it */
  subtitle?: React.ReactNode;
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
      <View style={{ flex: 1 }}>
        <Text style={{ ...type.body, color: s.text }}>{text}</Text>
        {subtitle}
      </View>
    </Pressable>
  );
}

export function Notice({ children, tone = "warn" }: { children: React.ReactNode; tone?: "warn" | "info" }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.surfaceAlt,
        borderRadius: radius.md,
        padding: spacing.md,
        borderStartWidth: 3,
        borderStartColor: tone === "warn" ? c.warn : c.accent,
      }}
    >
      <Text style={{ ...type.body, fontSize: 14, color: c.textMuted }}>{children}</Text>
    </View>
  );
}
