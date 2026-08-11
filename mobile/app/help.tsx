import { ScrollView, Text } from "react-native";
import { Card } from "@/components";
import { useT } from "@/storage";
import { spacing, type, useColors } from "@/theme";

export default function Help() {
  const c = useColors();
  const { t } = useT();

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
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
  );
}
