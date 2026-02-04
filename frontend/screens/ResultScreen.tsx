import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { Colors, Fonts, Shadows } from "../src/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

type Analysis = {
  score_label?: string;
  risk_flags?: string[];
  matches?: Record<string, string[]>;
  disclaimer?: string;
};

type ChipTone = "default" | "risk" | "accent";

export default function ResultScreen({ route, navigation }: Props) {
  const { payload, title } = route.params;

  React.useEffect(() => {
    if (title) navigation.setOptions({ title });
  }, [title, navigation]);

  const analysis: Analysis | undefined = payload?.analysis || payload?.result?.analysis;
  const ingredients: string[] | undefined = payload?.ingredients || payload?.result?.normalized_ingredients;
  const rawText: string | undefined = payload?.ocr_text || payload?.result?.raw_text;

  const scoreLabel = analysis?.score_label || null;
  const riskFlags = analysis?.risk_flags || [];
  const matches = analysis?.matches || {};

  const product = payload?.product;
  const barcode = payload?.barcode || product?.barcode;
  const productName = product?.name || payload?.name || "Unknown product";
  const brand = product?.brand || payload?.brand || null;
  const status = product?.status || (payload?.found === false ? "pending" : null);
  const message = payload?.message || null;

  const scoreColor = scoreLabel === "A" ? Colors.moss : scoreLabel === "B" ? Colors.sun : scoreLabel === "C" ? Colors.coral : Colors.muted;

  const matchList = Object.entries(matches).filter(([, vals]) => Array.isArray(vals) && vals.length > 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.sectionLabel}>Product</Text>
          <Text style={styles.h1}>{productName}</Text>
          {brand ? <Text style={styles.subtle}>{brand}</Text> : null}
          {barcode ? <Text style={styles.subtle}>Barcode: {barcode}</Text> : null}
          {status ? <Text style={styles.subtle}>Status: {status}</Text> : null}
        </View>

        {message ? (
          <View style={[styles.note, Shadows.soft]}>
            <Text style={styles.noteText}>{message}</Text>
          </View>
        ) : null}

        <View style={[styles.card, Shadows.soft]}>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreBadge, { borderColor: scoreColor }]}> 
              <Text style={[styles.scoreText, { color: scoreColor }]}>Score {scoreLabel || "—"}</Text>
            </View>
            <Text style={styles.sectionLabel}>Health Summary</Text>
          </View>

          <Text style={styles.sectionTitle}>Risk flags</Text>
          {riskFlags.length > 0 ? (
            <View style={styles.chipRow}>
              {riskFlags.map((flag, idx) => (
                <Chip key={`${flag}-${idx}`} text={flag} tone="risk" />
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No major risks flagged.</Text>
          )}

          <Text style={styles.sectionTitle}>Detected cues</Text>
          {matchList.length > 0 ? (
            <View style={styles.chipRow}>
              {matchList.map(([key, vals]) => (
                <Chip key={key} text={`${key}: ${vals.join(", ")}`} tone="accent" />
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No matched ingredient cues.</Text>
          )}

          {analysis?.disclaimer ? <Text style={styles.disclaimer}>{analysis.disclaimer}</Text> : null}
        </View>

        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.sectionLabel}>Ingredients</Text>
          {ingredients && ingredients.length > 0 ? (
            <View style={styles.chipRow}>
              {ingredients.map((ing, idx) => (
                <Chip key={`${ing}-${idx}`} text={ing} tone="default" />
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>No ingredients parsed.</Text>
          )}
          {rawText ? (
            <>
              <Text style={styles.sectionTitle}>OCR text</Text>
              <Text style={styles.code}>{rawText}</Text>
            </>
          ) : null}
        </View>

        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.sectionLabel}>Raw Response</Text>
          <Text style={styles.code}>{JSON.stringify(payload, null, 2)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Chip({ text, tone }: { text: string; tone: ChipTone }) {
  const styleByTone =
    tone === "risk"
      ? { backgroundColor: "#FFE7E2", borderColor: "#F5B2A8", textColor: Colors.coral }
      : tone === "accent"
      ? { backgroundColor: "#F2F6EC", borderColor: "#CFE0C0", textColor: Colors.moss }
      : { backgroundColor: Colors.mist, borderColor: Colors.border, textColor: Colors.ink };

  return (
    <View style={[styles.chip, { backgroundColor: styleByTone.backgroundColor, borderColor: styleByTone.borderColor }]}> 
      <Text style={[styles.chipText, { color: styleByTone.textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 14, backgroundColor: Colors.cream },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  h1: { fontSize: 18, fontFamily: Fonts.display, color: Colors.ink, marginBottom: 4 },
  subtle: { color: Colors.muted, fontFamily: Fonts.body },

  sectionLabel: { fontSize: 12, fontFamily: Fonts.bodyBold, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.ink, marginTop: 10, marginBottom: 6 },

  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  scoreBadge: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: { fontFamily: Fonts.bodyBold },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontFamily: Fonts.body, fontSize: 12 },
  muted: { color: Colors.muted, fontFamily: Fonts.body },

  note: {
    backgroundColor: "#FFF5DE",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0D5A6",
  },
  noteText: { color: "#8A5A00", fontFamily: Fonts.body },

  disclaimer: { marginTop: 10, color: Colors.muted, fontSize: 12, fontFamily: Fonts.body },

  code: {
    fontFamily: Platform.OS === "ios" ? Fonts.mono : Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.ink,
  },
});
