#!/usr/bin/env python3
"""Read the first two pages of each Class 12 Hindi and Sanskrit chapter PDF with OCR, because the PDFs use an old
font that cannot be copied as text. Result: scripts/class12_hindi_ocr.json (code -> chapter file -> text of page 1 and 2)."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parent / "class12_hindi_ocr.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
BOOKS = {"lhar1": 15, "lhvt1": 3, "lhat1": 17, "lhan1": 3, "lhsk1": 10, "lhsk2": 11}
out = {}
for code, n in BOOKS.items():
    out[code] = {}
    for i in range(1, n + 1):
        name = "%s%02d" % (code, i)
        pages = []
        try:
            r = requests.get(BASE + name + ".pdf", headers=H, timeout=(8, 60))
            if r.status_code != 200:
                out[code][name] = {"error": r.status_code}
                continue
            with tempfile.TemporaryDirectory() as d:
                pdf = Path(d) / "a.pdf"
                pdf.write_bytes(r.content)
                subprocess.run(["pdftoppm", "-r", "170", "-f", "1", "-l", "3", "-png", str(pdf), str(Path(d) / "p")], check=True)
                for png in sorted(Path(d).glob("p-*.png")):
                    t = subprocess.run(["tesseract", str(png), "-", "-l", "hin+eng", "--psm", "6"], capture_output=True, text=True).stdout
                    pages.append(" / ".join(l.strip() for l in t.splitlines() if l.strip())[:500])
        except Exception as e:
            pages = ["ERROR %s" % e]
        out[code][name] = {"pages": pages}
        print(name, pages[:1], file=sys.stderr, flush=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
