

# Bite — VIP MVP Setup Guide (Laptop + Phone)

## Purpose

This repository contains a working VIP MVP of **Bite**, a mobile food scanner that supports:

1. **Barcode scanning** (camera) → product lookup (local mock data)
2. **Ingredient label scanning** (camera photo) → OCR extraction → ingredient risk flags
3. A simple backend API + local database skeleton for future expansion

The goal is an end-to-end demo that can run on a **real phone** with a clean, minimal UI.

---

## Repo Structure

```text
Bite/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── (other backend files)
└── frontend/
    ├── App.tsx
    ├── package.json
    └── src/
        ├── config.ts
        └── api.ts
```

---

## Prerequisites

### Laptop

* Python 3.9+
* Node.js 18+
* npm
* Expo Go installed on your phone

### Phone

* Expo Go (iOS / Android)
* Camera permission enabled

---

## Step 1 — Start the Backend (Laptop)

Open a terminal and run:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Must-have: backend binds to all interfaces

In `backend/app.py`, make sure Flask runs like this:

```py
app.run(host="0.0.0.0", port=5000, debug=True)
```

This is required for phone access. If it binds to `127.0.0.1`, the phone cannot connect.

---

## Step 2 — Connect Laptop and Phone to the Same Network

You have two options:

### Option A (Recommended): Use Your Phone Hotspot

1. Turn on hotspot on your phone.
2. Connect your laptop Wi-Fi to the hotspot.

Now your phone and laptop are guaranteed to be on the same network.

### Option B: Use Home / Campus Wi-Fi

* Ensure your laptop and phone are on the **same Wi-Fi**.
* Some networks block device-to-device traffic. If it fails, switch to hotspot.

---

## Step 3 — Find Your Laptop IP Address (Very Important)

The frontend must call your backend using your laptop’s IP, not `localhost`.

On macOS, run:

```bash
ipconfig getifaddr en0
```

Example output:

```text
172.20.10.12
```

That is your laptop IP address.

---

## Step 4 — Configure Frontend API URL (Laptop)

Edit this file:

```text
frontend/src/config.ts
```

Set:

```ts
export const API_BASE = "http://172.20.10.12:5000";
```

Replace `172.20.10.12` with the IP from Step 3.

### Important Notes

* Do not use `localhost`
* Do not use `127.0.0.1`
* The Expo URL (often port 8081) is not your backend

---

## Step 5 — Start the Frontend (Laptop)

Open another terminal and run:

```bash
cd frontend
npm install
npx expo start
```

### Open Expo DevTools on the web

When Expo starts, press:

```text
w
```

This opens Expo DevTools in your browser.

---

## Step 6 — Open the App on Your Phone

1. Open **Expo Go** on your phone
2. Scan the QR code shown in your terminal / DevTools
3. Allow camera permission

You should now see the Bite MVP home screen.

---

## Testing Checklist

### Test A: Backend reachable from phone

On your phone browser (Safari/Chrome), open:

```text
http://<YOUR_LAPTOP_IP>:5000
```

Example:

```text
http://172.20.10.12:5000
```

If this does not load, the app will not work. Fix network first.

### Test B: Barcode scan

* Tap **Scan Barcode**
* Scan a real barcode (or your seeded barcode)
* You should see a result screen with product information

### Test C: Ingredient label scan (OCR)

* Tap **Scan Label / Upload Label**
* Take a photo of an ingredient list
* You should see OCR text + health flags

---

## Common Issues and Fixes

### Issue 1: “Network request failed”

**Cause:** Wrong API base URL or backend not reachable.

**Fix:**

1. Confirm phone browser can open:

   ```text
   http://<IP>:5000
   ```
2. Confirm backend is running with:

   ```py
   host="0.0.0.0"
   ```
3. Confirm `frontend/src/config.ts` uses the correct IP.

---

### Issue 2: “localhost works on laptop but not on phone”

**Cause:** `localhost` on phone means the phone itself.

**Fix:**
Use laptop IP:

```ts
export const API_BASE = "http://<LAPTOP_IP>:5000";
```

---

### Issue 3: Phone cannot open `http://<IP>:5000`

**Most likely causes:**

* Backend is bound to localhost only
* macOS firewall blocks inbound connections
* laptop and phone not on same network

**Fix:**

1. Ensure Flask uses:

   ```py
   app.run(host="0.0.0.0", port=5000)
   ```
2. Temporarily disable macOS firewall:

   * System Settings → Network → Firewall → Off (test only)
3. Use hotspot instead of Wi-Fi

---

### Issue 4: Expo shows `http://localhost:8081`

**Explanation:**

* `8081` is Expo Metro bundler (frontend JS server)
* Your backend is still on port `5000`

This is normal.

---

## Developer Notes

### Why “host=0.0.0.0” is required

To allow other devices (your phone) to reach the backend, Flask must listen on the laptop’s network interface, not only on loopback.

### Why IP changes sometimes

If you switch from Wi-Fi to hotspot (or reconnect), your IP may change. Repeat Step 3 and update `config.ts`.

---

## Quick Start Summary

1. Start backend

   ```bash
   cd backend
   source .venv/bin/activate
   python app.py
   ```

2. Get IP

   ```bash
   ipconfig getifaddr en0
   ```

3. Set frontend API

   ```ts
   export const API_BASE = "http://<IP>:5000";
   ```

4. Start frontend

   ```bash
   cd frontend
   npx expo start
   ```

5. Scan QR code in Expo Go

