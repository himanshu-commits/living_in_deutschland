import { reloadAppAsync } from "expo";
import { I18nManager, Platform } from "react-native";

/** Native Yoga direction only changes after the React Native app reloads. */
export function needsDirectionReload(rtl: boolean): boolean {
  return Platform.OS !== "web" && I18nManager.isRTL !== rtl;
}

export type DirectionChangeResult = "none" | "reloaded" | "restart-required";

/**
 * iOS gives apps no way to relaunch their own process, so a JS-only reload
 * right after forceRTL leaves native Yoga views mid-transition — some already
 * built for the old direction, some for the new one — which crashes rather
 * than reflows. The flags below persist to native prefs immediately and apply
 * cleanly the next time the OS actually restarts the app, so on iOS we ask
 * for that instead of reloading. Android's reload genuinely works.
 */
export async function applyLayoutDirection(rtl: boolean): Promise<DirectionChangeResult> {
  if (!needsDirectionReload(rtl)) return "none";
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  I18nManager.forceRTL(rtl);
  if (Platform.OS === "ios") return "restart-required";
  await reloadAppAsync("Apply interface writing direction");
  return "reloaded";
}
