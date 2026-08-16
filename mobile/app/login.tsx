import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Notice } from "@/components";
import { authErrorMessage } from "@/auth";
import { authCopy } from "@/auth-copy";
import { ScreenHeader } from "@/header";
import { useT } from "@/storage";
import { supabase } from "@/supabase";
import { radius, spacing, type, useColors } from "@/theme";

function Field({
  label,
  value,
  onChangeText,
  secure,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
}) {
  const c = useColors();
  const [reveal, setReveal] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !reveal}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={secure ? "default" : "email-address"}
          style={{
            ...type.body,
            flex: 1,
            color: c.text,
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: StyleSheet.hairlineWidth,
            borderRadius: radius.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
          }}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={reveal ? "Hide password" : "Show password"}
            onPress={() => setReveal((v) => !v)}
            hitSlop={10}
            style={{ position: "absolute", right: spacing.lg }}
          >
            <Text style={{ ...type.label, color: c.accent }}>{reveal ? "Hide" : "Show"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function Login() {
  const c = useColors();
  const { t, lang } = useT();
  const a = authCopy(lang);
  const [signingUp, setSigningUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function submit() {
    setError(null);
    setInfo(null);
    if (!supabase) {
      setError("Cloud sign-in is not configured for this build.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      setError(a.validEmail);
      return;
    }
    if (password.length < 6) {
      setError(a.passwordMin);
      return;
    }

    setBusy(true);
    try {
      if (signingUp) {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (error) {
          setError(authErrorMessage(error));
          return;
        }
        // No session means Supabase is waiting on the confirmation email.
        if (!data.session) {
          setInfo(t.confirmEmailNote);
          setSigningUp(false);
          setPendingConfirmation(normalizedEmail);
          return;
        }
        router.replace("/");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        setError(authErrorMessage(error));
        return;
      }
      router.replace("/");
    } catch {
      setError(a.connect);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!supabase || !pendingConfirmation || resent) return;
    setError(null);
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: pendingConfirmation });
    setBusy(false);
    if (error) setError(authErrorMessage(error));
    else {
      setResent(true);
      setInfo(a.confirmationSent);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={signingUp ? t.signUp : t.login} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Field label={t.email} value={email} onChangeText={setEmail} />
        <Field label={t.password} value={password} onChangeText={setPassword} secure />

        {error ? <Notice tone="warn">{error}</Notice> : null}
        {info ? <Notice tone="info">{info}</Notice> : null}

        {pendingConfirmation && !resent ? (
          <Pressable accessibilityRole="button" onPress={resendConfirmation} disabled={busy}>
            <Text style={{ ...type.body, fontSize: 13, color: c.accent, textAlign: "center" }}>
              {a.resend}
            </Text>
          </Pressable>
        ) : null}

        <Button
          label={signingUp ? t.signUp : t.login}
          onPress={submit}
          disabled={busy || !email || !password}
        />

        <Pressable accessibilityRole="button" onPress={() => setSigningUp((v) => !v)}>
          <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, textAlign: "center" }}>
            {signingUp ? t.haveAccountAlready : t.noAccountYet}
          </Text>
        </Pressable>

        {!signingUp ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/forgot-password")}>
            <Text style={{ ...type.body, fontSize: 13, color: c.accent, textAlign: "center" }}>
              {a.forgot}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
