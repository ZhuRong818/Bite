import json
import os
import urllib.request
import urllib.error
from typing import Tuple

API_KEY = (os.getenv("DEEPSEEK_API_KEY") or "").strip()  # required for LLM calls; fallback if missing
BASE_URL = (os.getenv("DEEPSEEK_BASE_URL") or "https://api.deepseek.com").rstrip("/")  # override for proxies
MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")  # default DeepSeek chat model
TIMEOUT = float(os.getenv("DEEPSEEK_TIMEOUT", "20"))  # network timeout in seconds

SYSTEM_PROMPT = (  # instruct model to return only ingredients, not marketing or manufacturer info
    "You extract ingredient lists from noisy OCR text. "
    "Remove manufacturer info, addresses, slogans, nutrition facts, storage tips, "
    "and advertising. Return ONLY the ingredient list as a single line, comma-separated. "
    "If there is no clear ingredient list, return the original text unchanged."
)


def filter_ingredients(raw_text: str) -> Tuple[str, str]:
    if not API_KEY:
        return raw_text, "skipped_no_key"  # no API key -> skip LLM and use OCR text

    payload = {  # DeepSeek chat completions payload
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": raw_text},
        ],
        "temperature": 0,
    }

    req = urllib.request.Request(  # standard HTTPS POST request via urllib
        url=f"{BASE_URL}/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:  # execute request
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            content = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            if not content:
                return raw_text, "empty_response"  # fall back if LLM returns nothing
            return content, "ok"
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError):
        return raw_text, "error"  # on network/parse error, fall back to OCR text
