#!/usr/bin/env python3
"""Check that every Class 10 link on the site (chapters, extras, whole-book ZIPs) really exists on ncert.nic.in.
Result: scripts/class10_links.json  (ok list count + the failures)
"""
import json
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

root = Path(__file__).resolve().parent
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
books = [b for b in json.loads((root.parent / "books_1_10.json").read_text(encoding="utf-8")) if b["cls"] == 10]
urls = []
for b in books:
    for n, _t, f in b["ch"]:
        urls.append(("%s%02d.pdf" % (b["code"], f)) if isinstance(f, int) else f)
    for _l, f in b.get("extra", []):
        urls.append(f)
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
(root / "class10_links.json").write_text(json.dumps({"tested": len(res), "failed": bad}, indent=1), encoding="utf-8")
print(len(res), "tested,", len(bad), "failed", bad)
