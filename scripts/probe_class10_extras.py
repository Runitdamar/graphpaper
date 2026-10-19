#!/usr/bin/env python3
"""Find the Class 10 poem files and whole-book downloads on ncert.nic.in.

1. Whole-book files: for every Class 10 book code, test a few likely names (dd.zip, ps.pdf, ...).
2. Poems: for First Flight (jeff1) and a few other codes, test every short suffix
   (two letters, letter + 1-2 digits, three digits) to see which PDF names exist.
Result: scripts/class10_extras.json
"""
import json
import string
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

OUT = Path(__file__).resolve().parent / "class10_extras.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
sess = requests.Session()
sess.headers.update(H)

MAIN = ["jeff1", "jefp1", "jhks1", "jhkr1", "jhsp1", "jhsy1", "jemh1", "jesc1", "jess1", "jess2", "jess3", "jess4",
        "jhsk1", "jhva1", "jehp1"]


def probe(name):
    for attempt in range(3):
        try:
            r = sess.get(BASE + name, timeout=(8, 30), stream=True)
            ok = r.status_code == 200
            head = next(r.iter_content(8), b"") if ok else b""
            size = r.headers.get("Content-Length")
            ctype = r.headers.get("Content-Type", "")
            r.close()
            if ok and (head[:4] == b"%PDF" or head[:2] == b"PK"):
                return {"name": name, "type": "pdf" if head[:4] == b"%PDF" else "zip", "size": size, "ctype": ctype}
            return None
        except requests.RequestException:
            time.sleep(1 + attempt)
    return None


def run(names, label):
    found = []
    with ThreadPoolExecutor(24) as ex:
        for res in ex.map(probe, names):
            if res:
                found.append(res)
                print("FOUND", res["name"], res["type"], res["size"], file=sys.stderr, flush=True)
    print(label, len(names), "tested,", len(found), "found", file=sys.stderr, flush=True)
    return found


result = {"whole": [], "poems": []}

whole = []
for code in MAIN:
    stem = code[:4]
    for suf in ["dd.zip", "dd.pdf", "ps.pdf", "an.pdf", "cc.pdf", "ap.pdf", "00.pdf", "ans.pdf"]:
        whole.append(code + suf)
    whole += [stem + "dd.zip", code[:5] + "dd.zip"]
whole = sorted(set(whole))
result["whole"] = run(whole, "whole-book names")
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")

suffixes = []
L = string.ascii_lowercase
suffixes += [a + b for a in L for b in L]
suffixes += ["%s%d" % (a, d) for a in L for d in range(10)]
suffixes += ["%s%02d" % (a, d) for a in L for d in range(100)]
suffixes += ["%03d" % d for d in range(100, 200)]
suffixes += ["%02d" % d for d in range(41, 100)]
names = []
for code in ["jeff1", "jeff2", "jefp1"]:
    names += [code + s + ".pdf" for s in suffixes]
result["poems"] = run(names, "poem-suffix scan")
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
