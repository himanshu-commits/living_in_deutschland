import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TranslateToggle } from "@/reader";
import { ThemeToggle } from "@/components";
import { StoreProvider, useT } from "@/storage";
import { spacing, useColors } from "@/theme";

/** Top-right header controls. `translate` adds the language toggle beside it. */
function HeaderRight({ translate }: { translate?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      {translate ? <TranslateToggle /> : null}
      <ThemeToggle />
    </View>
  );
}

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
        headerRight: () => <HeaderRight />,
      }}
    >
      <Stack.Screen name="index" options={{ title: t.home }} />
      <Stack.Screen name="language" options={{ title: t.chooseLanguage }} />
      <Stack.Screen name="bundesland" options={{ title: t.chooseState }} />
      <Stack.Screen
        name="read"
        options={{ title: t.allQuestions, headerRight: () => <HeaderRight translate /> }}
      />
      <Stack.Screen
        name="mistakes"
        options={{ title: t.mistakes, headerRight: () => <HeaderRight translate /> }}
      />
      <Stack.Screen
        name="marked"
        options={{ title: t.marked, headerRight: () => <HeaderRight translate /> }}
      />
      <Stack.Screen
        name="attempt"
        options={{ title: t.practice, headerRight: () => <HeaderRight translate /> }}
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
