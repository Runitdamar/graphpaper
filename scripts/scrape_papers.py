#!/usr/bin/env python3
"""Read CBSE's sample-paper pages (Class X, XII) and its previous-years question-paper page, and save every
download link with its table row and section headings. Also checks that each link opens.
Result: scripts/papers_raw.json
"""
import json
import re
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin

import requests
import urllib3
from bs4 import BeautifulSoup

OUT = Path(__file__).resolve().parent / "papers_raw.json"
# CBSE hosts serve incomplete certificate chains on GitHub runners. This job only reads public pages and sends no credentials.
urllib3.disable_warnings()
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://cbseacademic.nic.in/"}
PAGES = {
    "sqp_x": "https://cbseacademic.nic.in/SQP_CLASSX_2026-27.html",
    "sqp_xii": "https://cbseacademic.nic.in/SQP_CLASSXII_2026-27.html",
    "pyq": "https://www.cbse.gov.in/cbsenew/question-paper.html",
}


def norm(t):
    return " ".join((t or "").split())


def check(h):
    try:
        x = requests.get(h, headers=H, timeout=(8, 30), stream=True, verify=False)
        head = next(x.iter_content(4), b"") if x.status_code == 200 else b""
        size = x.headers.get("Content-Length")
        x.close()
        return x.status_code == 200 and head[:2] in (b"%P", b"PK", b"Ra"), size
    except requests.RequestException:
        return False, None


out = {}
for key, url in PAGES.items():
    try:
        r = requests.get(url, headers=H, timeout=60, verify=False)
    except Exception as e:
        out[key] = {"error": "%s: %s" % (type(e).__name__, str(e)[:200])}
        continue
    print(key, r.status_code, len(r.text), file=sys.stderr, flush=True)
    if r.status_code != 200:
        out[key] = {"error": "HTTP %d" % r.status_code}
        continue
    soup = BeautifulSoup(r.text, "html.parser")
    rows = []
    for a in soup.find_all("a", href=True):
        href = urljoin(url, a["href"])
        if not re.search(r"\.(pdf|zip|rar)$", href, re.I):
            continue
        heads = []
        for prev in a.find_all_previous(["h1", "h2", "h3", "h4", "h5", "h6", "button", "summary", "strong", "b", "caption", "th"], limit=60):
            t = norm(prev.get_text())
            if t and len(t) < 140 and t not in heads:
                heads.append(t)
            if len(heads) >= 5:
                break
        tr = a.find_parent("tr")
        cells = [norm(td.get_text()) for td in tr.find_all(["td", "th"])] if tr else []
        rows.append({"href": href, "text": norm(a.get_text()), "row": cells[:6], "heads": heads})
    res = list(ThreadPoolExecutor(10).map(check, [x["href"] for x in rows]))
    for row, (ok, size) in zip(rows, res):
        row["ok"], row["size"] = ok, size
    out[key] = {"url": url, "links": rows}
    print(key, len(rows), "links,", sum(1 for ok, _ in res if ok), "open", file=sys.stderr, flush=True)
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
