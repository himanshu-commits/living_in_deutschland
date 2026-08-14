import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, Card, Label } from "@/components";
import { ScreenHeader } from "@/header";
import { useT } from "@/storage";
import { useSession, useSyncStatus } from "@/sync";
import { supabase } from "@/supabase";
import { spacing, type, useColors } from "@/theme";

export default function Profile() {
  const c = useColors();
  const { t, fill } = useT();
  const { session, loading } = useSession();
  const status = useSyncStatus();

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
        <Button label={t.signOut} variant="ghost" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  );
}
