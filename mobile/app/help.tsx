import { ScrollView, Text, View } from "react-native";
import { Card } from "@/components";
import { ScreenHeader } from "@/header";
import { useT } from "@/storage";
import { layout, spacing, type, useColors } from "@/theme";

export default function Help() {
  const c = useColors();
  const { t } = useT();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={t.help} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          padding: spacing.lg,
          gap: spacing.md,
          paddingBottom: spacing.xxl,
        }}
      >
        {t.faq.map((item) => (
          <Card key={item.q}>
            <Text style={{ ...type.body, fontWeight: "700", color: c.text }}>{item.q}</Text>
            <Text style={{ ...type.body, fontSize: 14, color: c.textMuted, marginTop: spacing.xs }}>
              {item.a}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
