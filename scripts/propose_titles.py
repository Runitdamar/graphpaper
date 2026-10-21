#!/usr/bin/env python3
"""Turn scripts/titles_class<N>.json (big-font lines of each chapter's first page) into proposed chapter titles
for review. usage: python scripts/propose_titles.py <class number> [book codes]"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent
NUM = int(sys.argv[1])
only = sys.argv[2].split(",") if len(sys.argv) > 2 else None
data = json.loads((root / ("titles_class%d.json" % NUM)).read_text(encoding="utf-8"))
SKIP = re.compile(r"^(\d+|chapter|contents|unit\s*\d+|unit|reprint.*|[A-Z](\s[A-Z]){2,}|part\s*\w+|\d+\s*[-–]\s*\d+)$", re.I)


def clean(t):
    return re.sub(r"\s+", " ", t).strip()


def propose(x):
    lines = x.get("big") or x.get("big2") or []
    keep = [(s, clean(t)) for s, t in lines if clean(t) and not SKIP.match(clean(t))]
    if not keep:
        return "", ""
    m = max(s for s, _ in keep)
    top = [t for s, t in keep if s >= m - 0.5]
    rest = [t for s, t in keep if s < m - 0.5]
    return " ".join(top), (rest[0] if rest else "")


if __name__ == "__main__":
    for code, chs in data.items():
        if only and code not in only:
            continue
        print("##", code, len(chs))
        for i, x in enumerate(chs, 1):
            p, ctx = propose(x)
            print(" %2d  %s%s" % (i, p, ("   [" + ctx[:40] + "]") if ctx else ""))
