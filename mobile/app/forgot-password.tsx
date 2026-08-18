import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, Notice } from "@/components";
import { authErrorMessage } from "@/auth";
import { authCopy } from "@/auth-copy";
import { ScreenHeader } from "@/header";
import { useT } from "@/storage";
import { supabase } from "@/supabase";
import { radius, spacing, type, useColors } from "@/theme";
import { featureCopy } from "@/feature-copy";

export default function ForgotPassword() {
  const c = useColors();
  const { t, lang } = useT();
  const a = authCopy(lang);
  const copy = featureCopy(lang);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    const normalizedEmail = email.trim().toLowerCase();
    setError(null);
    if (!supabase) return setError(copy.cloudUnavailable);
    if (!normalizedEmail.includes("@")) return setError(a.validEmail);
    setBusy(true);
    try {
      // Expo Go produces its current exp:// development URL here; installed
      // builds use the lebenindeutschland:// scheme declared in app.json.
      const redirectTo = Linking.createURL("reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      if (error) setError(authErrorMessage(error));
      else setSent(true);
    } catch {
      setError(a.connect);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={a.resetTitle} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text style={{ ...type.body, color: c.textMuted }}>
          {a.resetIntro}
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder={t.email}
          placeholderTextColor={c.textMuted}
          style={{ ...type.body, color: c.text, backgroundColor: c.surface, borderColor: c.border,
            borderWidth: 1, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }}
        />
        {error ? <Notice tone="warn">{error}</Notice> : null}
        {sent ? <Notice tone="info">{a.checkEmail}</Notice> : null}
        <Button label={a.sendLink} onPress={send} disabled={busy || sent || !email} />
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={{ ...type.body, fontSize: 13, color: c.accent, textAlign: "center" }}>{a.back}</Text>
        </Pressable>
      </View>
    </View>
  );
}
