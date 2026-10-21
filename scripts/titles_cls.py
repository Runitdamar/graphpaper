#!/usr/bin/env python3
"""Find chapter titles of NCERT books by looking at the first page of every chapter PDF.

usage: python scripts/titles_cls.py <class number> <comma separated book codes>
English books: the biggest-font lines on the first page (and the second page if the first has none).
Hindi / Sanskrit books use legacy fonts that do not extract cleanly, so the top of the first page is also OCR'd.
Result: scripts/titles_class<N>.json  {code: [{"file": "...", "big": [[size, text], ...], "ocr": "..."}]}
"""
import io
import json
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import fitz  # pymupdf
import requests

NUM = int(sys.argv[1])
CODES = [c for c in sys.argv[2].split(",") if c]
root = Path(__file__).resolve().parent
disc = json.loads((root / ("discovery_class%d.json" % NUM)).read_text(encoding="utf-8"))["books"]
OUT = root / ("titles_class%d.json" % NUM)
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
sess = requests.Session()
sess.headers.update(H)


def fetch(name):
    for attempt in range(3):
        try:
            r = sess.get(BASE + name + ".pdf", timeout=(8, 60))
            if r.status_code == 200 and r.content[:4] == b"%PDF":
                return r.content
        except requests.RequestException:
            pass
        time.sleep(1 + attempt)
    return None


def big_lines(page):
    rows = []
    for blk in page.get_text("dict")["blocks"]:
        for ln in blk.get("lines", []):
            txt = "".join(s["text"] for s in ln["spans"]).strip()
            if not txt:
                continue
            size = max(s["size"] for s in ln["spans"])
            rows.append((round(size, 1), round(ln["bbox"][1]), txt))
    rows.sort(key=lambda r: (-r[0], r[1]))
    out, seen = [], set()
    for size, y, txt in rows:
        if txt in seen:
            continue
        seen.add(txt)
        out.append([size, txt])
        if len(out) >= 6:
            break
    return out


def ocr_top(page, lang):
    pix = page.get_pixmap(dpi=150, clip=fitz.Rect(0, 0, page.rect.width, page.rect.height * 0.45))
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "p.png"
        pix.save(str(p))
        r = subprocess.run(["tesseract", str(p), "-", "-l", lang, "--psm", "6"], capture_output=True, text=True)
    return " | ".join(x.strip() for x in r.stdout.splitlines() if x.strip())[:400]


def one(code, ch):
    data = fetch(ch["file"])
    if not data:
        return {"file": ch["file"], "error": "download failed"}
    try:
        doc = fitz.open(stream=data, filetype="pdf")
        res = {"file": ch["file"], "pages": len(doc), "big": big_lines(doc[0])}
        if len(doc) > 1:
            res["big2"] = big_lines(doc[1])
        lang = "hin+san+eng" if code[1] in "hu" or code.startswith(("ghsk", "hhsk")) else "eng"
        if code[1] != "e" or not res["big"]:
            res["ocr"] = ocr_top(doc[0], lang)
        return res
    except Exception as e:  # noqa
        return {"file": ch["file"], "error": str(e)[:120]}


result = {}
for code in CODES:
    chs = disc[code]["chapters"]
    with ThreadPoolExecutor(6) as ex:
        result[code] = list(ex.map(lambda c: one(code, c), chs))
    print(code, len(chs), flush=True)
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=0), encoding="utf-8")
