import type { Session } from "@supabase/supabase-js";
import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "./storage";
import { supabase } from "./supabase";

type SessionState = {
  session: Session | null;
  loading: boolean;
  /**
   * Increments only when Supabase reports an explicit `SIGNED_IN` auth event —
   * an actual login just happened in this app instance. A session that is merely
   * restored from storage on cold start arrives as `INITIAL_SESSION` instead, so
   * that does not bump this counter. Lets a consumer (the Home screen's Premium
   * welcome banner) detect "the user just logged in" without re-firing on every
   * ordinary app open where a session was already persisted.
   */
  signInSeq: number;
};
const SessionCtx = createContext<SessionState | null>(null);

export function useSession() {
  const value = useContext(SessionCtx);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInSeq, setSignInSeq] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
      if (event === "SIGNED_IN") setSignInSeq((n) => n + 1);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return createElement(SessionCtx.Provider, { value: { session, loading, signInSeq } }, children);
}

type SyncStatus = "idle" | "syncing" | "synced" | "error";
const SyncCtx = createContext<SyncStatus>("idle");
export function useSyncStatus(): SyncStatus {
  return useContext(SyncCtx);
}

/** Pulls remote progress once per sign-in, then pushes local changes while signed in. Renders its children as-is. */
export function SyncEngine({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const { session } = useSession();
  const { ready, progress, marked, mistakes, lastTest, hydrate } = useStore();
  const [status, setStatus] = useState<SyncStatus>("idle");
  // the user this device has already pulled a remote snapshot for; re-pull only on a new sign-in
  const pulledFor = useRef<string | null>(null);
  // the push effect also fires right after the pull hydrates local state — skip that one
  const skipNextPush = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    if (!session || !enabled) {
      pulledFor.current = null;
      setStatus("idle");
      return;
    }
    if (!ready || pulledFor.current === session.user.id) return;
    pulledFor.current = session.user.id;
    skipNextPush.current = true;
    (async () => {
      setStatus("syncing");
      const { data, error } = await supabase
        .from("progress")
        .select("progress, marked, mistakes, last_test")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        setStatus("error");
        return;
      }
      if (data) {
        await hydrate({
          progress: data.progress ?? {},
          marked: data.marked ?? [],
          mistakes: data.mistakes ?? [],
          lastTest: data.last_test ?? null,
        });
      } else {
        await supabase
          .from("progress")
          .upsert({ user_id: session.user.id, progress, marked, mistakes, last_test: lastTest });
      }
      setStatus("synced");
    })();
    // only the sign-in transition should trigger a pull
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ready, enabled]);

  useEffect(() => {
    if (!supabase) return;
    if (!enabled || !session || !ready || pulledFor.current !== session.user.id) return;
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    setStatus("syncing");
    supabase
      .from("progress")
      .upsert({ user_id: session.user.id, progress, marked, mistakes, last_test: lastTest })
      .then(({ error }) => setStatus(error ? "error" : "synced"));
    // local-change-triggered push; session/ready are read via the guard above, not deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, marked, mistakes, lastTest, enabled]);

  return createElement(SyncCtx.Provider, { value: status }, children);
}
