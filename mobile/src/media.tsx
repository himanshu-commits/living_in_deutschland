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
        width: "100%",
        alignItems: "center",
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
        // Give iOS two explicit bounds. With only width + aspectRatio it may
        // retain a JPEG's intrinsic height inside ScrollView and clip the sides.
        style={{ width: "100%", height: 240, backgroundColor: c.surface }}
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
  order,
  onPick,
}: {
  media: Media;
  picked: number | null;
  answer: number | null;
  answered: boolean;
  /** Display positions containing canonical option indices. */
  order: number[];
  onPick: (index: number) => void;
}) {
  const c = useColors();
  if (media.files.length !== 4) return <Described alt={media.alt} />;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
      {order.map((originalIndex, displayIndex) => {
        const file = media.files[originalIndex];
        const correct = answered && originalIndex === answer;
        const wrong = answered && originalIndex === picked && originalIndex !== answer;
        const border = correct ? c.correct : wrong ? c.wrong : c.border;
        return (
          <Pressable
            key={file}
            onPress={() => onPick(originalIndex)}
            disabled={answered}
            accessibilityRole="radio"
            accessibilityState={{ selected: picked === originalIndex, disabled: answered }}
            accessibilityLabel={`Bild ${displayIndex + 1}. ${media.alt[originalIndex] ?? ""}`}
            style={({ pressed }) => ({
              width: "47%",
              flexGrow: 1,
              backgroundColor: c.surface,
              borderColor: picked === originalIndex && !answered ? c.accent : border,
              borderWidth: correct || wrong || picked === originalIndex ? 2 : StyleSheet.hairlineWidth,
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
              Bild {displayIndex + 1}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
