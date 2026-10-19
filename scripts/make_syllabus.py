#!/usr/bin/env python3
"""Turn scripts/curriculum_links.json (scraped from CBSE's curriculum page) into syllabus.json for the site.

Layout of the CBSE page, in order: Class IX, Class X, then Classes XI-XII. Each part starts with an
"Introduction to Secondary Curriculum" link, then groups of subjects. Links that did not open
(the two broken ones on CBSE's own page) are left out.
"""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
links = json.loads((root / "curriculum_links.json").read_text(encoding="utf-8"))["links"]

parts = {"IX": None, "X": None, "XI-XII": None}
order = ["IX", "X", "XI-XII"]
cur = -1
last = None
for l in links:
    text, href, heads = l["text"], l["href"], l["heads"]
    if text.startswith("Introduction to Secondary Curriculum"):
        cur += 1
        parts[order[cur]] = {"intro": href, "groups": []}
        continue
    if cur < 0 or not l["ok"]:
        continue
    h0 = heads[0]
    if text == "Reading Material" and last:
        text = last + " · reading material"
    else:
        last = text
    if h0.startswith("Languages"):
        g = "Languages"
    elif h0.startswith("Main Subjects"):
        g = "Main subjects"
    elif h0.startswith("Optional Subjects") or h0.startswith("Other Academic Electives") or h0.startswith("Academic Electives"):
        g = "Other subjects" if order[cur] != "XI-XII" else "Academic subjects"
    elif h0.startswith("Subjects of Internal Assessment"):
        g = "Internal assessment subjects"
    else:
        raise SystemExit("unknown group: %r for %s" % (h0, text))
    groups = parts[order[cur]]["groups"]
    grp = next((x for x in groups if x["name"] == g), None)
    if not grp:
        grp = {"name": g, "items": []}
        groups.append(grp)
    grp["items"].append([re.sub(r"\s+", " ", text).strip().replace("Infomatics", "Informatics"), href])

for k, v in parts.items():
    print(k, [(g["name"], len(g["items"])) for g in v["groups"]])
(root.parent / "syllabus.json").write_text(json.dumps({"session": "2026-27", "source": "https://cbseacademic.nic.in/curriculum_2027.html", "parts": parts}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
