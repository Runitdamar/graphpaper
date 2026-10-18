#!/usr/bin/env python3
"""One-off: read the NCERT textbook portal and save what it offers (classes, subjects, books)."""
import re
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

OUT = Path(__file__).resolve().parent / "ncert_portal.txt"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
lines = []

def log(*a):
    lines.append(" ".join(str(x) for x in a))
    print(*a, file=sys.stderr)

try:
    r = requests.get("https://ncert.nic.in/textbook.php", headers=H, timeout=(8, 30))
    log("STATUS", r.status_code, "len", len(r.text))
    soup = BeautifulSoup(r.text, "html.parser")
    for sel in soup.find_all("select"):
        log("SELECT id=%s name=%s" % (sel.get("id"), sel.get("name")))
        for o in sel.find_all("option"):
            log("  OPTION", repr(o.get("value")), o.get_text(" ", strip=True))
    for s in soup.find_all("script"):
        t = s.string or ""
        if "textbook" in t.lower() or "option" in t.lower():
            log("SCRIPT>>", t[:3000])
    for a in soup.find_all("a", href=True):
        if "textbook" in a["href"] or ".pdf" in a["href"] or ".zip" in a["href"]:
            log("LINK", a["href"], a.get_text(" ", strip=True)[:60])
    log("RAWHEAD", r.text[:1500])
except Exception as e:
    log("ERROR", type(e).__name__, e)

# Try the per-book listing page for a known book (Class XII Physics Part I)
for q in ["keph1=0-8", "leph1=0-8", "jesc1=0-10"]:
    try:
        r = requests.get("https://ncert.nic.in/textbook.php?" + q, headers=H, timeout=(8, 30))
        log("BOOKPAGE", q, r.status_code, len(r.text))
        soup = BeautifulSoup(r.text, "html.parser")
        for a in soup.find_all("a", href=True):
            if ".pdf" in a["href"] or ".zip" in a["href"]:
                log("  PDF", a["href"], a.get_text(" ", strip=True)[:80])
        txt = " ".join(soup.get_text(" ", strip=True).split())
        log("  TEXT", txt[:800])
    except Exception as e:
        log("ERROR", q, type(e).__name__, e)

OUT.write_text("\n".join(lines), encoding="utf-8")
