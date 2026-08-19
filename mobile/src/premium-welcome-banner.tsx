import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Card } from "./components";
import { useT } from "./storage";
import { radius, spacing, type, useColors } from "./theme";

export type PremiumWelcomeKind = "activated" | "restored" | "login";

/**
 * A one-shot, dismissible "welcome to Premium" moment shown inline on the Home
 * screen — either right after a purchase/restore, or the first time a session
 * that turns out to be Premium appears (e.g. logging in on a new device). It
 * replaces a previous native `Alert.alert`, which is a modal OS popup and
 * doesn't fit the app's own visual language or support a real call-to-action.
 *
 * The dismiss button is pinned with the logical `end` (not `right`), and the
 * entrance animation is a vertical fade/slide, so nothing here assumes LTR —
 * Yoga resolves `start`/`end` against the app's current native writing
 * direction on its own.
 */
export function PremiumWelcomeBanner({
  kind,
  onDismiss,
  onOpenAnalytics,
}: {
  kind: PremiumWelcomeKind;
  onDismiss: () => void;
  onOpenAnalytics: () => void;
}) {
  const c = useColors();
  const { t } = useT();
  const copy = t.premiumWelcome;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const title =
    kind === "activated" ? copy.activatedTitle : kind === "restored" ? copy.restoredTitle : copy.loginTitle;
  const body =
    kind === "activated" ? copy.activatedBody : kind === "restored" ? copy.restoredBody : copy.loginBody;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card style={{ borderStartWidth: 3, borderStartColor: c.accent, gap: spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: c.surfaceAlt,
            }}
          >
            <Ionicons name="star" size={16} color={c.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...type.heading, fontSize: 16, color: c.text }}>{title}</Text>
            <Text style={{ ...type.body, fontSize: 13, lineHeight: 18, color: c.textMuted }}>{body}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.dismiss}
            onPress={onDismiss}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: spacing.xs, marginEnd: -spacing.xs, marginTop: -spacing.xs })}
          >
            <Ionicons name="close" size={18} color={c.textMuted} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenAnalytics}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.sm,
            paddingVertical: 10,
            borderRadius: radius.md,
            backgroundColor: c.accent,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ ...type.label, color: c.accentText }}>{copy.cta}</Text>
          <Ionicons name="arrow-forward" size={14} color={c.accentText} />
        </Pressable>
      </Card>
    </Animated.View>
  );
}
