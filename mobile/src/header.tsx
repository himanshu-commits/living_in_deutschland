import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggle } from "./components";
import { SideMenuButton } from "./side-menu";
import { spacing, type, useColors } from "./theme";

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
  right,
}: {
  title: string;
  /** hidden during the timed exam, so there is no way to wander off */
  menu?: boolean;
  /** extra control shown left of the theme toggle, e.g. the translate toggle */
  right?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
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
      <View style={{ width: 40, alignItems: "flex-start" }}>{menu ? <SideMenuButton /> : null}</View>
      <Text
        style={{ ...type.heading, color: c.text, flex: 1, textAlign: "center" }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View
        style={{
          width: 40,
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
