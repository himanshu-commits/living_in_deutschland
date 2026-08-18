import { router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button, Card, Label, Notice } from "@/components";
import { authErrorMessage } from "@/auth";
import { ScreenHeader } from "@/header";
import { useStore, useT } from "@/storage";
import { useSession, useSyncStatus } from "@/sync";
import { supabase } from "@/supabase";
import { spacing, type, useColors } from "@/theme";
import { featureCopy } from "@/feature-copy";

export default function Profile() {
  const c = useColors();
  const { t, fill, lang } = useT();
  const copy = featureCopy(lang);
  const { session, loading } = useSession();
  const status = useSyncStatus();
  const { clearAll } = useStore();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function confirmDelete() {
    Alert.alert(
      copy.deleteAccountTitle,
      copy.deleteAccountMessage,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: copy.deleteAccountAction,
          style: "destructive",
          onPress: async () => {
            if (!supabase) return;
            setDeleting(true);
            setDeleteError(null);
            const { error } = await supabase.rpc("delete_own_account");
            if (error) {
              setDeleteError(authErrorMessage(error));
              setDeleting(false);
              return;
            }
            await supabase.auth.signOut({ scope: "local" });
            await clearAll();
            router.replace("/language");
          },
        },
      ],
    );
  }

  function confirmSignOut() {
    Alert.alert(
      copy.signOutTitle,
      copy.signOutMessage,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.signOut,
          style: "destructive",
          onPress: async () => {
            if (!supabase) return;
            const { error } = await supabase.auth.signOut({ scope: "local" });
            if (error) {
              setDeleteError(authErrorMessage(error));
              return;
            }
            await clearAll();
            router.replace("/language");
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={t.profile} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={t.profile} />
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <Card>
            <Label>{t.profile}</Label>
            <Text style={{ ...type.body, color: c.text, marginTop: spacing.sm }}>{t.notSignedIn}</Text>
            <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, marginTop: spacing.xs }}>
              {t.signInNote}
            </Text>
          </Card>
          <Button label={t.login} onPress={() => router.push("/login")} />
        </View>
      </View>
    );
  }

  const statusLabel =
    status === "syncing" ? t.syncStatusSyncing : status === "error" ? t.syncStatusError : t.syncStatusSynced;
  const statusColor = status === "error" ? c.wrong : c.textMuted;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t.profile} />
      <View style={{ padding: spacing.lg, gap: spacing.lg }}>
        <Card>
          <Label>{t.profile}</Label>
          <Text style={{ ...type.body, color: c.text, marginTop: spacing.sm }}>
            {fill(t.signedInAs, { email: session.user.email ?? "" })}
          </Text>
          <Text style={{ ...type.body, fontSize: 13, color: statusColor, marginTop: spacing.xs }}>
            {statusLabel}
          </Text>
        </Card>
        {deleteError ? <Notice tone="warn">{deleteError}</Notice> : null}
        <Button label={t.signOut} variant="ghost" onPress={confirmSignOut} />
        <Button label={copy.deleteAccountAction} variant="ghost" onPress={confirmDelete} disabled={deleting} />
      </View>
    </View>
  );
}
