import os
from typing import Optional
from PIL import Image
import numpy as np

# Uses EasyOCR to extract text from an uploaded label image.
import easyocr

_reader: Optional[easyocr.Reader] = None

def get_reader():
    global _reader
    if _reader is None:
        # English only for MVP (you can add Chinese later: ['en', 'ch_sim'])
        _reader = easyocr.Reader(['en'], gpu=False)
    return _reader

def extract_text_from_image(image_path: str) -> str:
    """
    Returns a single best-effort string extracted from image.
    """
    reader = get_reader()
    img = Image.open(image_path).convert("RGB")
    arr = np.array(img)
    results = reader.readtext(arr, detail=0, paragraph=True)
    # results is list of strings
    text = " ".join(results).strip()
    return text
