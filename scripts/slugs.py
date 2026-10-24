"""Descriptive, stable URL slugs for notices (e.g. date-sheet-for-class-xii-special-examinations-for-west-asia-2026).

A slug is made once from the title and then never changes, so links keep working.
The old id-based URLs (/notice/cbse-3b89ed7093) are redirected to the slug URL by vercel.json,
which scripts/build_site.py regenerates.
"""
import re


def slugify(title, limit=80):
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    if len(s) > limit:
        s = s[:limit].rsplit("-", 1)[0]
    return s or "notice"


def assign(items):
    """Give every item without a slug one. Returns True if anything changed."""
    used = {x["slug"] for x in items if x.get("slug")}
    changed = False
    # oldest first so the first notice with a given title keeps the plain slug
    for x in sorted((i for i in items if not i.get("slug")), key=lambda i: (i.get("date", ""), i["id"])):
        base = slugify(x["title"])
        cand = base
        if cand in used:
            cand = base + "-" + x.get("date", "")
        if cand in used:
            cand = base + "-" + x["id"].split("-")[-1]
        x["slug"] = cand
        used.add(cand)
        changed = True
    return changed
