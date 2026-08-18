import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Button, Notice } from "@/components";
import { authErrorMessage, createSessionFromUrl } from "@/auth";
import { authCopy } from "@/auth-copy";
import { ScreenHeader } from "@/header";
import { useT } from "@/storage";
import { supabase } from "@/supabase";
import { radius, spacing, type, useColors } from "@/theme";
import { featureCopy } from "@/feature-copy";

export default function ResetPassword() {
  const c = useColors();
  const { lang } = useT();
  const a = authCopy(lang);
  const copy = featureCopy(lang);
  const incomingUrl = Linking.useLinkingURL();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!incomingUrl) return;
    if (!supabase) return setError(copy.cloudUnavailable);
    createSessionFromUrl(incomingUrl, supabase)
      .then(() => setReady(true))
      .catch((e: unknown) => setError(authErrorMessage(e)));
  }, [incomingUrl]);

  async function updatePassword() {
    setError(null);
    if (!supabase) return setError(copy.cloudUnavailable);
    if (password.length < 6) return setError(a.passwordMin);
    if (password !== confirm) return setError(a.mismatch);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    router.replace("/profile");
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={a.newTitle} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        {error ? <Notice tone="warn">{error}</Notice> : null}
        {!ready && !error ? <Notice tone="info">{a.validating}</Notice> : null}
        {ready ? <>
          <Text style={{ ...type.body, color: c.textMuted }}>{a.enterNew}</Text>
          {[{ value: password, set: setPassword, placeholder: a.newPassword },
            { value: confirm, set: setConfirm, placeholder: a.confirmPassword }].map((field) => (
            <TextInput key={field.placeholder} value={field.value} onChangeText={field.set} secureTextEntry
              autoCapitalize="none" placeholder={field.placeholder} placeholderTextColor={c.textMuted}
              style={{ ...type.body, color: c.text, backgroundColor: c.surface, borderColor: c.border,
                borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }} />
          ))}
          <Button label={a.updatePassword} onPress={updatePassword} disabled={busy || !password || !confirm} />
        </> : null}
      </View>
    </View>
  );
}
