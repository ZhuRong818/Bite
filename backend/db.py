import os
import sqlite3
from typing import Optional, Dict, Any, List, Tuple

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "food_scanner.db"))

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE,
        name TEXT,
        brand TEXT,
        source TEXT DEFAULT 'seed',
        status TEXT DEFAULT 'active',  -- active | pending
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS product_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        raw_text TEXT,                 -- original OCR snippet
        normalized_json TEXT,          -- JSON string of normalized ingredients list
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(product_id) REFERENCES products(id)
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT,
        scan_type TEXT,                -- barcode | label
        result_json TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    );
    """)

    conn.commit()
    conn.close()

def upsert_product(barcode: str, name: Optional[str], brand: Optional[str], source: str, status: str) -> int:
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("SELECT id FROM products WHERE barcode = ?", (barcode,))
    row = cur.fetchone()
    if row:
        product_id = row["id"]
        # Update missing fields if new info exists
        cur.execute("""
            UPDATE products
            SET name = COALESCE(?, name),
                brand = COALESCE(?, brand),
                source = COALESCE(?, source),
                status = COALESCE(?, status)
            WHERE id = ?
        """, (name, brand, source, status, product_id))
    else:
        cur.execute("""
            INSERT INTO products (barcode, name, brand, source, status)
            VALUES (?, ?, ?, ?, ?)
        """, (barcode, name, brand, source, status))
        product_id = cur.lastrowid

    conn.commit()
    conn.close()
    return int(product_id)

def get_product_by_barcode(barcode: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products WHERE barcode = ?", (barcode,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def get_latest_ingredients_for_product(product_id: int) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT * FROM product_ingredients
        WHERE product_id = ?
        ORDER BY id DESC
        LIMIT 1
    """, (product_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None

def save_product_ingredients(product_id: int, raw_text: str, normalized_json: str) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO product_ingredients (product_id, raw_text, normalized_json)
        VALUES (?, ?, ?)
    """, (product_id, raw_text, normalized_json))
    pid = cur.lastrowid
    conn.commit()
    conn.close()
    return int(pid)

def log_scan(barcode: Optional[str], scan_type: str, result_json: str) -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO scans (barcode, scan_type, result_json)
        VALUES (?, ?, ?)
    """, (barcode, scan_type, result_json))
    conn.commit()
    conn.close()
