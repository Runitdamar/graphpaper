#!/usr/bin/env python3
"""Build qbank.json (question banks, practice questions, competency items, NCERT Exemplar) from scripts/qbank_raw.json."""
import json
import re
from collections import OrderedDict
from pathlib import Path

HERE = Path(__file__).resolve().parent
raw = json.load(open(HERE / "qbank_raw.json"))
B_CBSE = "https://cbseacademic.nic.in/web_material/QuestionBank/"
B_APQ = "https://cbseacademic.nic.in/web_material/SQP/"
B_ITEM = "https://cbseacademic.nic.in/cbe/documents/"
B_EX = "https://ncert.nic.in/pdf/publication/exemplarproblem/"
ROMAN = {"VI": "6", "VII": "7", "VIII": "8", "IX": "9", "X": "10", "XI": "11", "XII": "12"}


def rel(h, base):
    assert h.startswith(base), h
    return h[len(base):]


def mb(size):
    return round(int(size) / 1048576, 1) if size else None


out = {"base": {"cbse": B_CBSE, "apq": B_APQ, "items": B_ITEM, "ex": B_EX}}

# 1. CBSE question bank
out["cbse"] = {}
for key, cls in (("qb10", "10"), ("qb12", "12")):
    rows = []
    for x in raw[key]["links"]:
        if x["ok"]:
            rows.append([x["row"][2].replace("Mathemathics", "Mathematics"), rel(x["href"], B_CBSE), mb(x["size"])])
    out["cbse"][cls] = rows

# 2. Additional practice questions, by class, year, subject
apq = {"10": OrderedDict(), "12": OrderedDict()}
for x in raw["apq"]["links"]:
    if not x["ok"]:
        continue
    m = re.search(r"Class(XII|X)_(\d{4})_(\d{2})/(.+)$", x["href"])
    cls, y1, y2, fn = ROMAN[m.group(1)], m.group(2), m.group(3), m.group(4)
    year = "%s-%s" % (y1, y2)
    subj = x["row"][0]
    if "2021" == y1:
        label = "Term 2" if re.search(r"_T2\.pdf$", fn) else ("Term 1" if x["text"] == "Term 1" else "Practice questions")
    else:
        kind = "Marking scheme" if "PQMS" in fn else "Questions"
        sset = "Set 2" if re.search(r"(PQ|PQMS)2\.pdf$", fn) else "Set 1"
        label = kind if y1 == "2022" else "%s \u00b7 %s" % (sset, kind)
    apq[cls].setdefault(year, OrderedDict()).setdefault(subj, []).append([label, rel(x["href"], B_APQ)])
out["apq"] = {c: {y: [[s, l] for s, l in d.items()] for y, d in sorted(ys.items(), reverse=True)} for c, ys in apq.items()}

# 3. Competency-based test items and item bank, Class 6 to 10
items = {}
for x in raw["assess"]["links"]:
    m = re.match(r"(Item Bank - )?(Maths|Science|English) Class (\d+)$", x["text"])
    if not (m and x["ok"]):
        continue
    subj = {"Maths": "Mathematics"}.get(m.group(2), m.group(2))
    label = "Item bank" if m.group(1) else "Competency test items"
    items.setdefault(m.group(3), OrderedDict()).setdefault(subj, []).append([label, rel(x["href"], B_ITEM), mb(x["size"])])
out["items"] = {c: [[s, l] for s, l in sorted(d.items())] for c, d in sorted(items.items(), key=lambda t: int(t[0]))}

# 4. NCERT Exemplar problems, Class 6 to 12
ex = {}
for x in raw["exemplar"]["links"]:
    m = re.search(r"exemplarproblem/class(VI|VII|VIII|IX|X|XI|XII)/([^/]+)/([^/]+)$", x["href"])
    if not m or not x["ok"]:
        continue
    cls = ROMAN[m.group(1)]
    d = m.group(2)
    hi = "(hindi)" in d.lower()
    subj = d.lower().replace("(hindi)", "").strip().title()
    ex.setdefault(cls, OrderedDict()).setdefault(subj, {"en": [], "hi": []})["hi" if hi else "en"].append([x["text"].strip(), rel(x["href"], B_EX)])
out["ex"] = {c: [[s, v["en"], v["hi"]] for s, v in d.items()] for c, d in sorted(ex.items(), key=lambda t: int(t[0]))}

json.dump(out, open(HERE.parent / "qbank.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
n = lambda d: sum(len(v) for v in d.values())
print("cbse", {c: len(v) for c, v in out["cbse"].items()})
print("apq", {c: {y: len(s) for y, s in ys.items()} for c, ys in out["apq"].items()})
print("items", {c: len(v) for c, v in out["items"].items()})
print("ex", {c: [(s, len(e), len(h)) for s, e, h in v] for c, v in out["ex"].items()})
