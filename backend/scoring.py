import json
import re
from typing import List, Dict, Any, Tuple

# Very practical MVP rule sets (you can refine with nutrition experts later)
HIGH_SUGAR_TERMS = {
    "sugar", "glucose", "glucose syrup", "fructose", "corn syrup", "high fructose corn syrup",
    "maltodextrin", "dextrose", "sucrose", "invert sugar", "honey", "molasses"
}
HIGH_SODIUM_TERMS = {
    "salt", "sodium", "sodium chloride", "monosodium glutamate", "msg", "disodium inosinate",
    "disodium guanylate", "sodium benzoate"
}
SAT_FAT_TERMS = {
    "palm oil", "palm kernel oil", "hydrogenated", "partially hydrogenated", "shortening"
}
ALLERGEN_TERMS = {
    "milk", "soy", "wheat", "gluten", "peanut", "tree nut", "egg", "fish", "shellfish", "sesame"
}
ADDITIVE_HINTS = {
    "e621", "e211", "e202", "e250", "e951", "aspartame", "acesulfame", "sucralose",
    "tartrazine", "sunset yellow", "brilliant blue"
}

def normalize_ingredients(raw_text: str) -> List[str]:
    """
    Simple normalization:
    - lowercase
    - remove bracketed notes
    - split by commas/semicolons
    - trim whitespace
    """
    t = raw_text.lower()
    t = re.sub(r"\(.*?\)", " ", t)
    t = re.sub(r"\[.*?\]", " ", t)
    # Replace common separators with commas
    t = t.replace(";", ",").replace("•", ",").replace("·", ",")
    parts = [p.strip() for p in t.split(",")]
    # Filter empties and very short noise
    parts = [p for p in parts if len(p) >= 2]
    # Deduplicate while preserving order
    seen = set()
    out = []
    for p in parts:
        p = re.sub(r"\s+", " ", p).strip()
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out

def _match_terms(ingredients: List[str], term_set: set) -> List[str]:
    hits = []
    for ing in ingredients:
        for term in term_set:
            # substring match for MVP simplicity
            if term in ing:
                hits.append(term)
    # unique
    return sorted(set(hits))

def score_health(ingredients: List[str]) -> Dict[str, Any]:
    """
    Returns:
    - score_label: A/B/C (simple)
    - risk_flags: list of explainable flags
    - highlights: matched terms
    """
    sugar_hits = _match_terms(ingredients, HIGH_SUGAR_TERMS)
    sodium_hits = _match_terms(ingredients, HIGH_SODIUM_TERMS)
    satfat_hits = _match_terms(ingredients, SAT_FAT_TERMS)
    allergen_hits = _match_terms(ingredients, ALLERGEN_TERMS)
    additive_hits = _match_terms(ingredients, ADDITIVE_HINTS)

    risk_flags = []
    if sugar_hits:
        risk_flags.append("High in added sugars (based on ingredient cues)")
    if sodium_hits:
        risk_flags.append("Likely high sodium / salt (based on ingredient cues)")
    if satfat_hits:
        risk_flags.append("Contains saturated fat sources (e.g., palm/hydrogenated oils)")
    if additive_hits:
        risk_flags.append("Contains food additives / sweeteners (consume in moderation)")
    if allergen_hits:
        risk_flags.append("Potential allergens detected (check if you have allergies)")

    # Simple MVP scoring:
    # A: none or only allergens
    # B: 1–2 risk categories
    # C: 3+ risk categories
    risk_categories = sum(bool(x) for x in [sugar_hits, sodium_hits, satfat_hits, additive_hits])
    if risk_categories == 0:
        score_label = "A"
    elif risk_categories <= 2:
        score_label = "B"
    else:
        score_label = "C"

    return {
        "score_label": score_label,
        "risk_flags": risk_flags,
        "matches": {
            "sugar": sugar_hits,
            "sodium": sodium_hits,
            "sat_fat": satfat_hits,
            "additives": additive_hits,
            "allergens": allergen_hits
        },
        "disclaimer": "This is a non-medical, ingredient-cue-based estimate aligned to general healthy eating guidance. Always verify packaging and consult professionals for medical advice."
    }

def build_analysis_payload(raw_text: str) -> Dict[str, Any]:
    ingredients = normalize_ingredients(raw_text)
    analysis = score_health(ingredients)
    return {
        "raw_text": raw_text,
        "normalized_ingredients": ingredients,
        "analysis": analysis
    }

def dumps_json(obj: Dict[str, Any]) -> str:
    return json.dumps(obj, ensure_ascii=False)
