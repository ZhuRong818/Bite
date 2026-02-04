import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Image, Animated } from "react-native";
import { CameraView, CameraType, useCameraPermissions, CameraViewRef } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../App";
import { uploadLabelImage } from "../src/api";
import { Colors, Fonts, Shadows } from "../src/theme";

type Props = NativeStackScreenProps<RootStackParamList, "LabelScanner">;

export default function LabelScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraViewRef | null>(null);
  const intro = useRef(new Animated.Value(0)).current;

  const [barcode, setBarcode] = useState("");
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission]);

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [intro]);

  async function takePhoto() {
    if (!cameraRef.current) return;
    setCaptureBusy(true);
    try {
      const photo = await cameraRef.current.takePicture({ quality: 0.8 });
      setCapturedUri(photo.uri);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to capture photo");
    } finally {
      setCaptureBusy(false);
    }
  }

  async function pickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return Alert.alert("Permission needed", "Photo library permission is required.");
      const pick = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
      if (!pick.canceled) setCapturedUri(pick.assets[0].uri);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not pick image");
    }
  }

  async function submit() {
    if (!capturedUri) return Alert.alert("Missing image", "Capture or choose a label photo first.");
    setBusy(true);
    try {
      const data = await uploadLabelImage({ barcode: barcode.trim() || undefined, imageUri: capturedUri });
      navigation.replace("Result", { title: "Label OCR Result", payload: data });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed");
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
        {capturedUri ? (
          <Image source={{ uri: capturedUri }} style={styles.preview} />
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing={"back" as CameraType} />
        )}
        <View style={styles.frame} pointerEvents="none" />
      </View>

      <Animated.View
        style={{
          opacity: intro,
          transform: [
            {
              translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
            },
          ],
        }}
      >
        <View style={[styles.panel, Shadows.soft]}>
          <Text style={styles.h2}>Ingredient label</Text>
          <Text style={styles.small}>Capture a clean, flat shot for best OCR results.</Text>

          <View style={styles.inputWrap}>
            <Ionicons name="barcode-outline" size={16} color={Colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Barcode (optional)"
              placeholderTextColor={Colors.muted}
              value={barcode}
              onChangeText={setBarcode}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={capturedUri ? () => setCapturedUri(null) : takePhoto}
            >
              <Text style={styles.secondaryBtnText}>
                {capturedUri ? "Retake" : captureBusy ? "Capturing..." : "Capture"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
              <Text style={styles.secondaryBtnText}>Choose Photo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!capturedUri || busy) && styles.disabled]}
            onPress={submit}
            disabled={!capturedUri || busy}
          >
            <Text style={styles.primaryBtnText}>{busy ? "Analyzing..." : "Upload & Analyze"}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream, padding: 12 },
  cameraWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 12,
  },
  camera: { flex: 1 },
  preview: { flex: 1, resizeMode: "cover" },
  frame: {
    position: "absolute",
    top: "20%",
    left: "8%",
    right: "8%",
    height: "40%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  panel: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  h2: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.ink, marginBottom: 4 },
  small: { fontFamily: Fonts.body, color: Colors.muted, marginBottom: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.mist,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    color: Colors.ink,
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  primaryBtn: {
    backgroundColor: Colors.coral,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: Colors.card, fontFamily: Fonts.bodyBold },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: { color: Colors.ink, fontFamily: Fonts.bodyBold },
  disabled: { opacity: 0.6 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: Colors.cream },
  permissionText: { fontFamily: Fonts.body, marginBottom: 12, color: Colors.ink },
});
