#!/usr/bin/env python3
"""Check that every link of one books_<N>.json (chapters, extras, whole-book ZIPs) really exists on ncert.nic.in.
usage: python scripts/verify_links_cls.py 9   ->  scripts/class9_links.json"""
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

NUM = sys.argv[1]
root = Path(__file__).resolve().parent
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
books = json.loads((root.parent / ("books_%s.json" % NUM)).read_text(encoding="utf-8"))
urls = []
for b in books:
    for n, _t, f in b["ch"]:
        urls.append(("%s%02d.pdf" % (b["code"], f)) if isinstance(f, int) else f)
    for _l, f in b.get("extra", []):
        urls.append(f)
    if b.get("zip"):
        urls.append(b["zip"])
sess = requests.Session()
sess.headers.update(H)


def check(name):
    for attempt in range(3):
        try:
            r = sess.get(BASE + name, timeout=(8, 30), stream=True)
            head = next(r.iter_content(4), b"") if r.status_code == 200 else b""
            r.close()
            return name, r.status_code == 200 and head[:2] in (b"%P", b"PK")
        except requests.RequestException:
            time.sleep(2)
    return name, False


with ThreadPoolExecutor(12) as ex:
    res = list(ex.map(check, urls))
bad = [n for n, ok in res if not ok]
(root / ("class%s_links.json" % NUM)).write_text(json.dumps({"tested": len(res), "failed": bad}, indent=1), encoding="utf-8")
print(len(res), "tested,", len(bad), "failed", bad)
