import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { fill, isRTL, strings, type LangCode } from "./i18n";

export type Stat = {
  seen: number;
  correct: number;
  wrong: number;
  /** Consecutive correct answers; absent in older local/cloud snapshots. */
  streak?: number;
};
export type Progress = Record<string, Stat>;
export type TestResult = { correct: number; total: number; at: number };
/** null = follow the system appearance; set once the user overrides it */
export type ThemeMode = "light" | "dark" | null;

type State = {
  ready: boolean;
  lang: LangCode | null; // chosen interface language
  state: string | null; // chosen Bundesland
  progress: Progress;
  /** ids the user flagged as "this one has not stuck" */
  marked: string[];
  /** ids answered wrong and not yet answered right again — maintained automatically */
  mistakes: string[];
  /** whether the translation is currently shown under each question */
  translate: boolean;
  /** manual light/dark override; null follows the system appearance */
  theme: ThemeMode;
  lastTest: TestResult | null;
  setLang(code: LangCode): Promise<void>;
  setState(land: string): Promise<void>;
  toggleMark(id: string): Promise<void>;
  setTranslate(on: boolean): Promise<void>;
  setTheme(mode: ThemeMode): Promise<void>;
  saveTest(result: TestResult): Promise<void>;
  record(id: string, correct: boolean): Promise<void>;
  reset(): Promise<void>;
  /** Removes every app-owned local value, used for privacy-preserving logout. */
  clearAll(): Promise<void>;
  /** Overwrites local progress with a remote snapshot pulled on sign-in. */
  hydrate(remote: { progress: Progress; marked: string[]; mistakes: string[]; lastTest: TestResult | null }): Promise<void>;
};

const KEY_LANG = "lid.lang";
const KEY_STATE = "lid.bundesland";
const KEY_PROGRESS = "lid.progress";
const KEY_MARKED = "lid.marked";
const KEY_MISTAKES = "lid.mistakes";
const KEY_TRANSLATE = "lid.translate";
const KEY_THEME = "lid.theme";
const KEY_LASTTEST = "lid.lasttest";
const KEY_PREMIUM_CACHE = "lid.entitlement.premium";

