#!/usr/bin/env python3
"""Find the Class 10 Urdu books on ncert.nic.in (Urdu-medium file names start with 'ju').
Result: scripts/class10_urdu.json  (per book: chapter files, extra files, whole-book ZIP, ZIP contents)
"""
import io
import json
import string
import sys
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent / "class10_urdu.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
sess = requests.Session()
sess.headers.update(H)


def probe(name):
    for attempt in range(3):
        try:
            r = sess.get(BASE + name, timeout=(8, 30), stream=True)
            ok = r.status_code == 200
            head = next(r.iter_content(8), b"") if ok else b""
            size = r.headers.get("Content-Length")
            r.close()
            if ok and (head[:4] == b"%PDF" or head[:2] == b"PK"):
                return {"name": name, "size": size}
            return None
        except requests.RequestException:
            time.sleep(1 + attempt)
    return None


L = string.ascii_lowercase
prefixes = []
combos = ["ju" + a + b for a in L for b in L]


def first(p):
    for part in "1234":
        for ch in ("01", "00"):
            if probe("%s%s%s.pdf" % (p, part, ch)):
                return p
    return None


with ThreadPoolExecutor(24) as ex:
    for res in ex.map(first, combos):
        if res:
            prefixes.append(res)
            print("FOUND", res, file=sys.stderr, flush=True)

out = {"prefixes": prefixes, "books": {}}
for p in prefixes:
    for part in "1234":
        code = p + part
        chs, miss = [], 0
        for n in range(0, 41):
            r = probe("%s%02d.pdf" % (code, n))
            if r:
                miss = 0
                chs.append(r)
            else:
                miss += 1
                if miss >= 6 and n > 6:
                    break
        if not chs:
            continue
        extra = [r for r in (probe(code + s) for s in ["ps.pdf", "an.pdf", "lp.pdf", "a1.pdf", "a2.pdf", "dd.zip", "cc.pdf"]) if r]
        zinfo = []
        if any(e["name"].endswith("dd.zip") for e in extra):
            try:
                z = zipfile.ZipFile(io.BytesIO(sess.get(BASE + code + "dd.zip", timeout=(10, 120)).content))
                for info in sorted(z.infolist(), key=lambda i: i.filename):
                    if info.is_dir():
                        continue
                    row = {"name": info.filename, "size": info.file_size}
                    if info.filename.lower().endswith(".pdf"):
                        try:
                            rd = PdfReader(io.BytesIO(z.read(info)))
                            row["pages"] = len(rd.pages)
                        except Exception:
                            pass
                    zinfo.append(row)
            except Exception as e:
                zinfo = [{"error": type(e).__name__}]
        out["books"][code] = {"chapters": chs, "extra": extra, "zip": zinfo}
        print("BOOK", code, len(chs), file=sys.stderr, flush=True)
        OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
