#!/usr/bin/env python3
"""Turn scripts/papers_raw.json into papers.json for the Papers page.

sqp: sample question papers and marking schemes for 2026-27 (Class X and XII), one row per subject.
pyq: previous years' board question papers from cbse.gov.in (Class X and XII, main exam and compartment / second board),
     grouped by year. Links that did not open are left out. Everything is a link to CBSE's own files.
"""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
raw = json.loads((root / "papers_raw.json").read_text(encoding="utf-8"))
KEEP_UPPER = {"NCC", "IT", "AI", "ICT", "TV", "ICT", "BPO", "LIC"}
SMALL = {"and", "of", "in", "for", "the", "to"}


def nice(s):
    s = re.sub(r"\s+", " ", s.replace("_", " ")).strip()
    if s.isupper() or s.islower():
        words = []
        for i, w in enumerate(s.split(" ")):
            if w.upper() in KEEP_UPPER:
                words.append(w.upper())
            elif w.lower() in SMALL and i:
                words.append(w.lower())
            else:
                words.append(w.capitalize())
        s = " ".join(words)
    return s


out = {"session": "2026-27", "sqp": {}, "pyq": {}}

# ---- sample papers
for key, cls in (("sqp_x", "X"), ("sqp_xii", "XII")):
    rows = {}
    base = None
    order = []
    for l in raw[key]["links"]:
        fn = l["href"].rsplit("/", 1)[1]
        if not l["ok"] or fn.lower() == "error.pdf":
            continue
        b = l["href"].rsplit("/", 1)[0] + "/"
        base = base or b
        if b != base:
            raise SystemExit("mixed folders in %s: %s vs %s" % (key, b, base))
        subj = l["row"][0]
        kind = "ms" if l["text"].strip().upper() == "MS" else "sqp"
        if subj not in rows:
            rows[subj] = {}
            order.append(subj)
        rows[subj][kind] = fn
    out["sqp"][cls] = {"base": base, "items": [[nice(s), rows[s].get("sqp", ""), rows[s].get("ms", "")] for s in order]}

# ---- previous years
for l in raw["pyq"]["links"]:
    if not l["ok"]:
        continue
    m = re.match(r"https://www\.cbse\.gov\.in/cbsenew/question-paper/(\d{4})(-COMPTT)?/(XII|X|Second_Board_X)/(.+)$", l["href"])
    if not m:
        raise SystemExit("unexpected url " + l["href"])
    year, comp, cls, fn = m.group(1), bool(m.group(2)), m.group(3), m.group(4)
    cls = "X" if cls.endswith("X") and cls != "XII" else "XII"
    kind = "comp" if comp else "main"
    base = l["href"][: -len(fn)]
    mb = round(int(l["size"]) / 1048576, 1) if l.get("size") else None
    slot = out["pyq"].setdefault(cls, {}).setdefault(year, {}).setdefault(kind, {"base": base, "items": []})
    slot["items"].append([nice(l["row"][0]), fn, mb])

for cls in out["pyq"]:
    for year in out["pyq"][cls]:
        for kind in out["pyq"][cls][year]:
            out["pyq"][cls][year][kind]["items"].sort(key=lambda x: x[0].lower())
for cls, d in out["sqp"].items():
    print("SQP", cls, len(d["items"]), "subjects")
for cls in sorted(out["pyq"]):
    for year in sorted(out["pyq"][cls], reverse=True):
        print("PYQ", cls, year, {k: len(v["items"]) for k, v in out["pyq"][cls][year].items()})
(root.parent / "papers.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
