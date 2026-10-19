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


# --- Class 10 ----------------------------------------------------------------------------
# Class 10 is built from scripts/class10_zips.json (the real file list inside each whole-book ZIP on
# ncert.nic.in) plus scripts/class10_extras.json (ZIP sizes). Chapter titles below were checked against
# each chapter's first page; Hindi/Sanskrit titles were matched to the PDFs' author names and page text.
zips = json.loads((root / "class10_zips.json").read_text(encoding="utf-8"))
extras = json.loads((root / "class10_extras.json").read_text(encoding="utf-8"))
zip_mb = {x["name"]: round(int(x["size"]) / 1048576) for x in extras["whole"] if x["type"] == "zip"}

# code -> (folder, subject, full title, short name shown inside a folder, chapter titles or None)
C10 = {
 "jeff1": ("English", "English", "First Flight", "First Flight", ["A Letter to God", "Nelson Mandela: Long Walk to Freedom", "Two Stories about Flying", "From the Diary of Anne Frank", "Glimpses of India", "Mijbil the Otter", "Madam Rides the Bus", "The Sermon at Benares", "The Proposal"]),
 "jefp1": ("English", "English", "Footprints without Feet", "Footprints without Feet", ["A Triumph of Surgery", "The Thief\u2019s Story", "The Midnight Visitor", "A Question of Trust", "Footprints without Feet", "The Making of a Scientist", "The Necklace", "Bholi", "The Book That Saved the Earth"]),
 "jhks1": ("Hindi", "Hindi", "Kshitij Part 2 (Hindi A)", "Hindi A \u00b7 Kshitij Part 2", ["सूरदास – पद", "तुलसीदास – राम-लक्ष्मण-परशुराम संवाद", "जयशंकर प्रसाद – आत्मकथ्य", "सूर्यकांत त्रिपाठी ‘निराला’ – उत्साह, अट नहीं रही है", "नागार्जुन – यह दंतुरित मुस्कान, फसल", "मंगलेश डबराल – संगतकार", "स्वयं प्रकाश – नेताजी का चश्मा", "रामवृक्ष बेनीपुरी – बालगोबिन भगत", "यशपाल – लखनवी अंदाज़", "मन्नू भंडारी – एक कहानी यह भी", "यतींद्र मिश्र – नौबतखाने में इबादत", "भदंत आनंद कौसल्यायन – संस्कृति"]),
 "jhkr1": ("Hindi", "Hindi", "Kritika Part 2 (Hindi A)", "Hindi A \u00b7 Kritika Part 2", ["माता का अँचल", "साना-साना हाथ जोड़ि…", "मैं क्यों लिखता हूँ?"]),
 "jhsp1": ("Hindi", "Hindi", "Sparsh Part 2 (Hindi B)", "Hindi B \u00b7 Sparsh Part 2", ["कबीर – साखी", "मीरा – पद", "मैथिलीशरण गुप्त – मनुष्यता", "सुमित्रानंदन पंत – पर्वत प्रदेश में पावस", "वीरेन डंगवाल – तोप", "कैफ़ी आज़मी – कर चले हम फ़िदा", "रवींद्रनाथ ठाकुर – आत्मत्राण", "प्रेमचंद – बड़े भाई साहब", "सीताराम सेकसरिया – डायरी का एक पन्ना", "तताँरा-वामीरो कथा", "प्रह्लाद अग्रवाल – तीसरी कसम के शिल्पकार शैलेंद्र", "निदा फ़ाज़ली – अब कहाँ दूसरे के दुख से दुखी होने वाले", "रवींद्र केलेकर – पतझर में टूटी पत्तियाँ", "हबीब तनवीर – कारतूस"]),
 "jhsy1": ("Hindi", "Hindi", "Sanchayan Part 2 (Hindi B)", "Hindi B \u00b7 Sanchayan Part 2", ["हरिहर काका", "सपनों के-से दिन", "टोपी शुक्ला"]),
 "jemh1": ("Mathematics", "Mathematics", "Mathematics", "Mathematics", ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Introduction to Trigonometry", "Some Applications of Trigonometry", "Circles", "Areas Related to Circles", "Surface Areas and Volumes", "Statistics", "Probability"]),
 "jesc1": ("Science", "Science", "Science", "Science", ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and its Compounds", "Life Processes", "Control and Coordination", "How do Organisms Reproduce?", "Heredity", "Light \u2013 Reflection and Refraction", "The Human Eye and the Colourful World", "Electricity", "Magnetic Effects of Electric Current", "Our Environment"]),
 "jess3": ("Social Science", "Social Science", "History: India and the Contemporary World II", "History", ["The Rise of Nationalism in Europe", "Nationalism in India", "The Making of a Global World", "The Age of Industrialisation", "Print Culture and the Modern World"]),
 "jess4": ("Social Science", "Social Science", "Political Science: Democratic Politics II", "Political Science", ["Power-sharing", "Federalism", "Gender, Religion and Caste", "Political Parties", "Outcomes of Democracy"]),
 "jess2": ("Social Science", "Social Science", "Economics: Understanding Economic Development", "Economics", ["Development", "Sectors of the Indian Economy", "Money and Credit", "Globalisation and the Indian Economy", "Consumer Rights"]),
 "jess1": ("Social Science", "Social Science", "Geography: Contemporary India II", "Geography", ["Resources and Development", "Forest and Wildlife Resources", "Water Resources", "Agriculture", "Minerals and Energy Resources", "Manufacturing Industries", "Lifelines of National Economy"]),
 "jehp1": ("Other books", "Physical Education", "Health and Physical Education", "Health and Physical Education", None),
 "jhsk1": ("Other books", "Sanskrit", "Shemushi Part 2 (Sanskrit)", "Sanskrit \u00b7 Shemushi Part 2", ["शुचिपर्यावरणम्", "बुद्धिर्बलवती सदा", "शिशुलालनम्", "जननी तुल्यवत्सला", "सुभाषितानि", "सौहार्दं प्रकृतेः शोभा", "विचित्रः साक्षी", "सूक्तयः", "भूकम्पविभीषिका", "अन्योक्तयः"]),
 "jhva1": ("Other books", "Sanskrit", "Vyakaranvithi (Sanskrit grammar)", "Sanskrit \u00b7 Vyakaranvithi", None),
}
# extra files beside the chapters: code -> {suffix: label}
C10_EXTRA = {
 "jemh1": {"a1": "Appendix A1: Proofs in Mathematics", "a2": "Appendix A2: Mathematical Modelling", "an": "Answers and hints"},
 "jesc1": {"an": "Answers"},
 "jess1": {"a1": "Appendix I: Websites you can visit"},
 "jhkr1": {"lp": "लेखक परिचय (author introductions)"},
 "jhsy1": {"lp": "लेखक परिचय (author introductions)"},
 "jhva1": {"a1": "Appendix 1: शब्दरूपाणि", "a2": "Appendix 2: धातुरूपाणि"},
}
# Urdu-subject books (Urdu-medium file names start with "ju"). Chapter names come from the PDFs' own
# document titles (scripts/class10_urdu_heads.json), cleaned up; chapters without a usable title stay "Chapter N".
urdu = json.loads((root / "class10_urdu.json").read_text(encoding="utf-8"))["books"]
urdu_heads = json.loads((root / "class10_urdu_heads.json").read_text(encoding="utf-8"))


def clean_meta(m):
    if not m or "..." in m or "\u2026" in m:
        return None
    t = re.sub(r"\.cdr$", "", m.strip(), flags=re.I)
    t = re.sub(r"^(CH|Ch)[ _\-]*\d*[ _\-]*", "", t)
    t = re.sub(r"^\d+\s*-\s*", "", t).strip(" _-")
    if t.startswith("(") and t.endswith(")") and t.count("(") == 1:
        t = t[1:-1].strip()
    if len(t) < 3 or t.lower().startswith("ch"):
        return None
    return t.title() if t.isupper() else t


URDU = {
 "june1": ("Nawa-e-Urdu", "Urdu \u00b7 Nawa-e-Urdu"),
 "juge1": ("Gulzar-e-Urdu (supplementary reader)", "Urdu \u00b7 Gulzar-e-Urdu"),
 "jujp1": ("Jaan Pahechan", "Urdu \u00b7 Jaan Pahechan"),
 "judp1": ("Door-Paas (supplementary reader)", "Urdu \u00b7 Door-Paas"),
 "jusr1": ("Sab Rang", "Urdu \u00b7 Sab Rang"),
 "juuq1": ("Urdu grammar and composition", "Urdu \u00b7 Grammar and composition"),
}
for code, (title, short) in URDU.items():
    rows = urdu_heads[code][1:]
    names = [clean_meta(r.get("meta")) for r in rows]
    C10[code] = ("Other books", "Urdu", title, short, names)
    zips[code] = {"files": [{"name": Path(z["name"]).name} for z in urdu[code]["zip"]]}
    for e in urdu[code]["extra"]:
        if e["name"].endswith("dd.zip"):
            zip_mb[e["name"]] = round(int(e["size"]) / 1048576)

books = [b for b in books if b["cls"] != 10]
for code, (fold, sub, title, short, names) in C10.items():
    files = {Path(f["name"]).name: f for f in zips[code]["files"]}
    chs = []
    for fn in sorted(files):
        m = re.match(r"^%s(\d\d)\.{1,2}pdf$" % code, fn)
        if m:
            n = int(m.group(1))
            chs.append([n, (names[n - 1] if names and n <= len(names) else None), fn if ".." in fn else n])
    extra = []
    for suf, label in C10_EXTRA.get(code, {}).items():
        if code + suf + ".pdf" in files:
            extra.append([label, code + suf + ".pdf"])
    if code + "ps.pdf" in files:
        extra.append(["Preface and contents", code + "ps.pdf"])
    if names and len(names) != len(chs):
        raise SystemExit("%s: %d titles but %d chapter files" % (code, len(names), len(chs)))
    books.append({"cls": 10, "sub": sub, "fold": fold, "title": title, "short": short, "code": code, "label": "Chapter",
                  "ch": chs, "zip": code + "dd.zip", "mb": zip_mb.get(code + "dd.zip"), "extra": extra})
# -------------------------------------------------------------------------------------------

books.sort(key=lambda b: (b["cls"], b["sub"], b["code"]))
(root.parent / "books_1_10.json").write_text(json.dumps(books, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(books), "books,", sum(len(b["ch"]) for b in books), "chapters,", sum(1 for b in books for c in b["ch"] if c[1]), "with titles")
