import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Cloud sync is optional for local/offline use of the question catalogue. */
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // there's no browser redirect to complete on a native app
        detectSessionInUrl: false,
      },
    })
  : null;

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
