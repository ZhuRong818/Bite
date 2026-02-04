import csv
import os
from db import init_db, upsert_product

def seed_from_csv(csv_path: str):
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            barcode = row.get("barcode", "").strip()
            name = row.get("name", "").strip() or None
            brand = row.get("brand", "").strip() or None
            if barcode:
                upsert_product(barcode, name, brand, source="seed", status="active")

if __name__ == "__main__":
    init_db()
    csv_path = os.path.join(os.path.dirname(__file__), "data", "products_seed.csv")
    if not os.path.exists(csv_path):
        print(f"Seed file not found at {csv_path}. Skipping seed.")
        raise SystemExit(0)
    seed_from_csv(csv_path)
    print("Seed complete.")
