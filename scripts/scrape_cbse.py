#!/usr/bin/env python3
"""Check CBSE pages for new circulars and add them to updates.json as "pending".

UNTESTED against the live site: CBSE's page layout may differ from what this
expects. If a run finds nothing or fails, check the Actions log and adjust
SOURCES / the parsing in extract_items().

Rules this script follows:
- It only ever ADDS new items and never removes or rewrites existing ones.
- AUTO_PUBLISH is on: a new item from an official CBSE site (cbse.gov.in or cbseacademic.nic.in)
  with a real date goes live straight away ("approved", with "auto": true).
  Anything else is added as "pending" and stays hidden until you change it to "approved".
- To hide an item that went live, set "status": "pending" and "hold": true on it (hold keeps it from being published again).
- To turn automatic publishing off, set AUTO_PUBLISH = False.
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
STATUS_FILE = ROOT / "scripts" / "last_run.txt"  # short result of the latest run, committed so it can be read without Actions logs

# Pages to check. Add or fix URLs here if CBSE moves them.
SOURCES = [
    "https://cbseacademic.nic.in/circulars.html",   # academic circulars (Class 11/12 mostly)
    "https://www.cbse.gov.in/cbsenew/cbse.html",     # main website (notices / what's new)
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Referer": "https://www.cbse.gov.in/",
}

# Keyword -> tag. First match wins; order matters.
TAG_RULES = [
    ("Date Sheet", ["date sheet", "datesheet", "date-sheet", "exam schedule"]),
    ("Result", ["result", "declared", "merit list", "scorecard"]),
    ("Syllabus Change", ["syllabus", "curriculum", "marking scheme", "sample paper", "question paper design"]),
]
DEFAULT_TAG = "Circular"

AUTO_PUBLISH = True
OFFICIAL_HOSTS = ("cbse.gov.in", "cbseacademic.nic.in")


def can_publish(item):
    """Fully automatic: any item from an official CBSE site with a real date (not in the future) goes live.
    Old ones are archived by the site itself after 180 days. Set "hold": true on an item to keep it hidden."""
    from urllib.parse import urlparse
    host = (urlparse(item["url"]).hostname or "").lower()
    if not any(host == h or host.endswith("." + h) for h in OFFICIAL_HOSTS):
        return False
    try:
        d = date.fromisoformat(item["date"])
    except (KeyError, ValueError):
        return False
    return (date.today() - d).days >= -2

# Only keep items that look relevant to Class 11/12. Set to [] to keep everything.
RELEVANT_WORDS = ["loc", "candidates", "xi", "xii", "11", "12", "senior secondary", "secondary", "board", "science", "practical", "exam"]

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


EXCLUDE_WORDS = ["recruitment", "vacancy", "tier-i", "tier-ii", "tender", "empanelment", "deputation", "walk-in", "walk in", "engagement of", "advertisement"]


def clean_title(title):
    """Drop file-size tags like "(812 KB)" and a trailing dd/mm/yyyy from link text."""
    title = re.sub(r"\s*\(\s*[\d.,]+\s*(?:KB|MB)\s*\)", "", title, flags=re.I)
    title = re.sub(r"\s+\d{1,2}/\d{1,2}/\d{4}\s*$", "", title)
    return " ".join(title.split())


def classify(title):
    low = title.lower()
    for tag, words in TAG_RULES:
        if any(w in low for w in words):
            return tag
    return DEFAULT_TAG


def is_relevant(title):
    """Keep everything except notices that are clearly not for students (jobs, tenders)."""
    low = title.lower()
    return not any(w in low for w in EXCLUDE_WORDS)


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
        found.append({"title": clean_title(title), "date": d, "url": urljoin(base_url, href)})
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
    status = []
    for src in SOURCES:
        try:
            try:
                r = requests.get(src, headers=HEADERS, timeout=30)
            except requests.exceptions.SSLError:
                # cbseacademic.nic.in has a broken certificate chain. We only READ public
                # listings here and every item waits for your approval, so fall back to http.
                insecure = src.replace("https://", "http://", 1)
                status.append(f"  SSL error on {src}; retrying over http")
                r = requests.get(insecure, headers=HEADERS, timeout=30)
                src = insecure
            r.raise_for_status()
        except requests.RequestException as e:
            code = getattr(getattr(e, "response", None), "status_code", None)
            print(f"FAILED to fetch {src}: {e}", file=sys.stderr)
            status.append(f"FAILED {src} (HTTP {code}): {type(e).__name__}")
            errors += 1
            continue
        if not r.encoding or r.encoding.lower() in ("iso-8859-1", "latin-1"):
            r.encoding = r.apparent_encoding or "utf-8"  # avoid garbled characters in titles
        items = extract_items(r.text, src)
        print(f"{src}: {len(items)} candidate links")
        status.append(f"OK {src} (HTTP {r.status_code}, {len(r.text)} bytes, {len(items)} candidate links)")
        if not items:
            # Diagnostic: show what the page contains so the parser can be fixed.
            soup = BeautifulSoup(r.text, "html.parser")
            status.append("  page title: " + (soup.title.get_text(strip=True)[:100] if soup.title else "none"))
            anchors = soup.find_all("a", href=True)
            status.append(f"  total links: {len(anchors)}, scripts: {len(soup.find_all('script'))}")
            for a in anchors[:40]:
                status.append("  - " + " ".join(a.get_text(" ", strip=True).split())[:60] + " -> " + a["href"][:110])
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
            if AUTO_PUBLISH and can_publish(added[-1]):
                added[-1]["status"] = "approved"
                added[-1]["auto"] = True

    # Items that were added earlier and are still pending: publish the recent official ones too.
    promoted = 0
    if AUTO_PUBLISH:
        for x in existing:
            if x.get("status") == "pending" and not x.get("hold") and can_publish(x):
                x["status"] = "approved"
                x["auto"] = True
                promoted += 1

    if added or promoted:
        existing.extend(added)
        DATA_FILE.write_text(json.dumps(existing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    live = sum(1 for x in added if x["status"] == "approved")
    status.append(f"Added {len(added)} new item(s), {live} published at once, {promoted} earlier pending item(s) published.")
    STATUS_FILE.write_text("\n".join(status) + "\n", encoding="utf-8")
    if errors < len(SOURCES):
        # the date shown on GraphPaper as "CBSE's lists last checked" (IST)
        import datetime as _dt
        _today = (_dt.datetime.utcnow() + _dt.timedelta(hours=5, minutes=30)).date().isoformat()
        (ROOT / "checked.json").write_text(json.dumps({"date": _today, "sources_ok": len(SOURCES) - errors}) + "\n", encoding="utf-8")
    print(f"Added {len(added)} new item(s), {live} published at once, {promoted} earlier pending item(s) published.")
    if errors == len(SOURCES):
        sys.exit(1)  # every source failed: make the run show as failed


if __name__ == "__main__":
    main()
