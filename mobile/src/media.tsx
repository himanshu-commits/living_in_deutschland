import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { images } from "./imageMap";
import type { Media } from "./questions";
import { radius, spacing, type, useColors } from "./theme";

/** A licensed press photo we do not ship: show BAMF's own description instead. */
function Described({ alt }: { alt: string[] }) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.surfaceAlt,
        borderRadius: radius.md,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <Text style={{ ...type.label, color: c.textMuted, textTransform: "uppercase" }}>
        Bildbeschreibung
      </Text>
      {alt.map((line, i) => (
        <Text key={i} style={{ ...type.body, color: c.text }}>
          {line}
        </Text>
      ))}
    </View>
  );
}

/** One picture the question asks about (photo, flag, or a map with numbered areas). */
export function Illustration({ media }: { media: Media }) {
  const c = useColors();
  if (media.files.length === 0) return <Described alt={media.alt} />;

  const source = images[media.files[0]];
  if (!source) return <Described alt={media.alt} />;

  return (
    <View
      style={{
        // the aspect ratio belongs on the container, not the Image: a child's
        // aspectRatio-derived height does not reliably reach this View's own
        // height on native (especially inside a ScrollView), so overflow:
        // hidden below was clipping the image instead of just rounding corners
        width: "100%",
        aspectRatio: 4 / 3,
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        overflow: "hidden",
      }}
    >
      <Image
        source={source}
        accessible
        accessibilityRole="image"
        accessibilityLabel={media.alt[0] ?? "Abbildung zur Frage"}
        resizeMode="contain"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
}

/** Four pictures as the answers themselves, in a 2x2 grid numbered 1-4. */
export function ImageOptions({
  media,
  picked,
  answer,
  answered,
  onPick,
}: {
  media: Media;
  picked: number | null;
  answer: number | null;
  answered: boolean;
  onPick: (index: number) => void;
}) {
  const c = useColors();
  if (media.files.length !== 4) return <Described alt={media.alt} />;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
      {media.files.map((file, i) => {
        const correct = answered && i === answer;
        const wrong = answered && i === picked && i !== answer;
        const border = correct ? c.correct : wrong ? c.wrong : c.border;
        return (
          <Pressable
            key={file}
            onPress={() => onPick(i)}
            disabled={answered}
            accessibilityRole="radio"
            accessibilityState={{ selected: picked === i, disabled: answered }}
            accessibilityLabel={`Bild ${i + 1}. ${media.alt[i] ?? ""}`}
            style={({ pressed }) => ({
              width: "47%",
              flexGrow: 1,
              backgroundColor: c.surface,
              borderColor: picked === i && !answered ? c.accent : border,
              borderWidth: correct || wrong || picked === i ? 2 : StyleSheet.hairlineWidth,
              borderRadius: radius.md,
              padding: spacing.sm,
              opacity: pressed && !answered ? 0.9 : 1,
            })}
          >
            <Image
              source={images[file]}
              resizeMode="contain"
              style={{ width: "100%", aspectRatio: 1, backgroundColor: c.surface }}
            />
            <Text style={{ ...type.label, color: c.textMuted, textAlign: "center", marginTop: spacing.xs }}>
              Bild {i + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
