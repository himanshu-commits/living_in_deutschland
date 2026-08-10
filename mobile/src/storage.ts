import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

export type Stat = { seen: number; correct: number; wrong: number };
export type Progress = Record<string, Stat>;

type State = {
  ready: boolean;
  state: string | null; // chosen Bundesland
  progress: Progress;
  setState(land: string): Promise<void>;
  record(id: string, correct: boolean): Promise<void>;
  reset(): Promise<void>;
};

const KEY_STATE = "lid.bundesland";
const KEY_PROGRESS = "lid.progress";

const Ctx = createContext<State | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setLand] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    (async () => {
      const [land, raw] = await Promise.all([
        AsyncStorage.getItem(KEY_STATE),
        AsyncStorage.getItem(KEY_PROGRESS),
      ]);
      setLand(land);
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
    state,
    progress,
    async setState(land) {
      setLand(land);
      await AsyncStorage.setItem(KEY_STATE, land);
    },
    async record(id, correct) {
      setProgress((prev) => {
        const before = prev[id] ?? { seen: 0, correct: 0, wrong: 0 };
        const next: Progress = {
          ...prev,
          [id]: {
            seen: before.seen + 1,
            correct: before.correct + (correct ? 1 : 0),
            wrong: before.wrong + (correct ? 0 : 1),
          },
        };
        AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    async reset() {
      setProgress({});
      await AsyncStorage.removeItem(KEY_PROGRESS);
    },
  };

  return createElement(Ctx.Provider, { value }, children);
}

export function useStore(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
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
