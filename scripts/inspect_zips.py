#!/usr/bin/env python3
"""List what is inside each Class 10 whole-book ZIP on ncert.nic.in (names, sizes, page-1 text).
Nothing from the ZIPs is saved except this list. Result: scripts/class10_zips.json
"""
import io
import json
import sys
import time
import zipfile
from pathlib import Path

import requests
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent / "class10_zips.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
CODES = ["jeff1", "jefp1", "jhks1", "jhkr1", "jhsp1", "jhsy1", "jemh1", "jesc1", "jess1", "jess2", "jess3", "jess4", "jhsk1", "jhva1", "jehp1"]
out = {}
for code in CODES:
    data = None
    for attempt in range(3):
        try:
            r = requests.get(BASE + code + "dd.zip", headers=H, timeout=(10, 120))
            if r.status_code == 200 and r.content[:2] == b"PK":
                data = r.content
                break
        except requests.RequestException:
            pass
        time.sleep(3)
    if data is None:
        out[code] = {"error": "download failed"}
        continue
    items = []
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for info in sorted(z.infolist(), key=lambda i: i.filename):
            if info.is_dir():
                continue
            row = {"name": info.filename, "size": info.file_size}
            if info.filename.lower().endswith(".pdf"):
                try:
                    rd = PdfReader(io.BytesIO(z.read(info)))
                    row["pages"] = len(rd.pages)
                    row["head"] = " ".join((rd.pages[0].extract_text() or "").split())[:300]
                except Exception as e:
                    row["head"] = "(unreadable: %s)" % type(e).__name__
            items.append(row)
    out[code] = {"zip_bytes": len(data), "files": items}
    print(code, len(items), "files", file=sys.stderr, flush=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
