#!/usr/bin/env python3
"""Read the contents pages of NCERT books so chapter titles can be taken from the printed table of contents.

usage: python scripts/contents_cls.py <class number> <comma separated book codes>
For each book the "<code>ps.pdf" (preface + contents) is downloaded. English books are read as text. Hindi, Sanskrit and
Urdu books use legacy fonts that do not extract cleanly, so their first pages are also OCR'd with tesseract.
Result: scripts/contents_class<N>_<codes hash>.json  (merged per class into scripts/contents_class<N>.json)
"""
import io
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests
from pypdf import PdfReader

NUM = int(sys.argv[1])
CODES = [c for c in sys.argv[2].split(",") if c]
OUT = Path(__file__).resolve().parent / ("contents_class%d.json" % NUM)
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
sess = requests.Session()
sess.headers.update(H)
MAXP = 14


def fetch(name):
    for attempt in range(4):
        try:
            r = sess.get(BASE + name + ".pdf", timeout=(8, 60))
            if r.status_code == 200 and r.content[:4] == b"%PDF":
                return r.content
            if r.status_code == 404:
                return None
        except requests.RequestException:
            pass
        time.sleep(2 + attempt * 3)
    return None


def ocr(pdf_path, page, lang):
    with tempfile.TemporaryDirectory() as td:
        stem = str(Path(td) / "p")
        subprocess.run(["pdftoppm", "-r", "150", "-f", str(page), "-l", str(page), "-png", pdf_path, stem], check=False,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        pngs = sorted(Path(td).glob("p*.png"))
        if not pngs:
            return ""
        r = subprocess.run(["tesseract", str(pngs[0]), "-", "-l", lang, "--psm", "6"], capture_output=True, text=True)
        return " ".join(r.stdout.split())


res = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
for code in CODES:
    body = fetch(code + "ps")
    if body is None:
        print(code, "no ps.pdf", file=sys.stderr, flush=True)
        res[code] = {"error": "no ps.pdf"}
        continue
    rd = PdfReader(io.BytesIO(body))
    n = len(rd.pages)
    text = []
    for i in range(min(n, MAXP)):
        try:
            text.append(" ".join((rd.pages[i].extract_text() or "").split())[:2500])
        except Exception as e:
            text.append("(unreadable: %s)" % type(e).__name__)
    entry = {"pages": n, "text": text}
    lang_kind = code[1]
    if lang_kind in "hu" or code[2:4] in ("ar", "mr", "sk", "sh", "ga", "gr", "ju", "ur"):
        lang = "urd+eng" if lang_kind == "u" else ("hin+san+eng" if code[2:4] in ("sk", "sh") else "hin+eng")
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(body)
            path = f.name
        entry["ocr"] = [ocr(path, p, lang)[:2500] for p in range(1, min(n, MAXP) + 1)]
        entry["ocr_lang"] = lang
    res[code] = entry
    print(code, n, "pages", "OCR" if "ocr" in entry else "", file=sys.stderr, flush=True)
    OUT.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
