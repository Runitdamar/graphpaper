#!/usr/bin/env python3
"""Print the cleaned first-page text of every chapter of the given books (to read chapter titles from).
usage: python scripts/dump_heads.py <class> <code,code,...> [width]"""
import json, re, sys
from pathlib import Path
n, codes = int(sys.argv[1]), sys.argv[2].split(",")
w = int(sys.argv[3]) if len(sys.argv) > 3 else 90
d = json.loads((Path(__file__).parent / ("discovery_class%d.json" % n)).read_text(encoding="utf-8"))["books"]
for c in codes:
    print("##", c, len(d[c]["chapters"]), "chapters")
    for i, ch in enumerate(d[c]["chapters"], 1):
        h = re.sub(r"Reprint 20\d\d-\d\d|[\w ]*\.indd \d+|\d{1,2}[-/]\w{2,3}[-/]\d{2,4}.*?(AM|PM)", " ", ch["head"])
        h = re.sub(r"\s+", " ", h).strip()
        print("%2d  p%-3s %s" % (i, ch["pages"], h[:w]))
