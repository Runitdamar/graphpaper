"""Makes the share-preview cards in og/ (1200 x 630, shown when a page is shared on WhatsApp, Telegram, X and so on).
One card per class theme plus a neutral default. Run by hand when the wording or colours change:
    python3 scripts/make_og.py
The cards are normal files in og/ and are not rebuilt by the site build."""
import os
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS = {
    "9":  ("Class 9", "NCERT books, syllabus and official CBSE links in one calm place", "#F2F0E0", "#2E4A36", "#C9D3BC"),
    "10": ("Class 10", "Board-exam hub: notices, sample papers, previous-year papers, books", "#EBF3F5", "#15506C", "#C7DBE2"),
    "11": ("Class 11", "Science, Commerce and Humanities: books, syllabus and papers", "#F8EFE6", "#6E2A25", "#E8D3C2"),
    "12": ("Class 12", "Board-exam hub for every stream: notices, papers, books and syllabus", "#EEF3F8", "#3A5775", "#CBD9E8"),
    "default": ("GraphPaper", "CBSE notices, NCERT books and syllabus for Classes 1 to 12", "#F4F1E8", "#2E4A36", "#D8D3C0"),
}


def page(key, head, line, paper, deep, grid):
    if key == "default":
        logo = '<img src="file://%s/logo.png" width="300" height="300" style="border-radius:60px">' % ROOT
    else:
        logo = open(os.path.join(ROOT, "scripts", "og-logos", "logo-%s-sym.svg" % key), encoding="utf-8").read().replace('viewBox="0 0 120 120"', 'viewBox="0 0 120 120" width="340" height="340"', 1)
    title = "GraphPaper" if key == "default" else head
    sub = line if key == "default" else "GraphPaper · " + line
    return f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:YS;src:url(file://{ROOT}/fonts/young-serif.woff)}}
html,body{{margin:0}}body{{width:1200px;height:630px;background:{paper};color:{deep};position:relative;overflow:hidden;font-family:system-ui,sans-serif;
background-image:linear-gradient({grid} 2px,transparent 2px),linear-gradient(90deg,{grid} 2px,transparent 2px);background-size:60px 60px;background-position:30px 30px}}
.t{{position:absolute;left:80px;top:150px;width:640px}}h1{{font:400 104px/1.05 YS,serif;margin:0 0 28px}}p{{font:500 34px/1.35 system-ui,sans-serif;margin:0;opacity:.85}}
.l{{position:absolute;right:90px;top:145px}}.u{{position:absolute;left:80px;bottom:52px;font:600 28px system-ui;opacity:.7}}</style>
<div class="t"><h1>{title}</h1><p>{sub}</p></div><div class="l">{logo}</div><div class="u">graphpaper.co.in</div>"""


with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox", "--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    os.makedirs(os.path.join(ROOT, "og"), exist_ok=True)
    for key, (head, line, paper, deep, grid) in CARDS.items():
        html = os.path.join(ROOT, "og", "_%s.html" % key)
        open(html, "w", encoding="utf-8").write(page(key, head, line, paper, deep, grid))
        pg.goto("file://" + html)
        pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(ROOT, "og", "og-%s.png" % key))
        os.remove(html)
    b.close()