const Ctx = createContext<State | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState<LangCode | null>(null);
  const [state, setLand] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});
  const [marked, setMarked] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [translate, setTranslateState] = useState(false);
  const [theme, setThemeState] = useState<ThemeMode>(null);
  const [lastTest, setLastTest] = useState<TestResult | null>(null);

  useEffect(() => {
    (async () => {
      const [code, land, raw, rawMarked, rawMistakes, rawTranslate, rawTheme, rawTest] = await Promise.all([
        AsyncStorage.getItem(KEY_LANG),
        AsyncStorage.getItem(KEY_STATE),
        AsyncStorage.getItem(KEY_PROGRESS),
        AsyncStorage.getItem(KEY_MARKED),
        AsyncStorage.getItem(KEY_MISTAKES),
        AsyncStorage.getItem(KEY_TRANSLATE),
        AsyncStorage.getItem(KEY_THEME),
        AsyncStorage.getItem(KEY_LASTTEST),
      ]);
      setLangState(code as LangCode | null);
      setLand(land);
      setTranslateState(rawTranslate === "1");
      setThemeState(rawTheme === "light" || rawTheme === "dark" ? rawTheme : null);
      try {
        if (rawMarked) setMarked(JSON.parse(rawMarked));
        if (rawMistakes) setMistakes(JSON.parse(rawMistakes));
        if (rawTest) setLastTest(JSON.parse(rawTest));
      } catch {
        // a corrupt blob should cost the user their flags, not the app
      }
      if (raw) {
        try {
          setProgress(JSON.parse(raw));
        } catch {
          // a corrupt blob should cost the user their stats, not the app
        }
      }
      setReady(true);
    })();
  }, []);

  const value: State = {
    ready,
    lang,
    state,
    progress,
    marked,
    mistakes,
    translate,
    theme,
    lastTest,
    async setLang(code) {
      setLangState(code);
      await AsyncStorage.setItem(KEY_LANG, code);
    },
    async setState(land) {
      setLand(land);
      await AsyncStorage.setItem(KEY_STATE, land);
    },
    async toggleMark(id) {
      setMarked((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        AsyncStorage.setItem(KEY_MARKED, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    async setTranslate(on) {
      setTranslateState(on);
      await AsyncStorage.setItem(KEY_TRANSLATE, on ? "1" : "0");
    },
    async setTheme(mode) {
      setThemeState(mode);
      if (mode) await AsyncStorage.setItem(KEY_THEME, mode);
      else await AsyncStorage.removeItem(KEY_THEME);
    },
    async saveTest(result) {
      setLastTest(result);
      await AsyncStorage.setItem(KEY_LASTTEST, JSON.stringify(result));
    },
    async record(id, correct) {
      // the mistake list is a consequence of answering, never edited by hand:
      // a wrong answer puts a question in, a right one takes it out
      setMistakes((prev) => {
        const next = correct
          ? prev.filter((x) => x !== id)
          : prev.includes(id)
            ? prev
            : [...prev, id];
        if (next !== prev) AsyncStorage.setItem(KEY_MISTAKES, JSON.stringify(next)).catch(() => {});
        return next;
      });
      setProgress((prev) => {
        const before = prev[id] ?? { seen: 0, correct: 0, wrong: 0 };
        const next: Progress = {
          ...prev,
          [id]: {
            seen: before.seen + 1,
            correct: before.correct + (correct ? 1 : 0),
            wrong: before.wrong + (correct ? 0 : 1),
            streak: correct ? (before.streak ?? 0) + 1 : 0,
          },
        };
        AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    async reset() {
      setProgress({});
      setMistakes([]);
      await AsyncStorage.multiRemove([KEY_PROGRESS, KEY_MISTAKES]);
    },
    async clearAll() {
      setLangState(null);
      setLand(null);
      setProgress({});
      setMarked([]);
      setMistakes([]);
      setTranslateState(false);
      setThemeState(null);
      setLastTest(null);
      await AsyncStorage.multiRemove([
        KEY_LANG,
        KEY_STATE,
        KEY_PROGRESS,
        KEY_MARKED,
        KEY_MISTAKES,
        KEY_TRANSLATE,
        KEY_THEME,
        KEY_LASTTEST,
        KEY_PREMIUM_CACHE,
      ]);
    },
    async hydrate(remote) {
      setProgress(remote.progress);
      setMarked(remote.marked);
      setMistakes(remote.mistakes);
      setLastTest(remote.lastTest);
      await Promise.all([
        AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(remote.progress)),
        AsyncStorage.setItem(KEY_MARKED, JSON.stringify(remote.marked)),
        AsyncStorage.setItem(KEY_MISTAKES, JSON.stringify(remote.mistakes)),
        remote.lastTest
          ? AsyncStorage.setItem(KEY_LASTTEST, JSON.stringify(remote.lastTest))
          : AsyncStorage.removeItem(KEY_LASTTEST),
      ]);
    },
  };

  return createElement(Ctx.Provider, { value }, children);
}

export function useStore(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Interface strings in the chosen language, plus writing direction. */
export function useT() {
  const { lang } = useStore();
  const code = lang ?? "en";
  return { t: strings(code), fill, lang: code, rtl: isRTL(code) };
}

/** Questions answered wrong more often than right, hardest first. */
export function weakest(progress: Progress, ids: string[]): string[] {
  return ids
    .filter((id) => (progress[id]?.wrong ?? 0) > 0)
    .sort((a, b) => (progress[b]!.wrong - progress[b]!.correct) - (progress[a]!.wrong - progress[a]!.correct));
}

export function mastered(progress: Progress, ids: string[]): number {
  return ids.filter((id) => {
    const s = progress[id];
    return s && s.correct > 0 && s.correct >= s.wrong;
  }).length;
}
