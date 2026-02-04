import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { scanBarcode } from "../src/api";
import { Colors, Fonts, Shadows } from "../src/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [barcode, setBarcode] = useState("");
  const [busy, setBusy] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [intro]);

  async function doManualBarcode() {
    const code = barcode.trim();
    if (!code) return Alert.alert("Missing barcode", "Please enter a barcode.");

    setBusy(true);
    try {
      const data = await scanBarcode(code);
      navigation.navigate("Result", { title: "Barcode Result", payload: data });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />

      <Animated.View
        style={{
          opacity: intro,
          transform: [
            {
              translateY: intro.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        }}
      >
        <Text style={styles.kicker}>Fresh scan, clearer choices</Text>
        <Text style={styles.h1}>Bite</Text>
        <Text style={styles.p}>
          Scan barcodes or ingredient labels and get quick, explainable health cues.
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.primaryBtn, Shadows.soft]} onPress={() => navigation.navigate("Scanner")}>
            <Ionicons name="barcode-outline" size={20} color={Colors.card} />
            <Text style={styles.primaryBtnText}>Scan Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, Shadows.soft]} onPress={() => navigation.navigate("LabelScanner")}>
            <Ionicons name="camera-outline" size={20} color={Colors.ink} />
            <Text style={styles.secondaryBtnText}>Scan Label</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.h2}>Manual barcode lookup</Text>
          <Text style={styles.small}>Great for testing or when the camera can’t read.</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter barcode"
            placeholderTextColor={Colors.muted}
            value={barcode}
            onChangeText={setBarcode}
            keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
          />
          <TouchableOpacity style={[styles.ghostBtn, busy && styles.disabled]} onPress={doManualBarcode} disabled={busy}>
            <Text style={styles.ghostBtnText}>{busy ? "Scanning..." : "Lookup"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipRow}>
          <Ionicons name="sparkles-outline" size={18} color={Colors.moss} />
          <Text style={styles.tipText}>Tip: Aim for flat, well-lit ingredient labels.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: Colors.cream,
  },
  bgOrbA: {
    position: "absolute",
    top: -120,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FFD6C9",
    opacity: 0.6,
  },
  bgOrbB: {
    position: "absolute",
    bottom: -140,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#CFE6D5",
    opacity: 0.7,
  },
  kicker: {
    fontFamily: Fonts.bodyBold,
    color: Colors.moss,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h1: {
    fontFamily: Fonts.display,
    fontSize: 36,
    color: Colors.ink,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  p: {
    fontFamily: Fonts.body,
    color: Colors.muted,
    fontSize: 15,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: Colors.moss,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.card,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.ink,
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  h2: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 4,
  },
  small: {
    fontFamily: Fonts.body,
    color: Colors.muted,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.mist,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    fontFamily: Fonts.body,
    color: Colors.ink,
    marginBottom: 10,
  },
  ghostBtn: {
    backgroundColor: Colors.sun,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  ghostBtnText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.ink,
  },
  disabled: { opacity: 0.6 },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 16,
  },
  tipText: {
    fontFamily: Fonts.body,
    color: Colors.moss,
  },
});
