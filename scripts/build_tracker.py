#!/usr/bin/env python3
"""Work out the "Quick status check" cards for Class 10 and 12 from the site's own official data.

Nothing here is typed by hand: every status is decided from CBSE's own notices (updates.json, which the
scheduled "Check CBSE updates" job refreshes from cbse.gov.in), the CBSE sample-paper list (papers.json)
and the CBSE syllabus list (syllabus.json). build_site.py calls build() on every site build and embeds the
result in the page, so it is there on the first paint (no extra request).
"""
import datetime
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SESSION = re.compile(r"2027|2026\s*[-–]\s*(?:20)?27")
SKIP = re.compile(r"special|supplementary|west asia|private|compartment|improvement", re.I)


def _load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


def _find(notices, topic):
    hits = [x for x in notices if re.search(topic, x["title"], re.I) and SESSION.search(x["title"]) and not SKIP.search(x["title"])]
    hits.sort(key=lambda x: x["date"], reverse=True)
    return hits[0] if hits else None


def build():
    notices = [x for x in _load("updates.json") if x.get("status") == "approved" and not x.get("sample")]
    papers, syl = _load("papers.json"), _load("syllabus.json")
    today = datetime.date.today().isoformat()
    items = []

    def add(id_, classes, q, hit, yes, no, src_yes, src_no):
        items.append({"id": id_, "classes": classes, "q": q, "status": "yes" if hit else "no", "label": "Out" if hit else "Not out yet",
                      "detail": yes if hit else no, "src": src_yes if hit else src_no, "asof": today})

    ds = _find(notices, r"date\s*-?sheet")
    add("date-sheet", [10, 12], "Is the 2027 board exam date sheet out?", ds,
        "CBSE has published it: “%s” (%s)." % (ds["title"], ds["date"]) if ds else "",
        "There is no 2027 Class 10 or 12 date sheet in CBSE’s notices yet. Ignore date sheets forwarded on WhatsApp and wait for the official one.",
        {"t": "CBSE notice", "u": ds["url"]} if ds else None, {"t": "All date sheets on GraphPaper", "u": "#/updates?type=Date%20Sheet"})
    pr = _find(notices, r"practical")
    add("practicals", [12], "Are the 2027 practical exam dates announced?", pr,
        "CBSE has published it: “%s” (%s). Your school gives you your own date." % (pr["title"], pr["date"]) if pr else "",
        "There is no 2027 practical exam circular in CBSE’s notices yet. Your school gives you your date once it comes out.",
        {"t": "CBSE notice", "u": pr["url"]} if pr else None, {"t": "All circulars on GraphPaper", "u": "#/updates?type=Circular"})
    sqp = bool((papers.get("sqp") or {}).get("X") and (papers.get("sqp") or {}).get("XII"))
    add("sample-papers", [10, 12], "Are the %s sample papers out?" % papers.get("session", "2026-27"), sqp,
        "CBSE has published sample papers with marking schemes for Class 10 and 12. Open them on the Papers page.", "Not published yet.",
        {"t": "Papers page", "u": "#/papers"}, {"t": "Papers page", "u": "#/papers"})
    has_syl = bool(syl.get("parts"))
    add("syllabus", [10, 12], "Is the %s syllabus out?" % syl.get("session", "2026-27"), has_syl,
        "The official CBSE syllabus is on the Syllabus page, one PDF per subject.", "Not published yet.",
        {"t": "Syllabus page", "u": "#/syllabus"}, {"t": "Syllabus page", "u": "#/syllabus"})
    return {"checked": today, "items": items}


if __name__ == "__main__":
    print(json.dumps(build(), indent=1, ensure_ascii=False))
