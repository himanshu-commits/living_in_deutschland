import type { Session } from "@supabase/supabase-js";
import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "./storage";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

type SyncStatus = "idle" | "syncing" | "synced" | "error";
const SyncCtx = createContext<SyncStatus>("idle");
export function useSyncStatus(): SyncStatus {
  return useContext(SyncCtx);
}

/** Pulls remote progress once per sign-in, then pushes local changes while signed in. Renders its children as-is. */
export function SyncEngine({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { ready, progress, marked, mistakes, lastTest, hydrate } = useStore();
  const [status, setStatus] = useState<SyncStatus>("idle");
  // the user this device has already pulled a remote snapshot for; re-pull only on a new sign-in
  const pulledFor = useRef<string | null>(null);
  // the push effect also fires right after the pull hydrates local state — skip that one
  const skipNextPush = useRef(false);

  useEffect(() => {
    if (!session) {
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
  }, [session, ready]);

  useEffect(() => {
    if (!session || !ready || pulledFor.current !== session.user.id) return;
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
  }, [progress, marked, mistakes, lastTest]);

  return createElement(SyncCtx.Provider, { value: status }, children);
}
