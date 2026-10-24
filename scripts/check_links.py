#!/usr/bin/env python3
"""Check that every official link GraphPaper shows still opens.

Collects the links from the data files (NCERT chapter PDFs, ZIPs and extras, CBSE syllabus, papers,
question bank and notices), asks each one for its first bytes, and writes a report to
link_report.json and, on GitHub, to the run summary. It changes no data files.
Run by the "Check links" workflow (weekly, or by hand): python scripts/check_links.py
"""
import concurrent.futures as cf
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BBASE = "https://ncert.nic.in/textbook/pdf/"
UA = {"User-Agent": "Mozilla/5.0 (compatible; GraphPaperLinkCheck/1.0)", "Range": "bytes=0-1023"}


def load(n):
    return json.load(open(os.path.join(ROOT, n), encoding="utf-8"))


def collect():
    urls = {}
    for f in ("books_1_8.json", "books_1_10.json", "books_9.json", "books_11.json", "books_12.json"):
        for b in load(f):
            for ch in b.get("ch", []):
                fl = ch[2]
                if fl:
                    urls[BBASE + (fl if isinstance(fl, str) else b["code"] + ("0" if fl < 10 else "") + str(fl) + ".pdf")] = "%s %s" % (b["title"], ch[0])
            if b.get("zip"):
                urls[BBASE + b["zip"]] = b["title"] + " (ZIP)"
            for x in b.get("extra", []):
                urls[BBASE + x[1]] = b["title"] + " " + x[0]
    for f in ("papers.json", "qbank.json", "syllabus.json", "updates.json"):
        txt = open(os.path.join(ROOT, f), encoding="utf-8").read()
        for u in re.findall(r"https?://[^\"\s\\]+", txt):
            urls.setdefault(u, f)
    return urls


def probe(u):
    last = ""
    for attempt in range(3):
        try:
            req = urllib.request.Request(u, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                head = r.read(8)
                return {"url": u, "status": r.status, "type": r.headers.get("Content-Type", ""), "len": r.headers.get("Content-Length", ""),
                        "pdf_ok": head.startswith(b"%PDF"), "zip_ok": head.startswith(b"PK")}
        except urllib.error.HTTPError as e:
            last = "HTTP %d" % e.code
            if e.code in (404, 410):
                break
        except Exception as e:  # network trouble: retry
            last = type(e).__name__
        time.sleep(2 + attempt * 3)
    return {"url": u, "status": 0, "error": last}


def main():
    urls = collect()
    print("checking", len(urls), "links")
    with cf.ThreadPoolExecutor(6) as ex:
        res = list(ex.map(probe, urls))
    bad = []
    for r in res:
        r["what"] = urls[r["url"]]
        u = r["url"].lower().split("?")[0]
        ok = r.get("status") in (200, 206)
        if ok and u.endswith(".pdf") and not r.get("pdf_ok"):
            ok = False; r["error"] = "not a PDF (%s)" % r.get("type")
        if ok and u.endswith(".zip") and not r.get("zip_ok"):
            ok = False; r["error"] = "not a ZIP (%s)" % r.get("type")
        r["ok"] = ok
        if not ok:
            bad.append(r)
    json.dump({"total": len(res), "failed": len(bad), "failures": bad}, open(os.path.join(ROOT, "link_report.json"), "w"), indent=1)
    lines = ["## Link check: %d links, %d problem(s)" % (len(res), len(bad))] + ["- %s | %s | %s" % (b["what"], b.get("error") or b.get("status"), b["url"]) for b in bad[:200]]
    print("\n".join(lines))
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        open(os.environ["GITHUB_STEP_SUMMARY"], "a").write("\n".join(lines) + "\n")
    sys.exit(0)


if __name__ == "__main__":
    main()
