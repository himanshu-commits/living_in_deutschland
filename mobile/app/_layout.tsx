import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SideMenuProvider } from "@/side-menu";
import { EntitlementProvider } from "@/entitlements";
import { AdProvider } from "@/ads";
import { StoreProvider } from "@/storage";
import { SessionProvider, SyncEngine } from "@/sync";

/**
 * Headers are drawn by each screen itself (see @/header) rather than the
 * native Stack header — see ScreenHeader's comment for why.
 */
function Navigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="exam" options={{ gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SessionProvider>
          <EntitlementProvider>
            <AdProvider>
              <SyncEngine>
                <SideMenuProvider>
                  <StatusBar style="auto" />
                  <Navigator />
                </SideMenuProvider>
              </SyncEngine>
            </AdProvider>
          </EntitlementProvider>
        </SessionProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
