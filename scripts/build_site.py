#!/usr/bin/env python3
"""Build GraphPaper's real, crawlable pages.

The site is a small single-page app (app.js + app.css + scripts/shell.html).
This script opens every public URL in a headless browser, saves the finished
HTML as a static file at that URL, and writes sitemap.xml and robots.txt.

Adding a new page = add it to routes() below (or add data it is built from,
such as a notice in updates.json or a book in books_*.json). Run:

    python scripts/build_site.py

Everything it writes is generated; do not edit it by hand:
    index.html, 404.html, sitemap.xml, robots.txt and the folders
    class-*/, notice/, board/, updates/, about/, contact/, privacy/, terms/, welcome/
"""
import http.server
import json
import mimetypes
import os
import shutil
import socketserver
import sys
import threading
from datetime import date
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://graphpaper-peach.vercel.app"
SHELL = os.path.join(ROOT, "scripts", "shell.html")
STREAMS = ["science", "commerce", "humanities"]
GENERATED_DIRS = ["notice", "board", "updates", "about", "contact", "privacy", "terms", "welcome", "calculator"]


def shell_html():
    """The app shell with the status-check data (scripts/build_tracker.py) embedded, so it is there on the first paint."""
    sys.path.insert(0, os.path.join(ROOT, "scripts"))
    from build_tracker import build
    blob = json.dumps(build(), ensure_ascii=False).replace("</", "<\\/")
    html = open(SHELL, encoding="utf-8").read()
    return html.replace('<script src="/app.js" defer></script>', '<script type="application/json" id="trk">' + blob + '</script>\n<script src="/app.js" defer></script>').encode("utf-8")


def load(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return json.load(f)


def slug(t):
    import re
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


def subject_slugs():
    """Class 9-12 subject pages: one per NCERT subject folder (not 'Other books')."""
    out = {c: [] for c in (9, 10, 11, 12)}
    for f in ("books_1_10.json", "books_9.json", "books_11.json", "books_12.json"):
        for b in load(f):
            c = b.get("cls")
            fold = b.get("fold") or b.get("sub")
            if c in out and fold and fold != "Other books" and slug(fold) not in out[c]:
                out[c].append(slug(fold))
    return out


def routes():
    """Every public URL: (path, lastmod or None)."""
    out = [("/", None), ("/updates", None), ("/about", None), ("/contact", None),
           ("/privacy", None), ("/terms", None), ("/parents", None), ("/welcome", None), ("/calculator", None),
           ("/board/CBSE", None), ("/board/ICSE", None), ("/board/State%20boards", None)]
    notices = [x for x in load("updates.json") if x.get("status") == "approved" and not x.get("sample")]
    for x in sorted(notices, key=lambda n: n["date"], reverse=True):
        out.append(("/notice/" + x["id"], x["date"]))
    for c in range(1, 13):
        bases = ["/class-%d" % c] if c < 11 else ["/class-%d/%s" % (c, s) for s in STREAMS]
        for b in bases:
            out.append((b, None))
            out.append((b + "/books", None))
            out.append((b + "/book-list", None))
            if c >= 9:
                out.append((b + "/syllabus", None))
            if c in (10, 12):
                out.append((b + "/papers", None))
            if c >= 6:
                out.append((b + "/question-bank", None))
    for c, subs in subject_slugs().items():
        for sl in subs:
            out.append(("/class-%d/%s" % (c, sl), None))
    return out


class Handler(http.server.SimpleHTTPRequestHandler):
    """Static files by extension; every other path gets the app shell."""

    def log_message(self, *a):
        pass

    def do_GET(self):
        p = unquote(urlparse(self.path).path)
        ext = os.path.splitext(p)[1].lower()
        if ext and ext != ".html":
            f = os.path.join(ROOT, p.lstrip("/"))
        else:
            f = SHELL
        if not os.path.isfile(f):
            self.send_response(404); self.end_headers(); return
        data = shell_html() if f == SHELL else open(f, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", mimetypes.guess_type(f)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def out_file(path):
    if path == "/":
        return os.path.join(ROOT, "index.html")
    return os.path.join(ROOT, unquote(path).strip("/"), "index.html")


def main():
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(("127.0.0.1", 0), Handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % port

    for d in GENERATED_DIRS:
        shutil.rmtree(os.path.join(ROOT, d), ignore_errors=True)
    for name in os.listdir(ROOT):
        if name.startswith("class-") and os.path.isdir(os.path.join(ROOT, name)):
            shutil.rmtree(os.path.join(ROOT, name))

    pages, sitemap, problems = routes(), [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox"])
        for path, lastmod in pages + [("/__missing__", None)]:
            ctx = browser.new_context(viewport={"width": 390, "height": 800})
            ctx.route("**/*", lambda route: route.continue_() if route.request.url.startswith(base) else route.abort())
            page = ctx.new_page()
            errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            page.goto(base + path, wait_until="domcontentloaded")
            page.wait_for_function("window.GP_READY === true", timeout=30000)
            page.wait_for_timeout(150)
            html = "<!doctype html>\n" + page.evaluate("document.documentElement.outerHTML")
            robots = page.evaluate("(document.querySelector('meta[name=robots]')||{}).content || ''")
            canon = page.evaluate("document.querySelector('link[rel=canonical]').href")
            view = page.evaluate("document.querySelector('#view').innerText.length")
            ctx.close()
            if errs:
                problems.append((path, errs[0]))
            if path == "/__missing__":
                with open(os.path.join(ROOT, "404.html"), "w", encoding="utf-8") as f:
                    f.write(html)
                continue
            if view < 40:
                problems.append((path, "page looks empty"))
            dest = out_file(path)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8") as f:
                f.write(html)
            if "noindex" not in robots:
                sitemap.append((canon, lastmod))
        browser.close()
    srv.shutdown()

    rows = []
    for url, lm in sitemap:
        rows.append("  <url><loc>%s</loc>%s</url>" % (url, "<lastmod>%s</lastmod>" % lm if lm else ""))
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                + "\n".join(rows) + "\n</urlset>\n")
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE)

    print("built %d pages, %d in sitemap, built on %s" % (len(pages), len(sitemap), date.today()))
    for pth, e in problems:
        print("PROBLEM", pth, e)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
