import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from db import init_db, get_product_by_barcode, upsert_product, save_product_ingredients, get_latest_ingredients_for_product, log_scan
from scoring import build_analysis_payload, dumps_json
from ocr import extract_text_from_image

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = Flask(__name__)
CORS(app)

@app.get("/")
def home():
    # Simple test UI
    return """
    <html>
      <head><title>Food Scanner MVP</title></head>
      <body style="font-family: Arial; max-width: 820px; margin: 40px auto;">
        <h2>Food Scanner MVP</h2>

        <h3>1) Barcode Lookup</h3>
        <form id="barcodeForm">
          <input name="barcode" placeholder="Enter barcode" style="width: 320px; padding: 8px;" />
          <button style="padding: 8px 12px;">Scan Barcode</button>
        </form>

        <h3>2) Ingredient Label OCR</h3>
        <form id="labelForm" enctype="multipart/form-data">
          <input name="barcode" placeholder="Optional barcode (recommended)" style="width: 320px; padding: 8px;" />
          <br/><br/>
          <input type="file" name="image" accept="image/*" />
          <button style="padding: 8px 12px;">Upload & Analyze</button>
        </form>

        <h3>Result</h3>
        <pre id="out" style="background:#f5f5f5; padding: 16px; border-radius: 8px;"></pre>

        <script>
          const out = document.getElementById("out");

          document.getElementById("barcodeForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const barcode = fd.get("barcode");
            const res = await fetch("/api/scan/barcode", {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify({ barcode })
            });
            out.textContent = JSON.stringify(await res.json(), null, 2);
          });

          document.getElementById("labelForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const res = await fetch("/api/scan/label", { method: "POST", body: fd });
            out.textContent = JSON.stringify(await res.json(), null, 2);
          });
        </script>
      </body>
    </html>
    """

@app.get("/barcode/<code>")
def barcode_lookup_simple(code: str):
    code = (code or "").strip()
    if not code:
        return jsonify({"error": "barcode is required"}), 400

    product = get_product_by_barcode(code)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    latest_ing = get_latest_ingredients_for_product(product["id"])
    ingredients = None
    analysis = None
    if latest_ing:
        normalized = json.loads(latest_ing["normalized_json"])
        ingredients = normalized.get("normalized_ingredients", [])
        analysis = normalized.get("analysis", {})

    return jsonify({
        "barcode": code,
        "name": product.get("name"),
        "brand": product.get("brand"),
        "ingredients": ingredients,
        "analysis": analysis
    })

@app.post("/ocr")
def ocr_only():
    if "image" not in request.files:
        return jsonify({"error": "image file is required"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename or "upload.jpg")
    path = os.path.join(UPLOAD_DIR, filename)
    file.save(path)

    try:
        raw_text = extract_text_from_image(path)
    except Exception as e:
        return jsonify({"error": f"OCR failed: {str(e)}"}), 500

    return jsonify({"text": raw_text})

@app.post("/api/scan/barcode")
def scan_barcode():
    data = request.get_json(force=True)
    barcode = (data.get("barcode") or "").strip()
    if not barcode:
        return jsonify({"error": "barcode is required"}), 400

    product = get_product_by_barcode(barcode)
    if not product:
        # Create pending product so DB grows
        product_id = upsert_product(barcode, name=None, brand=None, source="user_scan", status="pending")
        payload = {
            "barcode": barcode,
            "found": False,
            "product": {"id": product_id, "barcode": barcode, "status": "pending"},
            "message": "Product not found. Created as pending. Upload ingredient label to analyze and enrich database."
        }
        log_scan(barcode, "barcode", json.dumps(payload, ensure_ascii=False))
        return jsonify(payload)

    product_id = product["id"]
    latest_ing = get_latest_ingredients_for_product(product_id)
    if latest_ing:
        normalized = json.loads(latest_ing["normalized_json"])
        payload = {
            "barcode": barcode,
            "found": True,
            "product": product,
            "ingredients": normalized.get("normalized_ingredients", []),
            "analysis": normalized.get("analysis", {})
        }
    else:
        payload = {
            "barcode": barcode,
            "found": True,
            "product": product,
            "message": "Product found but no ingredient analysis yet. Upload ingredient label to analyze."
        }

    log_scan(barcode, "barcode", json.dumps(payload, ensure_ascii=False))
    return jsonify(payload)

@app.post("/api/scan/label")
def scan_label():
    """
    Multipart form:
      - image: required
      - barcode: optional (but recommended)
      - name/brand: optional
    """
    if "image" not in request.files:
        return jsonify({"error": "image file is required"}), 400

    barcode = (request.form.get("barcode") or "").strip()
    name = (request.form.get("name") or "").strip() or None
    brand = (request.form.get("brand") or "").strip() or None

    file = request.files["image"]
    filename = secure_filename(file.filename or "upload.jpg")
    path = os.path.join(UPLOAD_DIR, filename)
    file.save(path)

    # OCR extract text
    try:
        raw_text = extract_text_from_image(path)
    except Exception as e:
        return jsonify({"error": f"OCR failed: {str(e)}"}), 500

    if not raw_text:
        return jsonify({"error": "No text detected. Please retake photo with clearer ingredient list."}), 400

    analysis_payload = build_analysis_payload(raw_text)
    analysis_json = dumps_json(analysis_payload)

    product_id = None
    if barcode:
        # Create/update product record
        product = get_product_by_barcode(barcode)
        if product:
            product_id = product["id"]
            upsert_product(barcode, name=name, brand=brand, source=product.get("source", "user_scan"), status=product.get("status", "active"))
        else:
            # New product scanned via label
            product_id = upsert_product(barcode, name=name, brand=brand, source="user_scan", status="pending")
    else:
        # No barcode: store analysis without linking (still log scan)
        # For MVP simplicity: require barcode to save into product DB
        payload = {
            "barcode": None,
            "message": "OCR + analysis succeeded, but barcode missing. Provide barcode to save into product database.",
            "ocr_text": raw_text,
            "result": analysis_payload
        }
        log_scan(None, "label", json.dumps(payload, ensure_ascii=False))
        return jsonify(payload)

    # Save ingredient analysis
    save_product_ingredients(product_id, raw_text=raw_text, normalized_json=analysis_json)

    payload = {
        "barcode": barcode,
        "product_id": product_id,
        "ocr_text": raw_text,
        "result": analysis_payload,
        "message": "Saved analysis to database (pending product if newly created)."
    }
    log_scan(barcode, "label", json.dumps(payload, ensure_ascii=False))
    return jsonify(payload)

@app.get("/api/product/<barcode>")
def get_product(barcode: str):
    barcode = (barcode or "").strip()
    product = get_product_by_barcode(barcode)
    if not product:
        return jsonify({"error": "not found"}), 404

    latest_ing = get_latest_ingredients_for_product(product["id"])
    return jsonify({
        "product": product,
        "latest_ingredients": latest_ing
    })

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
