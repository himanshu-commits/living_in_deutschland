import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "./sync";
import { supabase } from "./supabase";
import { getPremiumCustomerInfo, hasPremium, purchasesConfigured } from "./purchases";

export const PREMIUM_CACHE_KEY = "lid.entitlement.premium";

export type EntitlementStatus = "loading" | "free" | "premium";
type EntitlementState = {
  status: EntitlementStatus;
  isPremium: boolean;
  refresh(): Promise<void>;
  grantVerifiedPremium(): Promise<void>;
};

const EntitlementCtx = createContext<EntitlementState | null>(null);

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const [status, setStatus] = useState<EntitlementStatus>("loading");

  const refresh = useCallback(async () => {
    if (sessionLoading) return;
    if (!session || !supabase) {
      setStatus("free");
      return;
    }

    const cachedPremium = (await AsyncStorage.getItem(PREMIUM_CACHE_KEY)) === "1";

    // RevenueCat is authoritative for store purchases and restores. Checking it
    // here keeps a lifetime unlock active after relaunch and on a new device.
    if (purchasesConfigured()) {
      try {
        const customerInfo = await getPremiumCustomerInfo(session.user.id);
        if (hasPremium(customerInfo)) {
          await AsyncStorage.setItem(PREMIUM_CACHE_KEY, "1");
          setStatus("premium");
          return;
        }
      } catch {
        // Fall through to the server row or the last verified offline value.
      }
    }

    const { data, error } = await supabase
      .from("entitlements")
      .select("active")
      .eq("user_id", session.user.id)
      .maybeSingle();

    // Preserve a previously verified lifetime unlock while offline. The
    // RevenueCat-backed server row remains authoritative whenever reachable.
    if (error) {
      setStatus(cachedPremium ? "premium" : "free");
      return;
    }

    if (data?.active) {
      await AsyncStorage.setItem(PREMIUM_CACHE_KEY, "1");
      setStatus("premium");
    } else {
      await AsyncStorage.removeItem(PREMIUM_CACHE_KEY);
      setStatus("free");
    }
  }, [session, sessionLoading]);

  const grantVerifiedPremium = useCallback(async () => {
    await AsyncStorage.setItem(PREMIUM_CACHE_KEY, "1");
    setStatus("premium");
  }, []);

  useEffect(() => {
    setStatus("loading");
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return createElement(
    EntitlementCtx.Provider,
    { value: { status, isPremium: status === "premium", refresh, grantVerifiedPremium } },
    children,
  );
}

export function useEntitlement(): EntitlementState {
  const value = useContext(EntitlementCtx);
  if (!value) throw new Error("useEntitlement must be used inside <EntitlementProvider>");
  return value;
}
