#!/usr/bin/env python3
"""Read CBSE's 2026-27 curriculum page and save every syllabus link with its section, so the
Syllabus page can list real files. Also checks that each PDF link opens.
Result: scripts/curriculum_links.json
"""
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

OUT = Path(__file__).resolve().parent / "curriculum_links.json"
URL = "https://cbseacademic.nic.in/curriculum_2027.html"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://cbseacademic.nic.in/"}

try:
    r = requests.get(URL, headers=H, timeout=60)
except Exception as e:
    OUT.write_text(json.dumps({"error": "%s: %s" % (type(e).__name__, str(e)[:300])}, indent=1), encoding="utf-8")
    raise
print("status", r.status_code, len(r.text), file=sys.stderr)
if r.status_code != 200:
    OUT.write_text(json.dumps({"error": "HTTP %d" % r.status_code, "body": r.text[:300]}, indent=1), encoding="utf-8")
    raise SystemExit(1)
soup = BeautifulSoup(r.text, "html.parser")


def norm(t):
    return " ".join((t or "").split())


rows = []
for a in soup.find_all("a", href=True):
    href = urljoin(URL, a["href"])
    if not re.search(r"\.(pdf|zip)$", href, re.I):
        continue
    # section headings above this link: nearest preceding heading-like elements
    heads = []
    for prev in a.find_all_previous(["h1", "h2", "h3", "h4", "h5", "h6", "button", "summary", "strong", "b"], limit=40):
        t = norm(prev.get_text())
        if t and len(t) < 120 and t not in heads:
            heads.append(t)
        if len(heads) >= 4:
            break
    tr = a.find_parent("tr")
    cells = [norm(td.get_text()) for td in tr.find_all(["td", "th"])] if tr else []
    li = a.find_parent("li")
    rows.append({"href": href, "text": norm(a.get_text()), "row": cells[:4], "li": norm(li.get_text())[:120] if li else "", "heads": heads})

print(len(rows), "pdf links", file=sys.stderr)


def ok(h):
    try:
        x = requests.get(h, headers=H, timeout=(8, 30), stream=True)
        head = next(x.iter_content(4), b"") if x.status_code == 200 else b""
        x.close()
        return x.status_code == 200 and head[:2] in (b"%P", b"PK")
    except requests.RequestException:
        return False


with ThreadPoolExecutor(12) as ex:
    res = list(ex.map(ok, [x["href"] for x in rows]))
for row, good in zip(rows, res):
    row["ok"] = good
OUT.write_text(json.dumps({"page_status": r.status_code, "links": rows}, ensure_ascii=False, indent=1), encoding="utf-8")
print(sum(res), "links open,", len(res) - sum(res), "do not", file=sys.stderr)
