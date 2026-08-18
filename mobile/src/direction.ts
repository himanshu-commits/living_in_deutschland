import { reloadAppAsync } from "expo";
import { I18nManager, Platform } from "react-native";

/** Native Yoga direction only changes after the React Native app reloads. */
export function needsDirectionReload(rtl: boolean): boolean {
  return Platform.OS !== "web" && I18nManager.isRTL !== rtl;
}

export async function applyLayoutDirection(rtl: boolean): Promise<boolean> {
  if (!needsDirectionReload(rtl)) return false;
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  I18nManager.forceRTL(rtl);
  await reloadAppAsync("Apply interface writing direction");
  return true;
}
