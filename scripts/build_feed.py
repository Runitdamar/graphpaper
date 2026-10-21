"""Build feed.xml (Atom) from the approved notices in updates.json."""
import json
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

SITE = "https://graphpaper-peach.vercel.app"
root = Path(__file__).resolve().parent.parent
items = [x for x in json.loads((root / "updates.json").read_text(encoding="utf-8"))
         if x.get("status") == "approved" and not x.get("sample")]
items.sort(key=lambda x: x["date"], reverse=True)
items = items[:50]

def ts(d):
    return d + "T00:00:00Z"

out = ['<?xml version="1.0" encoding="utf-8"?>',
       '<feed xmlns="http://www.w3.org/2005/Atom">',
       '<title>GraphPaper: CBSE notices</title>',
       '<subtitle>Official CBSE circulars, date sheets, syllabus changes and results.</subtitle>',
       '<link href="%s/feed.xml" rel="self"/>' % SITE,
       '<link href="%s/"/>' % SITE,
       '<id>%s/</id>' % SITE,
       '<updated>%s</updated>' % ts(items[0]["date"] if items else "1970-01-01")]
for x in items:
    link = "%s/notice/%s" % (SITE, quote(x["id"]))
    out += ['<entry>',
            '<title>%s</title>' % escape(x["title"]),
            '<link href="%s"/>' % escape(link),
            '<id>%s</id>' % escape(link),
            '<updated>%s</updated>' % ts(x["date"]),
            '<category term="%s"/>' % escape(x.get("tag", "")),
            '<summary>%s</summary>' % escape((x.get("summary") or "Official CBSE notice: " + x["title"])),
            '</entry>']
out.append('</feed>')
(root / "feed.xml").write_text("\n".join(out) + "\n", encoding="utf-8")
print("feed.xml written with %d entries" % len(items))
