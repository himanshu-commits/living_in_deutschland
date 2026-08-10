import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TranslateToggle } from "@/reader";
import { StoreProvider, useT } from "@/storage";
import { useColors } from "@/theme";

/** Inside the provider, so screen titles can use the chosen language. */
function Navigator() {
  const c = useColors();
  const { t } = useT();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: t.home }} />
      <Stack.Screen name="language" options={{ title: t.chooseLanguage }} />
      <Stack.Screen name="bundesland" options={{ title: t.chooseState }} />
      <Stack.Screen
        name="read"
        options={{ title: t.allQuestions, headerRight: () => <TranslateToggle /> }}
      />
      <Stack.Screen
        name="marked"
        options={{ title: t.marked, headerRight: () => <TranslateToggle /> }}
      />
      <Stack.Screen
        name="attempt"
        options={{ title: t.practice, headerRight: () => <TranslateToggle /> }}
      />
      <Stack.Screen name="exam" options={{ title: t.test, gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Navigator />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
