#!/usr/bin/env python3
"""Build books_1_8.json: the Class 1 to 8 NCERT books (English-medium books plus the Hindi and Sanskrit language
books) in the same folder layout as Classes 9 to 12.

Inputs
  discovery_class<N>.json      which books exist, their chapter files, whole-book zip size, preface file
  titles_class<N>[_tag].json   the biggest-font lines of each chapter's first page (see titles_cls.py)
  class1_8_titles.json         hand-checked chapter titles that replace the automatic ones: {code: [title or null, ...]}
  books_names_1_8.json         the English-medium book names (from the earlier data)
"""
import glob
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from propose_titles import propose  # noqa: E402
from toc_parse import book_toc  # noqa: E402

root = Path(__file__).resolve().parent

# Hindi, Sanskrit and Hindi-supplementary books: code -> (folder, title, short)
LANG = {
    "ahsr1": ("Hindi", "सारंगी (Hindi)", "सारंगी · Hindi"),
    "bhsr1": ("Hindi", "सारंगी (Hindi)", "सारंगी · Hindi"),
    "chve1": ("Hindi", "वीणा (Hindi)", "वीणा · Hindi"),
    "dhve1": ("Hindi", "वीणा (Hindi)", "वीणा · Hindi"),
    "ehve1": ("Hindi", "वीणा (Hindi)", "वीणा · Hindi"),
    "fhml1": ("Hindi", "मल्हार (Hindi)", "मल्हार · Hindi"),
    "ghml1": ("Hindi", "मल्हार (Hindi)", "मल्हार · Hindi"),
    "ghvs1": ("Hindi", "वसंत भाग 2 (Hindi, older edition)", "वसंत 2 · Hindi"),
    "ghdv1": ("Hindi", "दूर्वा भाग 2 (Hindi, second language)", "दूर्वा 2 · Hindi"),
    "ghmb1": ("Hindi", "महाभारत कथा, संक्षिप्त रूप (Hindi, supplementary)", "महाभारत कथा · Hindi"),
    "ghsk1": ("Sanskrit", "रुचिरा भाग 2 (Sanskrit)", "रुचिरा 2 · Sanskrit"),
    "hhml1": ("Hindi", "मल्हार (Hindi)", "मल्हार · Hindi"),
    "hhvs1": ("Hindi", "वसंत भाग 3 (Hindi, older edition)", "वसंत 3 · Hindi"),
    "hhdv1": ("Hindi", "दूर्वा भाग 3 (Hindi, second language)", "दूर्वा 3 · Hindi"),
    "hhbk1": ("Hindi", "भारत की खोज (Hindi, supplementary)", "भारत की खोज · Hindi"),
    "hhsb1": ("Hindi", "संक्षिप्त बुद्धचरित (Hindi, supplementary)", "बुद्धचरित · Hindi"),
    "hhsk1": ("Sanskrit", "रुचिरा भाग 3 (Sanskrit)", "रुचिरा 3 · Sanskrit"),
}
SHORT = {"Physical Education and Well-being": "Physical Education", "Exploring Society: India and Beyond": "Exploring Society",
         "Exploring Society: India and Beyond (Part 1)": "Exploring Society Part 1", "Exploring Society: India and Beyond (Part 2)": "Exploring Society Part 2",
         "An Alien Hand (supplementary reader)": "An Alien Hand", "It So Happened (supplementary reader)": "It So Happened"}

old = {(b["cls"], b["code"]): b for b in json.loads((root / "books_names_1_8.json").read_text(encoding="utf-8"))}
manual = json.loads((root / "class1_8_titles.json").read_text(encoding="utf-8")) if (root / "class1_8_titles.json").exists() else {}


GENERIC = re.compile(r"^(about the unit|introduction|before you read|notes? for the teacher|let us (do|discuss|read|sing)|picture reading|"
                     r"सुनें कहानी|मिलकर पढ़िए|आनंद\w*\s*कविता|एकांकी|\(संवाद\)|general)$", re.I)


