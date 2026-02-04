import { API_BASE } from "./config";

export async function scanBarcode(barcode: string) {
  const res = await fetch(`${API_BASE}/api/scan/barcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ barcode }),
  });

  const data = await res.json();
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

  form.append("image", {
    uri: params.imageUri,
    name: "label.jpg",
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_BASE}/api/scan/label`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Label upload failed");
  return data;
}
