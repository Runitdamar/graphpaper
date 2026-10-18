#!/usr/bin/env python3
"""Check CBSE pages for new circulars and add them to updates.json as "pending".

UNTESTED against the live site: CBSE's page layout may differ from what this
expects. If a run finds nothing or fails, check the Actions log and adjust
SOURCES / the parsing in extract_items().

Rules this script follows:
- It only ever ADDS new items, always with status "pending".
- It never edits or removes items you already approved (or any existing item).
- Nothing shows on the site until you change "pending" to "approved".
"""
import hashlib
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "updates.json"

# Pages to check. Add or fix URLs here if CBSE moves them.
SOURCES = [
    "https://www.cbse.gov.in/cbsenew/circulars.html",
    "https://www.cbse.gov.in/cbsenew/examination.html",
]

HEADERS = {"User-Agent": "Mozilla/5.0 (Graphpaper update checker; +https://github.com/Runitdamar/graphpaper)"}

# Keyword -> tag. First match wins; order matters.
TAG_RULES = [
    ("Date Sheet", ["date sheet", "datesheet", "date-sheet", "exam schedule"]),
    ("Result", ["result", "declared", "merit list", "scorecard"]),
    ("Syllabus Change", ["syllabus", "curriculum", "marking scheme", "sample paper", "question paper design"]),
]
DEFAULT_TAG = "Circular"

# Only keep items that look relevant to Class 11/12. Set to [] to keep everything.
RELEVANT_WORDS = ["xi", "xii", "11", "12", "senior secondary", "secondary", "board", "science", "practical", "exam"]

DATE_PATTERNS = [
    (r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b", "dmy"),
    (r"\b(\d{4})-(\d{2})-(\d{2})\b", "ymd"),
    (r"\b(\d{1,2})\s+([A-Za-z]{3,9})\.?,?\s+(\d{4})\b", "dMy"),
]


def parse_date(text):
    for pat, kind in DATE_PATTERNS:
        m = re.search(pat, text)
        if not m:
            continue
        try:
            if kind == "dmy":
                return date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
            if kind == "ymd":
                return date(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
            if kind == "dMy":
                return datetime.strptime(f"{m.group(1)} {m.group(2)[:3]} {m.group(3)}", "%d %b %Y").date().isoformat()
        except ValueError:
            continue
    return None


def classify(title):
    low = title.lower()
    for tag, words in TAG_RULES:
        if any(w in low for w in words):
            return tag
    return DEFAULT_TAG


def is_relevant(title):
    if not RELEVANT_WORDS:
        return True
    low = title.lower()
    return any(w in low for w in RELEVANT_WORDS)


def extract_items(html, base_url):
    """Find links that look like circulars/notices and pair each with a nearby date."""
    soup = BeautifulSoup(html, "html.parser")
    found = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        title = " ".join(a.get_text(" ", strip=True).split())
        if len(title) < 12:
            continue
        if not (href.lower().endswith(".pdf") or "circular" in href.lower() or "notice" in href.lower()):
            continue
        row = a.find_parent(["tr", "li", "div"])
        context = row.get_text(" ", strip=True) if row else title
        d = parse_date(context) or parse_date(href)
        if not d:
            continue  # no trustworthy date: skip rather than guess
        found.append({"title": title, "date": d, "url": urljoin(base_url, href)})
    return found


def item_id(url):
    return "cbse-" + hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]


def main():
    try:
        existing = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if not isinstance(existing, list):
            raise ValueError("updates.json must be a list")
    except FileNotFoundError:
        existing = []
    known_ids = {x.get("id") for x in existing}
    known_urls = {x.get("url") for x in existing}

    added = []
    errors = 0
    for src in SOURCES:
        try:
            r = requests.get(src, headers=HEADERS, timeout=30)
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"FAILED to fetch {src}: {e}", file=sys.stderr)
            errors += 1
            continue
        items = extract_items(r.text, src)
        print(f"{src}: {len(items)} candidate links")
        for it in items:
            iid = item_id(it["url"])
            if iid in known_ids or it["url"] in known_urls or not is_relevant(it["title"]):
                continue
            known_ids.add(iid)
            added.append({
                "id": iid,
                "tag": classify(it["title"]),
                "title": it["title"],
                "date": it["date"],
                "summary": "",
                "url": it["url"],
                "status": "pending",
            })

    if added:
        existing.extend(added)
        DATA_FILE.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Added {len(added)} new pending item(s).")
    if errors == len(SOURCES):
        sys.exit(1)  # every source failed: make the run show as failed


if __name__ == "__main__":
    main()
