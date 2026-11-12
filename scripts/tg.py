"""Shared bits for the two Telegram posters (post_telegram.py and post_daily.py): sending a post with tap buttons,
and the class label that the site shows on a notice ("Class 10 and 12")."""
import json, re, urllib.parse, urllib.request

SITE = "https://graphpaper.co.in"
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8, "IX": 9, "X": 10, "XI": 11, "XII": 12}


def safe(url):
    """A space in CBSE's file names would cut a link short, so spaces and the like are written out."""
    return urllib.parse.quote(url, safe=":/?&=%#~-._+,;@!$'()*")


def share_button(url, text):
    return {"text": "Share with a friend", "url": "https://t.me/share/url?url=%s&text=%s" % (urllib.parse.quote(url, safe=""), urllib.parse.quote(text, safe=""))}


def send(token, chat, text, buttons=None):
    """buttons: a list of rows, each row a list of {"text", "url"}. Link previews stay off so a post is one tidy card."""
    data = {"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "true"}
    if buttons:
        data["reply_markup"] = json.dumps({"inline_keyboard": buttons})
    req = urllib.request.Request("https://api.telegram.org/bot%s/sendMessage" % token, data=urllib.parse.urlencode(data).encode())
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r).get("ok", False)


def notice_classes(title):
    """The same rule as noticeClasses() in src/app.js, so a post says what the site says."""
    out = set()
    for m in re.finditer(r"\bclass(?:es)?\s*[-:]?\s*((?:(?:XII|XI|X|IX|VIII|VII|VI|IV|V|III|II|I|\d{1,2})(?:th)?\b[\s,&/\-]*(?:and|to|&)?\s*)+)", title, re.I):
        parts = re.findall(r"XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I|\d{1,2}", m.group(1), re.I)
        nums = [n for n in (ROMAN.get(p.upper()) or int(p) for p in parts) if 1 <= n <= 12]
        if re.search(r"\bto\b|–|-", m.group(1), re.I) and len(nums) == 2 and nums[0] < nums[1]:
            out.update(range(nums[0], nums[1] + 1))
        else:
            out.update(nums)
    for m in re.finditer(r"\b(XII|XI)\b", title):
        out.add(ROMAN[m.group(1)])
    for m in re.finditer(r"\b(1[0-2]|[1-9])\s*(?:th|st|nd|rd)\b", title, re.I):
        out.add(int(m.group(1)))
    return sorted(out)


def class_label(title):
    c = notice_classes(title)
    if not c:
        return ""
    return "Class %d" % c[0] if len(c) == 1 else "Class %s and %d" % (", ".join(str(n) for n in c[:-1]), c[-1])
