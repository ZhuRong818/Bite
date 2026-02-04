
# Bite — AI-Powered Food Scanner (MVP)

## Overview

**Bite** is an AI-powered food scanning application designed specifically for **Singapore and Asian food products**.
Unlike existing Western-focused nutrition apps, Bite analyzes **local packaged foods** using ingredient-level understanding aligned with **Health Promotion Board (HPB) dietary guidance**.

The MVP validates the core pipeline:

* Barcode scanning
* Ingredient label OCR
* Ingredient understanding
* Health risk flagging
* Self-improving product database

This repository contains both the **backend (AI + API)** and a **React Native frontend (Expo)** for end-to-end demonstration.

---

## Key Features (MVP)

### 1. Barcode Scanning

* Scan or manually enter food barcodes
* Retrieve product information from a Singapore-focused database
* Handle unknown products by creating *pending entries*

### 2. Ingredient Label Scanning (OCR)

* Capture ingredient labels via camera or photo upload
* OCR extracts raw ingredient text
* Designed for real-world packaging (varied fonts, lighting, layouts)

### 3. Ingredient Understanding & Health Analysis

* Normalizes ingredient text into structured components
* Flags potential health risks based on ingredient cues:

  * Added sugars
  * High sodium indicators
  * Saturated fat sources
  * Additives and allergens
* Produces **non-medical**, explainable health guidance

### 4. Self-Improving Database

* Products not found via barcode can be enriched using label scans
* Each scan improves coverage and accuracy over time
* Enables network effects as usage grows

---

## System Architecture

```text
Mobile App (React Native / Expo)
        ↓
Flask REST API (Backend)
        ↓
OCR (EasyOCR) + Ingredient Parsing
        ↓
Health Scoring Engine (HPB-aligned rules)
        ↓
SQLite Product & Ingredient Database
```

---

## Repository Structure

```text
Bite/
├── backend/
│   ├── app.py              # Flask API server
│   ├── db.py               # SQLite database logic
│   ├── scoring.py          # Ingredient normalization & health scoring
│   ├── ocr.py              # OCR pipeline
│   ├── seed.py             # Seed database script
│   ├── requirements.txt
│   └── data/
│       └── products_seed.csv
│
├── frontend/
│   ├── App.tsx             # React Native Expo app
│   ├── src/
│   │   ├── api.ts
│   │   └── config.ts
│   └── package.json
│
└── README.md
```

---

## Backend Setup

### Prerequisites

* Python 3.9+
* `pip`
* Virtual environment recommended

### Installation

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Initialize Database

```bash
python seed.py
```

This seeds the database with a small set of Singapore/Asian products for demo purposes.

### Run Backend Server

```bash
python app.py
```

Backend runs at:

```text
http://localhost:5000
```

---

## Frontend Setup (React Native / Expo)

### Prerequisites

* Node.js 18+
* Expo CLI
* Expo Go app (iOS / Android)

### Installation

```bash
cd frontend
npm install
```

### Configure Backend URL

Set the backend URL (pick one):

Option A: set an Expo env var before starting:

```bash
EXPO_PUBLIC_API_BASE="http://<YOUR_LAPTOP_IP>:5000" npx expo start
```

Option B: edit `src/config.ts`:

```ts
export const API_BASE = "http://<YOUR_LAPTOP_IP>:5000";
```

> Note: `localhost` does not work on physical mobile devices.
> Use your computer’s local IP (same Wi-Fi network).

### Run Frontend

```bash
npx expo start
```

Scan the QR code using **Expo Go**.

---

## How to Use (Demo Flow)

### Barcode Scan

1. Open the app
2. Scan a barcode using the camera
3. If product exists → view health analysis
4. If product is new → prompted to upload ingredient label

### Ingredient Label Scan

1. Take or upload a photo of the ingredient list
2. OCR extracts ingredients
3. App displays health risk flags
4. Product is saved and enriched in the database

---

## Health Scoring Disclaimer

Bite provides **ingredient-based health guidance**, not medical advice.

* No calorie counting or diagnosis
* No disease-specific recommendations
* Designed for awareness and informed choices

Users should always consult packaging labels and healthcare professionals when needed.

---

## Technical Highlights

* OCR pipeline optimized for noisy, real-world images
* Rule-based ingredient interpretation (ML-ready)
* Clear upgrade path to:

  * YOLO-based ingredient panel detection
  * Multilingual OCR (Chinese/English)
  * Personalized dietary profiles

---

## Future Work

* YOLO-powered ingredient region detection
* Expanded Singapore supermarket coverage
* FairPrice product data integration
* Premium features (personalized goals, history)
* Corporate wellness pilots
