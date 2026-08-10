import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StoreProvider } from "@/storage";
import { useColors } from "@/theme";

export default function RootLayout() {
  const c = useColors();
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.text,
            headerTitleStyle: { fontWeight: "700" },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Leben in Deutschland" }} />
          <Stack.Screen name="bundesland" options={{ title: "Bundesland" }} />
          <Stack.Screen name="learn" options={{ title: "Üben" }} />
          <Stack.Screen name="exam" options={{ title: "Prüfung", gestureEnabled: false }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
