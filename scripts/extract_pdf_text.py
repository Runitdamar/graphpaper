#!/usr/bin/env python3
"""Save the opening text of each notice's PDF to scripts/pdf_text.json.

Used so summaries can be written from the real notice text instead of guessed from titles.
Only items that have no summary yet are processed.
"""
import io
import json
import sys
from pathlib import Path

import requests
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "updates.json"
OUT = ROOT / "scripts" / "pdf_text.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://www.cbse.gov.in/",
}


def main():
    items = json.loads(DATA.read_text(encoding="utf-8"))
    try:
        out = json.loads(OUT.read_text(encoding="utf-8"))
    except FileNotFoundError:
        out = {}
    for x in items:
        if x.get("summary") or x["id"] in out or not x["url"].lower().endswith(".pdf"):
            continue
        try:
            r = requests.get(x["url"], headers=HEADERS, timeout=45)
            r.raise_for_status()
            reader = PdfReader(io.BytesIO(r.content))
            text = " ".join((p.extract_text() or "") for p in reader.pages[:2])
            text = " ".join(text.split())
            out[x["id"]] = text[:3000] if text else "(no extractable text)"
            print(f"ok   {x['id']} {len(text)} chars")
        except Exception as e:  # keep going; note the failure
            out[x["id"]] = f"(failed: {type(e).__name__}: {e})"[:200]
            print(f"FAIL {x['id']} {e}", file=sys.stderr)
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
