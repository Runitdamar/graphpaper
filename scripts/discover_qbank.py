#!/usr/bin/env python3
"""Find CBSE and NCERT pages that hold question banks, support material and similar study resources.
Starts at a few known pages, follows links whose text or address looks relevant (two levels), and saves each page's
title, link count and sample links. Result: scripts/qbank_discovery.json
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
import urllib3
from bs4 import BeautifulSoup

OUT = Path(__file__).resolve().parent / "qbank_discovery.json"
# CBSE hosts serve incomplete certificate chains on GitHub runners. This job only reads public pages and sends no credentials.
urllib3.disable_warnings()
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}
START = [
    "https://cbseacademic.nic.in/",
    "https://cbseacademic.nic.in/web_material/",
    "https://cbseacademic.nic.in/supportmaterial.html",
    "https://cbseacademic.nic.in/QuestionBank.html",
    "https://cbseacademic.nic.in/question-bank.html",
    "https://cbseacademic.nic.in/Question-Bank.html",
    "https://cbseacademic.nic.in/curriculum.html",
    "https://www.cbse.gov.in/cbsenew/cbse.html",
    "https://ncert.nic.in/exemplar-problems.php",
    "https://ncert.nic.in/",
]
KEY = re.compile(r"question.?bank|support.?material|exemplar|practice|competency|resource|e-?content|worksheet|learning.?outcome|handbook|assessment|study.?material|hots|qb", re.I)
DOC = re.compile(r"\.(pdf|zip|rar|docx?)$", re.I)
ALLOWED = ("cbseacademic.nic.in", "cbse.gov.in", "ncert.nic.in", "www.cbse.gov.in")


def norm(t):
    return " ".join((t or "").split())


seen, pages = set(), {}
queue = [(u, 0) for u in START]
while queue and len(pages) < 80:
    url, depth = queue.pop(0)
    if url in seen:
        continue
    seen.add(url)
    try:
        r = requests.get(url, headers=H, timeout=40, verify=False)
    except Exception as e:
        pages[url] = {"error": "%s: %s" % (type(e).__name__, str(e)[:120])}
        continue
    print(r.status_code, depth, url, file=sys.stderr, flush=True)
    if r.status_code != 200 or "html" not in r.headers.get("content-type", "html"):
        pages[url] = {"status": r.status_code}
        continue
    soup = BeautifulSoup(r.text, "html.parser")
    docs, subs = [], []
    for a in soup.find_all("a", href=True):
        href = urljoin(url, a["href"].strip()).split("#")[0]
        txt = norm(a.get_text(" "))
        if DOC.search(href):
            docs.append([txt, href])
        elif urlparse(href).netloc in ALLOWED and (KEY.search(txt) or KEY.search(href)):
            subs.append([txt, href])
    pages[url] = {"title": norm(soup.title.get_text()) if soup.title else "", "docs": len(docs), "doc_sample": docs[:6], "subs": subs[:60]}
    if depth < 2:
        for _, h in subs:
            if h not in seen and not DOC.search(h):
                queue.append((h, depth + 1))
OUT.write_text(json.dumps(pages, indent=1, ensure_ascii=False))
