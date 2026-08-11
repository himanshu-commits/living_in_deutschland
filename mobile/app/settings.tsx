import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from "react-native";
import { Label } from "@/components";
import { ScreenHeader } from "@/header";
import { LANGUAGES } from "@/i18n";
import { useStore, useT, type ThemeMode } from "@/storage";
import { radius, spacing, type, useColors } from "@/theme";

const CONTACT_EMAIL = "khushireddy2001@gmail.com";

function Row({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
  destructive,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
}) {
  const c = useColors();
  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: spacing.lg,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.pill,
            backgroundColor: c.surfaceAlt,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 15 }}>{icon}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ ...type.body, fontWeight: "600", color: destructive ? c.wrong : c.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ ...type.body, fontSize: 13, color: c.textMuted, marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Text style={{ color: c.textMuted, fontSize: 20 }}>›</Text> : null)}
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}

function AppearancePicker() {
  const c = useColors();
  const { theme, setTheme } = useStore();
  const { t } = useT();
  const options: { key: ThemeMode; label: string }[] = [
    { key: null, label: t.system },
    { key: "light", label: t.light },
    { key: "dark", label: t.dark },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.surfaceAlt,
        borderRadius: radius.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((opt) => {
        const selected = theme === opt.key;
        return (
          <Pressable
            key={String(opt.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setTheme(opt.key)}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: "center",
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: selected ? c.surface : "transparent",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ ...type.label, color: selected ? c.text : c.textMuted }}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Settings() {
  const c = useColors();
  const { lang, translate, setTranslate, reset } = useStore();
  const { t } = useT();
  const currentLanguage = LANGUAGES.find((l) => l.code === lang)?.native ?? t.chooseLanguage;
  const version = Constants.expoConfig?.version;

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

  function onResetProgress() {
    Alert.alert(t.resetConfirmTitle, t.resetConfirmMessage, [
      { text: t.cancel, style: "cancel" },
      { text: t.resetAction, style: "destructive", onPress: () => reset() },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t.settings} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}
      >
      <View style={{ gap: spacing.sm }}>
        <Label>{t.chooseLanguage}</Label>
        <Row
          icon="🌐"
          title={currentLanguage}
          subtitle={t.change}
          onPress={() => router.push("/language")}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>{t.appearance}</Label>
        <AppearancePicker />
      </View>

      {lang && lang !== "de" && (
        <View style={{ gap: spacing.sm }}>
          <Label>{t.preferences}</Label>
          <Row
            icon="🈺"
            title={t.showTranslations}
            subtitle={t.showTranslationsNote}
            trailing={
              <Switch
                value={translate}
                onValueChange={setTranslate}
                trackColor={{ false: c.border, true: c.accent }}
                thumbColor={c.surface}
              />
            }
          />
        </View>
      )}

      <View style={{ gap: spacing.sm }}>
        <Label>{t.about}</Label>
        <Row icon="📤" title={t.share} onPress={onShare} />
        <Row icon="⭐" title={t.rate} onPress={onRate} />
        <Row icon="✉️" title={t.contact} onPress={onContact} />
        <Row icon="❓" title={t.help} onPress={() => router.push("/help")} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>{t.data}</Label>
        <Row
          icon="🗑️"
          title={t.resetProgress}
          subtitle={t.resetProgressNote}
          destructive
          onPress={onResetProgress}
        />
      </View>

      {version ? (
        <Text style={{ ...type.body, fontSize: 12, color: c.textMuted, textAlign: "center" }}>
          {t.home} · v{version}
        </Text>
      ) : null}
      </ScrollView>
    </View>
  );
}
