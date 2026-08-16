import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Cloud sync is optional for local/offline use of the question catalogue. */
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        lock: processLock,
        // there's no browser redirect to complete on a native app
        detectSessionInUrl: false,
      },
    })
  : null;

// On native, Supabase cannot infer whether the app is active. Refresh tokens
// only while it is in the foreground so persisted logins remain usable without
// leaving a timer running while the app is suspended.
if (supabase && Platform.OS !== "web") {
  if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export type Progress = Record<string, { seen: number; correct: number; wrong: number }>;
export type TestResult = { correct: number; total: number; at: number };

export type RemoteProgress = {
  user_id: string;
  progress: Progress;
  marked: string[];
  mistakes: string[];
  last_test: TestResult | null;
  updated_at: string;
};
