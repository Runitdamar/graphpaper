#!/usr/bin/env python3
"""Turn scripts/ncert_discovery.json into books_1_10.json for the site.

Only English-medium books whose name could be confirmed are kept. Chapter titles are used
only when the PDF's first page gives a clean one; otherwise the row is just "Chapter N".
Every file listed here was confirmed as a real PDF by scripts/discover_ncert.py.
"""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent
disc = json.loads((root / "ncert_discovery.json").read_text(encoding="utf-8"))["books"]

# code prefix (class letter + medium + subject) -> (subject group, book name)
NAMES = {
 "aejm": ("Mathematics", "Joyful Mathematics"), "aemr": ("English", "English"),
 "bejm": ("Mathematics", "Joyful Mathematics"), "bemr": ("English", "English"),
 "cebu": ("Arts", "Arts"), "ceev": ("Environmental Studies", "The World Around Us"), "ceky": ("Physical Education", "Physical Education and Well-being"),
 "cemm": ("Mathematics", "Mathematics"), "cesa": ("English", "Santoor"),
 "deap": ("Environmental Studies", "Looking Around"), "debu": ("Arts", "Arts"), "deev": ("Environmental Studies", "The World Around Us"),
 "deky": ("Physical Education", "Physical Education and Well-being"), "demm": ("Mathematics", "Mathematics"), "desa": ("English", "Santoor"),
 "eeap": ("Environmental Studies", "Environmental Studies"), "eebu": ("Arts", "Arts"), "eeen": ("English", "Marigold"),
 "eeev": ("Environmental Studies", "The World Around Us"), "eeky": ("Physical Education", "Physical Education and Well-being"),
 "eemh": ("Mathematics", "Mathematics (older edition)"), "eemm": ("Mathematics", "Mathematics"), "eesa": ("English", "Santoor"),
 "fecu": ("Science", "Curiosity"), "fees": ("Social Science", "Exploring Society: India and Beyond"), "fegp": ("Mathematics", "Ganita Prakash"),
 "fekb": ("Vocational Education", "Kaushal Bodh"), "fekr": ("Arts", "Arts"), "feky": ("Physical Education", "Physical Education and Well-being"), "fepr": ("English", "Poorvi"),
 "geah": ("English", "An Alien Hand (supplementary reader)"), "gecu": ("Science", "Curiosity"), "gees": ("Social Science", "Exploring Society: India and Beyond"),
 "gegp": ("Mathematics", "Ganita Prakash"), "gehc": ("English", "Honeycomb"), "gekb": ("Vocational Education", "Kaushal Bodh"), "gekr": ("Arts", "Arts"),
 "geky": ("Physical Education", "Physical Education and Well-being"), "gepr": ("English", "Poorvi"), "gesc": ("Science", "Science (older edition)"),
 "gess": ("Social Science", "Social Science"),
 "hecu": ("Science", "Curiosity"), "hees": ("Social Science", "Exploring Society: India and Beyond"), "hegp": ("Mathematics", "Ganita Prakash"),
 "hehd": ("English", "English"), "heih": ("English", "It So Happened (supplementary reader)"), "hekb": ("Vocational Education", "Kaushal Bodh"), "hekr": ("Arts", "Arts"),
 "heky": ("Physical Education", "Physical Education and Well-being"), "hemh": ("Mathematics", "Mathematics (older edition)"), "hepr": ("English", "Poorvi"),
 "hesc": ("Science", "Science (older edition)"),
 "iebe": ("English", "Kaveri"), "iehp": ("Physical Education", "Khel Praveen"), "iekv": ("Skill Education", "Kaushal Vikas"), "iemh": ("Mathematics", "Ganita Manjari"),
 "iemr": ("Arts", "Madhurima"), "iesc": ("Science", "Science"), "iest": ("Social Science", "Understanding Society"),
 "jeff": ("English", "First Flight"), "jefp": ("English", "Footprints without Feet"), "jehp": ("Physical Education", "Health and Physical Education"),
 "jemh": ("Mathematics", "Mathematics"), "jesc": ("Science", "Science"),
}
# Social science books whose own front page names them
SS_NAMES = {"jess1": "Geography: Contemporary India II", "jess2": "Economics: Understanding Economic Development",
            "jess3": "History: India and the Contemporary World II", "jess4": "Political Science: Democratic Politics II"}
