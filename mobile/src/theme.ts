import { useColorScheme, type TextStyle } from "react-native";
import { useStore } from "./storage";

const palette = {
  light: {
    bg: "#F6F7F9",
    surface: "#FFFFFF",
    surfaceAlt: "#EEF1F5",
    text: "#0B0F14",
    textMuted: "#5B6672",
    border: "#DDE3EA",
    accent: "#1B6EF3",
    accentText: "#FFFFFF",
    correct: "#12855B",
    correctBg: "#E3F5EC",
    wrong: "#C8372D",
    wrongBg: "#FBE9E7",
    warn: "#B4690E",
  },
  dark: {
    bg: "#0B0F14",
    surface: "#141A22",
    surfaceAlt: "#1C242E",
    text: "#EDF1F6",
    textMuted: "#93A0AE",
    border: "#26303C",
    accent: "#4C90FF",
    accentText: "#06101F",
    correct: "#3FD09A",
    correctBg: "#0F2A21",
    wrong: "#FF7A6E",
    wrongBg: "#2C1512",
    warn: "#E7A33E",
  },
};

export type Colors = typeof palette.light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const type = {
  title: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.4 },
  heading: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.2 },
  question: { fontSize: 19, fontWeight: "600" as const, lineHeight: 27 },
  body: { fontSize: 16, lineHeight: 23 },
  label: { fontSize: 13, fontWeight: "600" as const, letterSpacing: 0.3 },
  // digits must not change width as a timer counts down
  mono: { fontSize: 15, fontVariant: ["tabular-nums"] } as TextStyle,
};

export function useIsDark(): boolean {
  const system = useColorScheme();
  const { theme } = useStore();
  return (theme ?? system) === "dark";
}

export function useColors(): Colors {
  return useIsDark() ? palette.dark : palette.light;
}
