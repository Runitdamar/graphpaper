"""Posts new CBSE notices to the GraphPaper Telegram channel.

Runs after the site has been rebuilt (see .github/workflows/telegram.yml), so every notice already has
its page on graphpaper.co.in. posted.json remembers which notices went out. The first run only records
the notices that already exist (nothing is posted), so the channel is never flooded with old items.

Needs two repository secrets: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (for example @graphpaper_updates).
Without them the script does nothing. Use DRY_RUN=1 to print the messages instead of sending them.
"""
import datetime, html, json, os, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://graphpaper.co.in"
MAX_PER_RUN = 5          # a burst bigger than this is spread over the next runs
MAX_AGE_DAYS = 7         # never post a notice older than this


def load(name, default):
    try:
        with open(os.path.join(ROOT, name), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def message(n):
    try:
        d = datetime.date.fromisoformat(n["date"]).strftime("%d %b %Y").lstrip("0")
    except (KeyError, ValueError):
        d = ""
    page = "%s/notice/%s" % (SITE, n.get("slug") or n["id"])
    lines = ["<b>%s</b>" % html.escape(n.get("tag") or "CBSE notice"), html.escape(n["title"])]
    if d:
        lines.append("Published " + d)
    lines += ["", '<a href="%s">Open on GraphPaper</a>' % html.escape(page, quote=True)]
    if n.get("url"):
        lines.append('<a href="%s">Official notice (PDF)</a>' % html.escape(n["url"], quote=True))
    return "\n".join(lines)


def send(token, chat, text):
    data = urllib.parse.urlencode({"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "true"}).encode()
    req = urllib.request.Request("https://api.telegram.org/bot%s/sendMessage" % token, data=data)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r).get("ok", False)


def main():
    items = [n for n in load("updates.json", []) if n.get("status") == "approved" and not n.get("hold")]
    path = os.path.join(ROOT, "posted.json")
    posted = load("posted.json", None)
    if posted is None:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(sorted(n["id"] for n in items), f, indent=0)
        print("First run: recorded %d existing notices, posted nothing." % len(items))
        return
    token, chat = os.environ.get("TELEGRAM_BOT_TOKEN", ""), os.environ.get("TELEGRAM_CHAT_ID", "")
    dry = os.environ.get("DRY_RUN") == "1"
    if not dry and not (token and chat):
        print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set: nothing posted.")
        return
    today = datetime.date.today()
    seen = set(posted)
    new = []
    for n in sorted(items, key=lambda i: (i.get("date", ""), i["id"])):
        if n["id"] in seen:
            continue
        try:
            age = (today - datetime.date.fromisoformat(n["date"])).days
        except (KeyError, ValueError):
            age = 0
        if age > MAX_AGE_DAYS:
            seen.add(n["id"])        # too old to announce, but remember it
            continue
        new.append(n)
    for n in new[:MAX_PER_RUN]:
        text = message(n)
        if dry:
            print(text, "\n---")
            continue
        try:
            if send(token, chat, text):
                seen.add(n["id"])
                print("Posted:", n["title"])
        except Exception as e:                       # leave it unposted; the next run retries
            print("Could not post %s: %s" % (n["id"], e), file=sys.stderr)
    if not dry:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(sorted(seen), f, indent=0)


main()
