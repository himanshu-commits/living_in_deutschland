import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SideMenuProvider } from "@/side-menu";
import { StoreProvider } from "@/storage";
import { SyncEngine } from "@/sync";

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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SyncEngine>
          <SideMenuProvider>
            <StatusBar style="auto" />
            <Navigator />
          </SideMenuProvider>
        </SyncEngine>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
