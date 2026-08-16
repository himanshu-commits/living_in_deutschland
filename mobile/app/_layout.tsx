import { Stack } from "expo-router";
import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SideMenuProvider } from "@/side-menu";
import { EntitlementProvider, useEntitlement } from "@/entitlements";
import { AdProvider } from "@/ads";
import { StoreProvider } from "@/storage";
import { SessionProvider, SyncEngine } from "@/sync";

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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
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
      </StoreProvider>
    </SafeAreaProvider>
  );
}
