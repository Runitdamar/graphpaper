#!/usr/bin/env python3
"""Parse the contents page text of each book (contents_class<N>.json) into numbered chapter titles."""
import glob
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent
ITEM = re.compile(r"(?<![\w.])(\d{1,2})\s*[.:]\s+(?=\S)")


def parse(text):
    """Split 'a 1. Title 12 2. Title 20' into [(n, title)] with n counting up from 1."""
    ms = list(ITEM.finditer(text))
    out, want = [], 1
    for i, m in enumerate(ms):
        if int(m.group(1)) != want:
            continue
        nxt = None
        for m2 in ms[i + 1:]:
            if int(m2.group(1)) == want + 1:
                nxt = m2
                break
        end = nxt.start() if nxt else len(text)
        seg = text[m.end():end].strip()
        # drop the trailing page number
        seg = re.sub(r"\s+\d{1,3}\s*(CONTENTS.*)?$", "", seg).strip()
        out.append((want, seg))
        want += 1
    return out


def book_toc(entry):
    best = []
    for t in entry["text"]:
        p = parse(t)
        if len(p) > len(best):
            best = p
    return best


if __name__ == "__main__":
    for f in sorted(glob.glob(str(root / "contents_class[1-8].json"))):
        d = json.loads(Path(f).read_text(encoding="utf-8"))
        for code, e in d.items():
            toc = book_toc(e)
            print("##", code, len(toc))
            for n, t in toc:
                print("  %2d %s" % (n, t[:80]))
