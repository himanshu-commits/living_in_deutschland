import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/header";
import { LANGUAGES, strings, type LangCode } from "@/i18n";
import { useStore } from "@/storage";
import { radius, spacing, type, useColors } from "@/theme";

export default function LanguagePicker() {
  const c = useColors();
  const { lang, state, setLang } = useStore();
  // before a choice exists there is no interface language, so this one screen
  // explains itself in English and lists every language in its own script
  const t = strings(lang ?? "en");

  async function choose(code: LangCode) {
    await setLang(code);
    // only send someone to the state picker if they have not chosen one yet;
    // changing language later must not make them pick their Bundesland again
    router.replace(state ? "/" : "/bundesland");
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t.chooseLanguage} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
      >
      <Text style={{ ...type.body, color: c.textMuted }}>{t.languageNote}</Text>

      {LANGUAGES.map((l) => {
        const selected = l.code === lang;
        return (
          <Pressable
            key={l.code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={l.latin ? `${l.native}, ${l.latin}` : l.native}
            onPress={() => choose(l.code)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: selected ? c.surfaceAlt : c.surface,
              borderColor: selected ? c.accent : c.border,
              borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
              borderRadius: radius.md,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.lg,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: spacing.sm, flex: 1 }}>
              <Text style={{ ...type.body, fontWeight: "600", color: c.text }}>{l.native}</Text>
              {l.latin && (
                <Text style={{ ...type.body, fontSize: 13, color: c.textMuted }}>{l.latin}</Text>
              )}
            </View>
            {selected && (
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent }} />
            )}
          </Pressable>
        );
      })}
      </ScrollView>
    </View>
  );
}
