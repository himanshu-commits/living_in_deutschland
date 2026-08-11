import { router } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Label } from "@/components";
import { LANGUAGES } from "@/i18n";
import { useStore, useT } from "@/storage";
import { radius, spacing, type, useColors } from "@/theme";

const CONTACT_EMAIL = "khushireddy2001@gmail.com";

function Row({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: spacing.lg,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ ...type.body, fontWeight: "600", color: c.text }}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={{ color: c.textMuted, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

export default function Settings() {
  const c = useColors();
  const { lang } = useStore();
  const { t } = useT();
  const currentLanguage = LANGUAGES.find((l) => l.code === lang)?.native ?? t.chooseLanguage;

  async function onShare() {
    try {
      await Share.share({ message: t.shareMessage });
    } catch {
      // the user dismissing the share sheet is not an error
    }
  }

  function onRate() {
    Alert.alert(t.rate, t.rateComingSoon);
  }

  function onContact() {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`).catch(() => {});
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}
    >
      <View style={{ gap: spacing.sm }}>
        <Label>{t.chooseLanguage}</Label>
        <Row title={currentLanguage} subtitle={t.change} onPress={() => router.push("/language")} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>{t.about}</Label>
        <Row title={t.share} onPress={onShare} />
        <Row title={t.rate} onPress={onRate} />
        <Row title={t.contact} onPress={onContact} />
        <Row title={t.help} onPress={() => router.push("/help")} />
      </View>
    </ScrollView>
  );
}
