#!/usr/bin/env python3
"""Re-probe the Class 10 English-medium books more patiently and keep richer title hints.

The first discovery pass stopped after two missing files, which cut Political Science short.
This pass retries each file 3 times, tolerates 6 misses in a row, and stores the PDF
bookmarks plus the first 600 characters of page 1 so chapter names can be read reliably.
Result: scripts/class10_refined.json
"""
import io
import json
import sys
import time
from pathlib import Path

import requests
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent / "class10_refined.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
CODES = ["jeff1", "jefp1", "jemh1", "jehp1", "jesc1", "jess1", "jess2", "jess3", "jess4", "jess5"]
sess = requests.Session()
sess.headers.update(H)


def fetch(name):
    for attempt in range(3):
        try:
            r = sess.get(BASE + name + ".pdf", timeout=(8, 40))
            if r.status_code == 200 and r.content[:4] == b"%PDF":
                return r.content
            if r.status_code == 404:
                return None
        except requests.RequestException:
            pass
        time.sleep(2 + attempt * 2)
    return None


def outline_titles(rd):
    out = []
    def walk(o):
        for x in o:
            if isinstance(x, list):
                walk(x)
            else:
                try:
                    out.append(str(x.title))
                except Exception:
                    pass
    try:
        walk(rd.outline)
    except Exception:
        pass
    return out[:6]


books = {}
for code in CODES:
    chs, miss = [], 0
    for n in range(1, 41):
        name = "%s%02d" % (code, n)
        body = fetch(name)
        if body is None:
            miss += 1
            if miss >= 6:
                break
            continue
        miss = 0
        try:
            rd = PdfReader(io.BytesIO(body))
            text = " ".join((rd.pages[0].extract_text() or "").split())[:600]
            chs.append({"file": name, "pages": len(rd.pages), "outline": outline_titles(rd), "head": text})
        except Exception as e:
            chs.append({"file": name, "pages": None, "outline": [], "head": "(unreadable: %s)" % type(e).__name__})
    books[code] = chs
    print(code, [c["file"][-2:] for c in chs], file=sys.stderr, flush=True)
    OUT.write_text(json.dumps(books, ensure_ascii=False, indent=1), encoding="utf-8")
