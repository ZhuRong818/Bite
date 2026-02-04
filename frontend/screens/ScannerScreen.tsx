import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { scanBarcode } from "../src/api";
import { Colors, Fonts, Shadows } from "../src/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Scanner">;

export default function ScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [intro]);

  async function onBarcodeScanned({ data }: { data: string }) {
    if (scanned || busy) return;
    setScanned(true);
    setBusy(true);
    try {
      const resp = await scanBarcode(data);
      navigation.replace("Result", { title: "Barcode Result", payload: resp });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed");
      setScanned(false);
    } finally {
      setBusy(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission is required.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing={"back" as CameraType}
          onBarcodeScanned={scanned ? undefined : onBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"],
          }}
        />
        <View style={styles.frame} pointerEvents="none" />
      </View>

      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: intro,
            transform: [
              {
                translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.tipCard, Shadows.soft]}>
          <Ionicons name="scan-outline" size={18} color={Colors.moss} />
          <Text style={styles.tipText}>Align the barcode inside the frame.</Text>
          {busy ? <Text style={styles.tipSub}>Scanning...</Text> : null}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScanned(false)}>
            <Text style={styles.secondaryBtnText}>Scan Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.night, padding: 12 },
  cameraWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  frame: {
    position: "absolute",
    top: "22%",
    left: "10%",
    right: "10%",
    height: "30%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.65)",
    borderStyle: "dashed",
  },
  overlay: {
    paddingTop: 12,
  },
  tipCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.ink,
    flex: 1,
  },
  tipSub: {
    fontFamily: Fonts.body,
    color: Colors.muted,
  },
  footer: { flexDirection: "row", gap: 12, paddingTop: 12 },
  primaryBtn: {
    backgroundColor: Colors.moss,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
  },
  primaryBtnText: { color: Colors.card, fontFamily: Fonts.bodyBold },
  secondaryBtn: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
  },
  secondaryBtnText: { color: Colors.ink, fontFamily: Fonts.bodyBold },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: Colors.cream },
  permissionText: { fontFamily: Fonts.body, marginBottom: 12, color: Colors.ink },
});
