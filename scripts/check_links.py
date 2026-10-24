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
    P = load("papers.json")
    for cls, sq in P["sqp"].items():
        for it in sq["items"]:
            for fl in it[1:3]:
                if isinstance(fl, str):
                    urls[sq["base"] + fl] = "Sample paper %s %s" % (cls, it[0])
    for cls, years in P["pyq"].items():
        for yr, kinds in years.items():
            for kind, slot in kinds.items():
                for it in slot["items"]:
                    urls[slot["base"] + it[1]] = "Previous year %s %s %s %s" % (cls, yr, kind, it[0])
    Q = load("qbank.json")
    B = Q["base"]
    for cls, rows in Q["cbse"].items():
        for it in rows:
            urls[B["cbse"] + it[1]] = "Question bank %s %s" % (cls, it[0])
    def files(node):
        if isinstance(node, str):
            yield node
        elif isinstance(node, list):
            for x in node:
                yield from files(x)
        elif isinstance(node, dict):
            for x in node.values():
                yield from files(x)
    for key, base in (("apq", B["apq"]), ("items", B["items"]), ("ex", B["ex"])):
        for cls, tree in Q[key].items():
            for fl in files(tree):
                if re.search(r"\.(pdf|zip)$", fl, re.I):
                    urls[base + fl] = "Question bank %s %s" % (key, cls)
    def strings(o):
        if isinstance(o, str):
            yield o
        elif isinstance(o, list):
            for x in o:
                yield from strings(x)
        elif isinstance(o, dict):
            for x in o.values():
                yield from strings(x)
    for f in ("syllabus.json", "updates.json"):
        data = load(f)
        if f == "updates.json":
            data = [x for x in data if x.get("status") == "approved"]  # only what the site shows
        for u in strings(data):
            if u.startswith("http"):
                urls.setdefault(u, f)
    return urls


def probe(u):
    import urllib.parse
    u0, u = u, urllib.parse.quote(u, safe=":/?&=%#+,;@~!$'()*[]")
    last = ""
    for attempt in range(3):
        try:
            req = urllib.request.Request(u, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                head = r.read(8)
                return {"url": u0, "status": r.status, "type": r.headers.get("Content-Type", ""), "len": r.headers.get("Content-Length", ""),
                        "pdf_ok": head.startswith(b"%PDF"), "zip_ok": head.startswith(b"PK")}
        except urllib.error.HTTPError as e:
            last = "HTTP %d" % e.code
            if e.code in (404, 410):
                break
        except Exception as e:  # network trouble: retry
            last = type(e).__name__
        time.sleep(2 + attempt * 3)
    return {"url": u0, "status": 0, "error": last}


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
