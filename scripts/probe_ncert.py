#!/usr/bin/env python3
"""One-off: check which NCERT chapter PDFs exist, so the Books page only links to real files.

For each book code it tries chapter files 01, 02, ... and records which ones are real PDFs,
plus the opening text of each (used to read the chapter title). Result: scripts/ncert_probe.json
"""
import io
import json
import sys
from pathlib import Path

import requests
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent / "ncert_probe.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Referer": "https://ncert.nic.in/textbook.php",
}
# Class XI = k..., Class XII = l...  (ph physics, ch chemistry, mh maths, bo biology)
CODES = ["keph1", "keph2", "kech1", "kech2", "kemh1", "kebo1",
         "leph1", "leph2", "lech1", "lech2", "lemh1", "lemh2", "lebo1"]


def get(url):
    r = requests.get(url, headers=HEADERS, timeout=40)
    return r


def main():
    result = {}
    blocked = 0
    for code in CODES:
        chapters, misses = [], 0
        for n in range(1, 21):
            url = f"{BASE}{code}{n:02d}.pdf"
            try:
                r = get(url)
            except requests.RequestException as e:
                print(f"ERR  {url} {type(e).__name__}", file=sys.stderr)
                misses += 1
                if misses >= 2:
                    break
                continue
            if r.status_code == 403:
                blocked += 1
            if r.status_code == 200 and r.content[:4] == b"%PDF":
                misses = 0
                try:
                    reader = PdfReader(io.BytesIO(r.content))
                    head = " ".join((reader.pages[0].extract_text() or "").split())[:220]
                    pages = len(reader.pages)
                except Exception as e:
                    head, pages = f"(unreadable: {type(e).__name__})", None
                chapters.append({"n": n, "url": url, "kb": len(r.content) // 1024, "pages": pages, "head": head})
                print(f"ok   {code}{n:02d} {len(r.content)//1024} KB")
            else:
                misses += 1
                print(f"miss {code}{n:02d} HTTP {r.status_code}")
                if misses >= 2:
                    break
        result[code] = chapters
    result["_blocked_403"] = blocked
    OUT.write_text(json.dumps(result, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
