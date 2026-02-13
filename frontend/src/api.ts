import { Platform } from "react-native";
import { API_BASE } from "./config";


export async function scanBarcode(barcode: string) {

  const res = await fetch(`${API_BASE}/api/scan/barcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode }),
  }).catch((err) => {
    console.error("Error during fetch for barcode scan:", err);
    throw new Error("Network error during barcode scan");
  });

  const data = await res.json();
  console.log("Received response from barcode scan:", data);
  if (!res.ok) throw new Error(data?.error || "Barcode scan failed");
  return data;
}

export async function uploadLabelImage(params: {
  barcode?: string;
  imageUri: string;
  name?: string;
  brand?: string;
}) {
  const form = new FormData();
  if (params.barcode) form.append("barcode", params.barcode);
  if (params.name) form.append("name", params.name);
  if (params.brand) form.append("brand", params.brand);

  if (Platform.OS === "web") {
    const resp = await fetch(params.imageUri);
    const blob = await resp.blob();
    const file = new File([blob], "label.jpg", { type: blob.type || "image/jpeg" });
    form.append("image", file);
  } else {
    form.append("image", {
      uri: params.imageUri,
      name: "label.jpg",
      type: "image/jpeg",
    } as any);
  }

  const res = await fetch(`${API_BASE}/api/scan/label`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Label upload failed");
  return data;
}
