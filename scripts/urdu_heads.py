#!/usr/bin/env python3
"""Read the first-page text of each Class 10 Urdu-subject PDF so the books and chapters can be named.
Result: scripts/class10_urdu_heads.json
"""
import io
import json
import sys
import time
from pathlib import Path

import requests
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent / "class10_urdu_heads.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
COUNTS = {"judp1": 19, "juge1": 12, "jujp1": 22, "june1": 14, "jusr1": 9, "juuq1": 22}


def get(name):
    for attempt in range(3):
        try:
            r = requests.get(BASE + name, headers=H, timeout=(8, 60))
            if r.status_code == 200 and r.content[:4] == b"%PDF":
                return r.content
        except requests.RequestException:
            pass
        time.sleep(2)
    return None


out = {}
for code, n in COUNTS.items():
    rows = []
    for name in [code + "ps.pdf"] + ["%s%02d.pdf" % (code, i) for i in range(1, n + 1)]:
        body = get(name)
        if body is None:
            rows.append({"file": name, "error": "download failed"})
            continue
        try:
            rd = PdfReader(io.BytesIO(body))
            texts = []
            for pg in rd.pages[: (3 if name.endswith("ps.pdf") else 1)]:
                texts.append(" ".join((pg.extract_text() or "").split())[:400])
            rows.append({"file": name, "pages": len(rd.pages), "meta": str(rd.metadata.title) if rd.metadata and rd.metadata.title else None, "text": texts})
        except Exception as e:
            rows.append({"file": name, "error": type(e).__name__})
    out[code] = rows
    print(code, len(rows), file=sys.stderr, flush=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
