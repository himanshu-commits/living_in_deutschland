import { router } from "expo-router";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Animated, Dimensions, I18nManager, Pressable, StyleSheet, Text, View } from "react-native";
import { useT } from "./storage";
import { useSession } from "./sync";
import { useEntitlement } from "./entitlements";
import { spacing, type, useColors } from "./theme";
import { featureCopy } from "./feature-copy";

const WIDTH = Math.min(300, Dimensions.get("window").width * 0.8);

type MenuState = { open: boolean; toggle: () => void; close: () => void };
const Ctx = createContext<MenuState | null>(null);

export function useSideMenu(): MenuState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSideMenu must be used inside <SideMenuProvider>");
  return ctx;
}

/** Wraps the app; renders the slide-in panel above `children` and provides open/close. */
export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // The panel is pinned with the logical `start: 0` (see SideMenu below),
  // which native mirrors off I18nManager.isRTL — not off the currently
  // chosen language. Deriving hiddenX from the language instead (as this
  // used to) went stale the moment someone picked a language whose direction
  // differs from the still-in-effect native one, sliding the panel toward
  // whichever edge it isn't actually pinned to. I18nManager.isRTL only ever
  // changes via a full app restart, i.e. a fresh mount of this provider, so
  // reading it once into the ref below always matches the current pin.
  const hiddenX = I18nManager.isRTL ? WIDTH : -WIDTH;
  const x = useRef(new Animated.Value(hiddenX)).current;

  function animate(next: boolean) {
    setOpen(next);
    Animated.timing(x, { toValue: next ? 0 : hiddenX, duration: 220, useNativeDriver: true }).start();
  }

  return (
    <Ctx.Provider value={{ open, toggle: () => animate(!open), close: () => animate(false) }}>
      {children}
      <SideMenu x={x} open={open} onClose={() => animate(false)} />
    </Ctx.Provider>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ ...type.body, fontWeight: "600", color: c.text }}>{label}</Text>
    </Pressable>
  );
}

function SideMenu({ x, open, onClose }: { x: Animated.Value; open: boolean; onClose: () => void }) {
  const c = useColors();
  const { t, lang } = useT();
  const copy = featureCopy(lang);
  const { session } = useSession();
  const { isPremium } = useEntitlement();

  function go(path: "/" | "/profile" | "/login" | "/premium" | "/settings" | "/help") {
    onClose();
    router.push(path);
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? "box-none" : "none"}>
      {open ? (
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.closeMenu}
        />
      ) : null}
      <Animated.View
        style={{
          position: "absolute",
          start: 0,
          top: 0,
          bottom: 0,
          width: WIDTH,
          backgroundColor: c.bg,
          borderEndWidth: StyleSheet.hairlineWidth,
          borderEndColor: c.border,
          transform: [{ translateX: x }],
        }}
      >
        <View
          style={{
            paddingTop: 64,
            paddingBottom: spacing.lg,
            paddingHorizontal: spacing.lg,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: c.border,
          }}
        >
          <Text style={{ ...type.heading, color: c.text }}>{t.home}</Text>
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.xs }}>
          <MenuItem label={t.homeLabel} onPress={() => go("/")} />
          {session ? <MenuItem label={t.profile} onPress={() => go("/profile")} /> : null}
          <MenuItem label={isPremium ? `★ ${copy.premiumActive}` : `☆ ${copy.premium}`} onPress={() => go("/premium")} />
          <MenuItem label={t.settings} onPress={() => go("/settings")} />
          <MenuItem label={t.help} onPress={() => go("/help")} />
        </View>
      </Animated.View>
    </View>
  );
}

/** The ☰ button shown in the Home screen header. Subpages use a back arrow. */
export function SideMenuButton() {
  const c = useColors();
  const { lang } = useT();
  const copy = featureCopy(lang);
  const { toggle } = useSideMenu();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.menu}
      onPress={toggle}
      hitSlop={10}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Text style={{ fontSize: 22, color: c.text }}>☰</Text>
    </Pressable>
  );
}
