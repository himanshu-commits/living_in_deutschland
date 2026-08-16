import { router } from "expo-router";
import { useEntitlement } from "./entitlements";

export type PremiumFeature =
  | "explanations"
  | "audio"
  | "adaptive"
  | "unlimited_exams"
  | "analytics"
  | "cloud_sync"
  | "study_plan"
  | "remove_ads";

/** Runs a Premium action or sends a free user to the benefits screen. */
export function usePremiumGate() {
  const { isPremium, status } = useEntitlement();

  return (feature: PremiumFeature, action: () => void) => {
    if (status === "premium") action();
    else router.push({ pathname: "/premium", params: { feature } });
  };
}