CLS = dict(zip("abcdefghij", range(1, 11)))


def title_from(head, n):
    t = " ".join(head.split())
    m = re.match(r"^([A-Za-z][A-Za-z ,:;'’&\-\.]{3,80}?)\s*(\d{1,2})\s*C?HAPTER\b", t, re.I)
    if not m:
        m = re.match(r"^([A-Z][A-Z ,:'’&\-]{3,60}?)\s+(\d{1,2})\s", t)
    if not m or int(m.group(2)) != n:
        return None
    x = m.group(1).strip(" .:-")
    half = len(x) // 2
    if len(x) % 2 == 0 and x[:half] == x[half:]:
        x = x[:half]
    elif len(x) > 8 and x[: len(x) // 2].strip() == x[len(x) // 2:].strip():
        x = x[: len(x) // 2].strip()
    if not x.isascii() or len(x) < 4 or re.search(r"indd|prelim|\d", x, re.I):
        return None
    return x.title() if x.isupper() else x


books = []
for code, b in sorted(disc.items()):
    pre = code[:4]
    if code[1] != "e" or not b["chapters"]:
        continue
    if pre == "jess":
        sub, name = "Social Science", SS_NAMES.get(code)
        if not name:
            continue
    elif pre in NAMES:
        sub, name = NAMES[pre]
    else:
        continue
    part = code[4]
    multi = len([c for c in disc if c[:4] == pre and disc[c]["chapters"]]) > 1 and pre != "jess"
    if multi:
        name += " (Part %s)" % part if not name.endswith(")") or "edition" not in name else ""
    chs = []
    for c in b["chapters"]:
        idx = int(c["file"][len(code):])
        if idx < 1:
            continue
        chs.append([idx, title_from(c["head"], idx), idx])
    if chs:
        books.append({"cls": CLS[code[0]], "sub": sub, "title": name, "code": code, "label": "Chapter", "ch": chs})


# --- Class 10 refinement -------------------------------------------------------------------
# scripts/class10_refined.json (scripts/refine_class10.py) found chapter files the first pass missed
# (Political Science had 5, not 1). Titles below were checked against each chapter's first page.
C10_TITLES = {
 "jeff1": ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories about Flying", "From the Diary of Anne Frank", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "The Sermon at Benares", "The Proposal"],
 "jefp1": ["A Triumph of Surgery", "The Thief\u2019s Story", "The Midnight Visitor", "A Question of Trust", "Footprints without Feet", "The Making of a Scientist", "The Necklace", "Bholi", "The Book That Saved the Earth"],
 "jemh1": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"],
 "jesc1": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity", "Light \u2013 Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Our Environment"],
 "jess1": ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"],
 "jess2": ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"],
 "jess3": ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World"],
 "jess4": ["Power-sharing", "Federalism", "Gender, Religion and Caste", "Political Parties", "Outcomes of Democracy"],
}
refined_path = root / "class10_refined.json"
refined = json.loads(refined_path.read_text(encoding="utf-8")) if refined_path.exists() else {}
for b in books:
    if b["cls"] != 10:
        continue
    have = {c[0] for c in b["ch"]}
    for c in refined.get(b["code"], []):
        idx = int(c["file"][len(b["code"]):])
        if idx not in have:
            b["ch"].append([idx, None, idx])
    b["ch"].sort(key=lambda c: c[0])
    names = C10_TITLES.get(b["code"])
    if names and len(names) == len(b["ch"]):
        for c in b["ch"]:
            c[1] = names[c[0] - 1]
# -------------------------------------------------------------------------------------------

books.sort(key=lambda b: (b["cls"], b["sub"], b["code"]))
(root.parent / "books_1_10.json").write_text(json.dumps(books, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(books), "books,", sum(len(b["ch"]) for b in books), "chapters,", sum(1 for b in books for c in b["ch"] if c[1]), "with titles")
