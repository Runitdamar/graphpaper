"""Posts one study resource a run to the GraphPaper Telegram channel (sample paper, previous-year paper,
NCERT book, syllabus or a tool), taken from the site's own data files, so it never runs out and never
needs writing by hand. The workflow runs it twice a day (8:00 and 20:00 India time).

daily.json remembers where each rotation has got to, so the same item is not posted again until the whole
list has been used. Needs the secrets TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID; without them it does nothing.
DRY_RUN=1 prints the next posts instead of sending them (DRY_COUNT=n prints n).
"""
import datetime, html, json, os, random, sys

import tg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://graphpaper.co.in"
BBASE = "https://ncert.nic.in/textbook/pdf/"
ORDER = ["sample", "ncert", "pyq", "syllabus", "sample", "pyq", "ncert", "tool"]   # a tool post every 8th run
COMMERCE = ("Accountancy", "Business Studies", "Economics", "Entrepreneurship", "Applied Maths")
HUMAN = ("History", "Political Science", "Geography", "Sociology", "Psychology", "Philosophy", "Legal Studies", "Fine Arts")


def load(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return json.load(f)


def stream_of(subject):
    s = subject.lower()
    if any(k.lower() in s for k in COMMERCE): return "commerce"
    if any(k.lower() in s for k in HUMAN): return "humanities"
    return "science"


CORE = ("english", "hindi", "math", "science", "social", "physics", "chemistry", "biology", "accountancy", "business", "economics",
        "history", "political", "geography", "computer", "informatics", "psychology", "sociology", "physical education", "artificial", "sanskrit")


def clean(name):
    """Skips scraped junk and keeps to the subjects most students look for (the full list is on the site)."""
    n = name.lower()
    return "<" not in name and ">" not in name and "Download" not in name and any(k in n for k in CORE)


def a(url, label):
    """A tap button under the post."""
    return {"text": label, "url": tg.safe(url)}


def sample_items():
    p = load("papers.json")
    out = []
    for roman, num in (("X", 10), ("XII", 12)):
        part = p["sqp"][roman]
        for name, sqp, ms in part["items"]:
            if not clean(name): continue
            page = "%s/class-%d%s/sample-papers" % (SITE, num, "/" + stream_of(name) if num == 12 else "")
            out.append(("Class %d %s: CBSE sample paper %s" % (num, name, p["session"]),
                        [a(part["base"] + sqp, "Sample paper (official PDF)"), a(part["base"] + ms, "Marking scheme (official PDF)"), a(page, "All sample papers on GraphPaper")]))
    return out


def pyq_items():
    p = load("papers.json")["pyq"]
    out = []
    for roman, num in (("X", 10), ("XII", 12)):
        for year in ("2026", "2025", "2024", "2023"):
            sec = p[roman][year]["main"]
            for name, f, mb in sec["items"]:
                if not clean(name): continue
                page = "%s/class-%d%s/previous-year-papers" % (SITE, num, "/" + stream_of(name) if num == 12 else "")
                out.append(("Class %d %s: CBSE %s question paper" % (num, name, year),
                            [a(sec["base"] + f, "Question paper, %s (official file)" % year), a(page, "More previous-year papers on GraphPaper")]))
    return out


def ncert_items():
    out = []
    for f in ("books_9.json", "books_1_10.json", "books_11.json", "books_12.json"):
        for b in load(f):
            if not b.get("zip") or b.get("cls") not in (9, 10, 11, 12): continue
            n = b["cls"]
            page = "%s/class-%d%s" % (SITE, n, "/books" if n <= 10 else "")
            out.append(("Class %d %s (NCERT textbook, %d %s)" % (n, b["title"], len(b["ch"]), b["label"].lower() + ("" if len(b["ch"]) == 1 else "s")),
                        [a(BBASE + b["zip"], "Whole book ZIP (ncert.nic.in)"), a(page, "Chapter by chapter on GraphPaper")]))
    return out


def syllabus_items():
    parts = load("syllabus.json")["parts"]
    sess = load("syllabus.json")["session"]
    out = []
    for key, num in (("IX", 9), ("X", 10), ("XI-XII", 12)):
        for g in parts[key]["groups"]:
            for it in g["items"]:
                name, url = it[0], it[1]
                if not clean(name) or not str(url).startswith("http"): continue
                label = "Class 11 and 12" if num == 12 else "Class %d" % num
                page = "%s/class-%d%s/syllabus" % (SITE, num, "/" + stream_of(name) if num == 12 else "")
                out.append(("%s %s: CBSE syllabus %s" % (label, name, sess),
                            [a(url, "Syllabus (official PDF)"), a(page, "All subjects on GraphPaper")]))
    return out


def tool_items():
    return [("Worked out your percentage or CGPA?", [a(SITE + "/calculator", "Percentage and CGPA calculator"), "Add your marks, get the percentage, and see what you need in the next exam."]),
            ("Lost track of what you have finished?", [a(SITE + "/class-12/science/books", "Chapter tick-list on GraphPaper"), "Tick chapters off as you finish them. It is saved on your phone only."])]


KINDS = {"sample": sample_items, "pyq": pyq_items, "ncert": ncert_items, "syllabus": syllabus_items, "tool": tool_items}


ICONS = {"sample": "\U0001F4DD", "pyq": "\U0001F5C2\uFE0F", "ncert": "\U0001F4DA", "syllabus": "\U0001F4D8", "tool": "\U0001F9EE"}
HEADS = {"sample": "Sample paper", "pyq": "Previous-year paper", "ncert": "NCERT book", "syllabus": "Syllabus", "tool": "Tool"}


def build(kind, count):
    """Returns (text, buttons). Items are a title plus a list of buttons; a plain string in that list is a sentence under the title."""
    items = KINDS[kind]()
    random.Random(kind).shuffle(items)
    title, links = items[count % len(items)]
    lines = ["%s <b>%s</b>" % (ICONS[kind], html.escape(title)), "<i>%s</i>" % HEADS[kind]]
    for x in links:
        if isinstance(x, str):
            lines += ["", html.escape(x)]
    rows = [[x] for x in links if isinstance(x, dict)]
    mine = next((x["url"] for x in links if isinstance(x, dict) and x["url"].startswith(SITE)), SITE + "/")
    rows.append([tg.share_button(mine, title)])
    return "\n".join(lines), rows


def main():
    path = os.path.join(ROOT, "daily.json")
    try:
        st = load("daily.json")
    except (OSError, ValueError):
        st = {"n": 0, "c": {}}
    dry = os.environ.get("DRY_RUN") == "1"
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN", ""), os.environ.get("TELEGRAM_CHAT_ID", "")
    if not dry and not (token and chat):
        print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set: nothing posted.")
        return
    now = datetime.datetime.now(datetime.timezone.utc)
    if not dry and os.environ.get("FORCE") != "true" and st.get("last"):
        # the outside timer and GitHub's own schedule may both fire; only one post per 11 hours goes out (GitHub's schedule can run 6 to 7 hours late, so a shorter gap let late runs add extra posts)
        if (now - datetime.datetime.fromisoformat(st["last"])).total_seconds() < 11 * 3600:
            print("Posted less than 11 hours ago: skipping this run.")
            return
    for _ in range(int(os.environ.get("DRY_COUNT", "1")) if dry else 1):
        kind = ORDER[st["n"] % len(ORDER)]
        text, buttons = build(kind, st["c"].get(kind, 0))
        if dry:
            print(text, "\n", [[b["text"] for b in r] for r in buttons], "\n---")
        else:
            try:
                if not tg.send(token, chat, text, buttons):
                    print("Telegram refused the post.", file=sys.stderr); return
            except Exception as e:
                print("Could not post: %s" % e, file=sys.stderr); return
            print("Posted a %s item." % kind)
        st["n"] += 1
        st["c"][kind] = st["c"].get(kind, 0) + 1
    if not dry:
        st["last"] = now.isoformat()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(st, f, indent=0)


main()