SMALL = {"a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "with", "from"}


def nice_case(t):
    """ALL-CAPS headings to Title Case (leaves mixed-case text alone)."""
    letters = [c for c in t if c.isalpha()]
    if len(letters) < 4 or not all(c.isupper() for c in letters if c.isascii()) or not any(c.isascii() for c in letters):
        return t
    words = t.lower().split(" ")
    out = []
    for i, w in enumerate(words):
        out.append(w if (i and w in SMALL) else re.sub(r"(^|[-–(\u2018\u2019'])([a-z])", lambda m: m.group(1) + m.group(2).upper(), w, count=1) if w else w)
    return " ".join(out)


def auto_title(x):
    p, _ctx = propose(x)
    p = re.sub(r"^(chapter\s*\d+|unit[\s-]*\d+|act\s*\d+\s*scene\s*\d+\s*[—-])\s*[.:)—-]?\s*", "", p, flags=re.I).strip()
    p = re.sub(r"^\d+\s*[.:)]?\s*", "", p).strip()
    p = re.sub(r"^let us (read|sing)\s+", "", p, flags=re.I).strip()
    p = nice_case(p.strip(" —–-"))
    if not p or not all(ord(c) < 0x250 or 0x900 <= ord(c) <= 0x97F or 0x2000 <= ord(c) <= 0x206F for c in p) or "\x9d" in p or len(p) > 70 or len(p.split()) > 12 or p.count(".") > 1 or GENERIC.match(p) or len(p) < 3:
        return None
    return p


PEOPLE = re.compile(r"professor|director|chancellor|chairperson|member,|head,|editor|coordinator|illustrat|acknowledg|\bIAS\b|\bNCERT\b", re.I)


def toc_titles(entry, n):
    """Chapter titles read from the book's contents page, when they number exactly n and look like titles."""
    if not entry:
        return None
    toc = [t for _, t in book_toc(entry)]
    out = []
    for t in toc:
        t = re.split(r"\s*(?:\.{2,}|…{1,}|\u2026)\s*", t)[0]
        t = re.sub(r"\s+\d{1,3}\b.*$", "", t).strip(" .:-–—")
        out.append(t)
    if len(out) != n or any(not t or len(t) > 70 or PEOPLE.search(t) for t in out):
        return None
    return out


contents = {}
for f in sorted(glob.glob(str(root / "contents_class[1-8].json"))):
    contents.update(json.loads(Path(f).read_text(encoding="utf-8")))

out, review = [], []
for n in range(1, 9):
    disc = json.loads((root / ("discovery_class%d.json" % n)).read_text(encoding="utf-8"))["books"]
    titles = {}
    for f in sorted(glob.glob(str(root / ("titles_class%d*.json" % n)))):
        titles.update(json.loads(Path(f).read_text(encoding="utf-8")))
    codes = [c for c in disc if (n, c) in old] + [c for c in LANG if c in disc]
    for code in codes:
        d = disc[code]
        if code in LANG:
            fold, title, short = LANG[code]
            sub = fold
        else:
            o = old[(n, code)]
            sub, title = o["sub"], o["title"]
            fold, short = sub, SHORT.get(title, title)
        label = "Chapter"
        got = titles.get(code)
        if got:
            ts = [auto_title(x) for x in got]
        else:
            ts = [None] * len(d["chapters"])
        tt = None if code in LANG or code == "aejm1" else toc_titles(contents.get(code), len(d["chapters"]))
        if tt:
            if "--cmp" in sys.argv:
                for i, (a, b) in enumerate(zip(ts, tt), 1):
                    if a != b:
                        print("CMP %s %2d  auto=%r  toc=%r" % (code, i, a, b))
            ts = [nice_case(t) for t in tt]
        m = manual.get(code)
        if isinstance(m, list):
            ts = m
        elif isinstance(m, dict):
            for k, v in m.items():
                ts[int(k) - 1] = v
        assert len(ts) == len(d["chapters"]), (code, len(ts), len(d["chapters"]))
        chs = [[i + 1, t, i + 1] for i, t in enumerate(ts)]
        if True:
            review.append((code, sum(1 for t in ts if t is None), len(ts)))
        ex = d.get("extras") or {}
        extra = [["Preface and contents", code + "ps.pdf"]] if "ps" in ex else []
        book = {"cls": n, "sub": sub, "fold": fold, "title": title, "short": short, "code": code, "label": label, "ch": chs, "extra": extra}
        if ex.get("dd"):
            book["zip"] = code + "dd.zip"
            book["mb"] = round(ex["dd"] / 1048576, 1)
        out.append(book)

(root.parent / "books_1_8.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
if "--show" in sys.argv:
    for b in out:
        print("##", b["code"], b["title"])
        for n, t, _ in b["ch"]:
            print("  %2d  %s" % (n, t))
print(len(out), "books,", sum(len(b["ch"]) for b in out), "chapters,", sum(1 for b in out if b.get("zip")), "with zip")
for code, miss, tot in review:
    if miss:
        print("  untitled in %s: %d of %d" % (code, miss, tot))
