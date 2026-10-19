#!/usr/bin/env python3
"""One-off: find which NCERT textbooks of Class 12 really exist by testing PDF file names.

NCERT file names look like  <class letter><medium><subject, 2 letters><part digit><chapter, 2 digits>.pdf
(class letters a..j = classes 1..10; medium e = English, h = Hindi). We test every combination,
keep only URLs that return a real PDF, then read each chapter's first page text to get its title.
Result: scripts/class12_discovery.json
"""
import io
import itertools
import json
import string
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from pypdf import PdfReader

OUT = Path(__file__).resolve().parent / "class12_discovery.json"
BASE = "https://ncert.nic.in/textbook/pdf/"
H = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
     "Referer": "https://ncert.nic.in/textbook.php"}
CLASSES = {"l": 12}
START = time.time()
BUDGET = 25 * 60
sess = requests.Session()
sess.headers.update(H)


def is_pdf(name, want_body=False):
    url = BASE + name + ".pdf"
    for attempt in range(2):
        try:
            r = sess.get(url, timeout=(6, 25), stream=True)
            ok = r.status_code == 200
            head = next(r.iter_content(8), b"") if ok else b""
            body = None
            if ok and head[:4] == b"%PDF" and want_body:
                body = head + r.raw.read()
            r.close()
            if ok and head[:4] == b"%PDF":
                return True, body
            return False, None
        except requests.RequestException:
            time.sleep(1 + attempt)
    return False, None


def first_page(body):
    try:
        rd = PdfReader(io.BytesIO(body))
        return " ".join((rd.pages[0].extract_text() or "").split())[:200], len(rd.pages)
    except Exception as e:
        return "(unreadable: %s)" % type(e).__name__, None


def stage_a():
    combos = ["%s%s%s%s" % (c, m, a, b) for c in CLASSES for m in "ehu" for a in string.ascii_lowercase for b in string.ascii_lowercase]
    found = []
    def work(prefix):
        if time.time() - START > BUDGET * 0.55:
            return None
        for part in "1":
            ok, _ = is_pdf(prefix + part + "01")
            if ok:
                return prefix
        return None
    with ThreadPoolExecutor(24) as ex:
        for res in ex.map(work, combos):
            if res:
                found.append(res)
                print("FOUND", res, file=sys.stderr, flush=True)
    return found


def stage_b(prefixes):
    books = {}
    def one(prefix):
        out = {}
        for part in "1234":
            code = prefix + part
            ok, _ = is_pdf(code + "01")
            if not ok:
                if part == "1":
                    continue
                break
            chs, miss = [], 0
            for n in range(0, 40):
                if time.time() - START > BUDGET:
                    break
                name = "%s%02d" % (code, n)
                ok, body = is_pdf(name, True)
                if ok:
                    miss = 0
                    head, pages = first_page(body)
                    chs.append({"file": name, "pages": pages, "head": head})
                else:
                    if n == 0:
                        continue
                    miss += 1
                    if miss >= 2:
                        break
            front = None
            ok, body = is_pdf(code + "ps", True)
            if ok:
                front = first_page(body)[0]
            extras = {}
            for suf in ("an", "a1", "a2", "a3", "lp", "ap", "gl", "ps", "dd"):
                for ext, magic in ((".pdf", b"%PDF"), (".zip", b"PK")):
                    if suf == "dd" and ext == ".pdf":
                        continue
                    if suf != "dd" and ext == ".zip":
                        continue
                    try:
                        r = sess.get(BASE + code + suf + ext, timeout=(6, 40), stream=True)
                        head = next(r.iter_content(4), b"") if r.status_code == 200 else b""
                        size = r.headers.get("Content-Length")
                        r.close()
                        if head[:len(magic)] == magic:
                            extras[suf] = int(size) if size else 0
                    except requests.RequestException:
                        pass
            out[code] = {"front": front, "chapters": chs, "extras": extras}
        return prefix, out
    with ThreadPoolExecutor(6) as ex:
        for prefix, out in ex.map(one, prefixes):
            books.update(out)
            print("BOOK", prefix, list(out), file=sys.stderr, flush=True)
            OUT.write_text(json.dumps({"partial": True, "books": books}, ensure_ascii=False), encoding="utf-8")
    return books


def main():
    found = stage_a()
    OUT.write_text(json.dumps({"partial": True, "prefixes": found, "books": {}}, ensure_ascii=False), encoding="utf-8")
    books = stage_b(found)
    OUT.write_text(json.dumps({"partial": False, "prefixes": found, "books": books, "seconds": int(time.time() - START)}, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
