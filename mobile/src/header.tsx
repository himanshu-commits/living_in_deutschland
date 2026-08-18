import { router, usePathname } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggle } from "./components";
import { SideMenuButton } from "./side-menu";
import { spacing, type, useColors } from "./theme";
import { useT } from "./storage";

/**
 * A plain (non-native) header. iOS 26's "Liquid Glass" wraps any custom view
 * placed in a native Stack header's headerLeft/headerRight in a system pill
 * background that cannot currently be disabled (react-native-screens has no
 * opt-out as of Expo SDK 54). Rendering the header ourselves, with the
 * Stack's own header hidden, sidesteps that entirely.
 */
export function ScreenHeader({
  title,
  menu = true,
  left,
  right,
}: {
  title: string;
  /** hidden during the timed exam, so there is no way to wander off */
  menu?: boolean;
  /** replaces the menu slot, e.g. with a back/exit control */
  left?: ReactNode;
  /** extra control shown left of the theme toggle, e.g. the translate toggle */
  right?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { t } = useT();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  const defaultLeft = menu
    ? pathname === "/"
      ? <SideMenuButton />
      : <HeaderBackButton label={t.back} onPress={goBack} />
    : null;

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.lg,
        backgroundColor: c.bg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
      }}
    >
      <View style={{ minWidth: 40, alignItems: "flex-start", flexShrink: 0 }}>
        {left ?? defaultLeft}
      </View>
      <Text
        style={{ ...type.heading, color: c.text, flex: 1, minWidth: 0, textAlign: "center" }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View
        style={{
          minWidth: 40,
          flexShrink: 0,
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        {right}
        <ThemeToggle />
      </View>
    </View>
  );
}

export function HeaderBackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: pressed ? c.surfaceAlt : "transparent",
      })}
    >
      <Text style={{ fontSize: 25, lineHeight: 28, color: c.text }}>←</Text>
    </Pressable>
  );
}
