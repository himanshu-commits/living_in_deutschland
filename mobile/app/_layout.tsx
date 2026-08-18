import { Stack } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SideMenuProvider } from "@/side-menu";
import { EntitlementProvider, useEntitlement } from "@/entitlements";
import { AdProvider } from "@/ads";
import { StoreProvider, useStore } from "@/storage";
import { SessionProvider, SyncEngine } from "@/sync";
import { applyLayoutDirection, needsDirectionReload } from "@/direction";
import { isRTL } from "@/i18n";

/**
 * Headers are drawn by each screen itself (see @/header) rather than the
 * native Stack header — see ScreenHeader's comment for why.
 */
function Navigator() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade", animationDuration: 150 }}>
      <Stack.Screen name="exam" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

function PremiumSync({ children }: { children: ReactNode }) {
  const { isPremium } = useEntitlement();
  return <SyncEngine enabled={isPremium}>{children}</SyncEngine>;
}

/** Applies RTL for users who already had Arabic, Persian, or Urdu selected. */
function DirectionGate({ children }: { children: ReactNode }) {
  const { ready, lang } = useStore();
  const [applying, setApplying] = useState(false);
  const [failed, setFailed] = useState(false);
  const rtl = lang ? isRTL(lang) : false;

  useEffect(() => {
    if (!ready || !lang || failed || !needsDirectionReload(rtl)) return;
    setApplying(true);
    void applyLayoutDirection(rtl).catch(() => {
      // Keep the app usable if a host cannot reload (for example, an unusual
      // development shell). A later cold launch will apply the persisted flag.
      setApplying(false);
      setFailed(true);
    });
  }, [failed, lang, ready, rtl]);

  if (!ready || applying || (!failed && lang && needsDirectionReload(rtl))) {
    return <View style={{ flex: 1, backgroundColor: "#0B0F14" }} />;
  }
  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <DirectionGate>
          <SessionProvider>
            <EntitlementProvider>
              <AdProvider>
                <PremiumSync>
                  <SideMenuProvider>
                    <StatusBar style="auto" />
                    <Navigator />
                  </SideMenuProvider>
                </PremiumSync>
              </AdProvider>
            </EntitlementProvider>
          </SessionProvider>
        </DirectionGate>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
