import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const FREE_EXAMS_TOTAL = 3;
export const EXAM_USAGE_KEY = "lid.exam.total";
export type ExamAccess =
  | { state: "checking" }
  | { state: "allowed"; remaining: number | null }
  | { state: "blocked"; remaining: 0 };

function parseCount(raw: string | null): number {
  try {
    const value = raw ? Number(raw) : 0;
    if (Number.isInteger(value) && value >= 0) return value;
  } catch {
    // Corrupt usage data starts with no consumed attempts.
  }
  return 0;
}

export function useFreeExamRemaining(isPremium: boolean, entitlementLoading: boolean): number | null {
  const [remaining, setRemaining] = useState<number | null>(isPremium ? null : FREE_EXAMS_TOTAL);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (entitlementLoading) return () => { active = false; };
      if (isPremium) {
        setRemaining(null);
        return () => { active = false; };
      }
      AsyncStorage.getItem(EXAM_USAGE_KEY).then((raw) => {
        if (active) setRemaining(Math.max(0, FREE_EXAMS_TOTAL - parseCount(raw)));
      });
      return () => { active = false; };
    }, [entitlementLoading, isPremium]),
  );

  return remaining;
}

/** Consumes exactly one free exam start per mounted exam route. */
export function useFreeExamAccess(isPremium: boolean, entitlementLoading: boolean): ExamAccess {
  const [access, setAccess] = useState<ExamAccess>({ state: "checking" });
  const consumed = useRef(false);

  useEffect(() => {
    if (entitlementLoading || consumed.current) return;
    consumed.current = true;
    if (isPremium) {
      setAccess({ state: "allowed", remaining: null });
      return;
    }
    (async () => {
      const count = parseCount(await AsyncStorage.getItem(EXAM_USAGE_KEY));
      if (count >= FREE_EXAMS_TOTAL) {
        setAccess({ state: "blocked", remaining: 0 });
        return;
      }
      const next = count + 1;
      await AsyncStorage.setItem(EXAM_USAGE_KEY, String(next));
      setAccess({ state: "allowed", remaining: FREE_EXAMS_TOTAL - next });
    })();
  }, [entitlementLoading, isPremium]);

  return access;
}
