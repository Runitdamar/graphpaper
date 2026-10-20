#!/usr/bin/env python3
"""Build books_12.json: the Class 12 NCERT books (English medium plus the Hindi and Sanskrit language books)
in the same folder layout as Class 10. Reads class12_discovery.json (what exists), class12_inline.json (titles of the
seven science books that were already on the site) and the hand-checked titles below."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
disc = json.loads((root / "class12_discovery.json").read_text(encoding="utf-8"))["books"]
inline = {b["code"]: b for b in json.loads((root / "class12_inline.json").read_text(encoding="utf-8"))}
hindi = json.loads((root / "class12_hindi_titles.json").read_text(encoding="utf-8")) if (root / "class12_hindi_titles.json").exists() else {}


def seq(titles, files=None):
    files = files or list(range(1, len(titles) + 1))
    return [[i + 1, t, f] for i, (t, f) in enumerate(zip(titles, files))]


# code -> (folder, subject label, full title, short title, chapter list or None to reuse the inline one)
BOOKS = [
    ("leph1", "Physics", "Physics", "Physics Part I", "Part I", None),
    ("leph2", "Physics", "Physics", "Physics Part II", "Part II", None),
    ("lech1", "Chemistry", "Chemistry", "Chemistry Part I", "Part I", None),
    ("lech2", "Chemistry", "Chemistry", "Chemistry Part II", "Part II", None),
    ("lemh1", "Mathematics", "Mathematics", "Mathematics Part I", "Part I", None),
    ("lemh2", "Mathematics", "Mathematics", "Mathematics Part II", "Part II", None),
    ("lebo1", "Biology", "Biology", "Biology", "Biology", None),
    ("lefl1", "English", "English", "Flamingo (English Core)", "Flamingo · Core", seq(
        ["The Last Lesson", "Lost Spring: Stories of Stolen Childhood", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes",
         "The Interview", "Going Places", "Poems: My Mother at Sixty-six", "Poems: Keeping Quiet", "Poems: A Thing of Beauty",
         "Poems: A Roadside Stand", "Poems: Aunt Jennifer's Tigers"], [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15])),
    ("levt1", "English", "English", "Vistas (English Core, supplementary reader)", "Vistas · Core", seq(
        ["The Third Level", "The Tiger King", "Journey to the End of the Earth", "The Enemy", "On the Face of It", "Memories of Childhood"])),
    ("lekl1", "English", "English", "Kaleidoscope (English Elective)", "Kaleidoscope · Elective", seq(
        ["I Sell My Dreams", "Eveline", "A Wedding in Brownsville", "Tomorrow", "One Centimetre", "Poetry: introduction", "Poems by Milton",
         "Poems by Blake", "Kubla Khan", "Trees", "The Wild Swans at Coole", "Time and Time Again", "Blood", "Non-fiction: introduction",
         "The Mark on the Wall", "Film-making", "Why the Novel Matters", "The Argumentative Indian", "On Science Fiction", "Chandalika",
         "Broken Images"], [1, 2, 3, 4, 5, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 31, 32])),
    ("lhar1", "Hindi", "Hindi", "आरोह भाग 2 (Hindi Core)", "आरोह भाग 2 · Core", None),
    ("lhvt1", "Hindi", "Hindi", "वितान भाग 2 (Hindi Core)", "वितान भाग 2 · Core", None),
    ("lhat1", "Hindi", "Hindi", "अंतरा भाग 2 (Hindi Elective)", "अंतरा भाग 2 · Elective", None),
    ("lhan1", "Hindi", "Hindi", "अंतराल भाग 2 (Hindi Elective)", "अंतराल भाग 2 · Elective", None),
    ("lecs1", "Other books", "Computer Science", "Computer Science", "Computer Science", seq(
        ["Exception Handling in Python", "File Handling in Python", "Stack", "Queue", "Sorting", "Searching", "Understanding Data",
         "Database Concepts", "Structured Query Language (SQL)", "Computer Networks", "Data Communication", "Security Aspects", "Project Based Learning"])),
    ("leip1", "Other books", "Informatics Practices", "Informatics Practices", "Informatics Practices", seq(
        ["Querying and SQL Functions", "Data Handling using Pandas I", "Data Handling using Pandas II", "Plotting Data using Matplotlib",
         "Internet and Web", "Societal Impacts", "Project Based Learning"])),
    ("lebt1", "Other books", "Biotechnology", "Biotechnology", "Biotechnology", seq(
        ["An Overview of Recombinant DNA Technology", "Host–Vector System", "Gene Cloning", "Application of Recombinant DNA Technology",
         "Genome Technology and Engineering", "Microbial Culture", "Plant Tissue Culture", "Animal Cell Culture", "Stem Cell Culture and Organ Culture",
         "Bioprocessing and Biomanufacturing", "Bioremediation", "Recent Innovations in Biotechnology", "Entrepreneurship"])),
    ("lepy1", "Other books", "Psychology", "Psychology", "Psychology", seq(
        ["Variations in Psychological Attributes", "Self and Personality", "Meeting Life Challenges", "Psychological Disorders", "Therapeutic Approaches",
         "Attitude and Social Cognition", "Social Influence and Group Processes"])),
    ("lhsk1", "Other books", "Sanskrit", "भास्वती भाग 2 (Sanskrit Core)", "भास्वती · Sanskrit Core", None),
    ("lhsk2", "Other books", "Sanskrit", "शाश्वती भाग 2 (Sanskrit Elective)", "शाश्वती · Sanskrit Elective", None),
]
EXTRA = {
    "an": "Answers", "a1": "Appendix", "a2": "Appendix 2", "gl": "Glossary", "lp": "लेखक परिचय (author introductions)",
}
BOOK_EXTRA = {
    "lech1": {"an": "Answers to some questions", "a1": "Appendix"},
    "lech2": {"an": "Answers to some questions"},
    "lemh1": {"an": "Answers", "a1": "Appendix 1: Proofs in Mathematics", "a2": "Appendix 2: Mathematical Modelling"},
    "lemh2": {"an": "Answers"},
    "leph1": {"an": "Answers"},
    "leph2": {"an": "Answers"},
    "lepy1": {"gl": "Glossary"},
    "lhvt1": {"lp": "लेखक परिचय (author introductions)"},
}
out = []
for code, fold, sub, title, short, chs in BOOKS:
    d = disc[code]
    if chs is None:
        if code in inline:
            chs = inline[code]["ch"]
        elif code in hindi:
            chs = hindi[code]
        else:
            chs = [[i + 1, None, i + 1] for i in range(len(d["chapters"]))]
    label = inline[code]["label"] if code in inline else "Chapter"
    have = set(d["extras"])
    extra = []
    for suf, lab in BOOK_EXTRA.get(code, {}).items():
        if suf in have:
            extra.append([lab, code + suf + ".pdf"])
    if "ps" in have:
        extra.append(["Preface and contents", code + "ps.pdf"])
    mb = round(d["extras"]["dd"] / 1048576, 1) if d["extras"].get("dd") else None
    book = {"cls": 12, "sub": sub, "fold": fold, "title": title, "short": short, "code": code, "label": label,
            "ch": chs, "extra": extra}
    if mb:
        book["zip"] = code + "dd.zip"
        book["mb"] = mb
    out.append(book)
(root.parent / "books_12.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "books,", sum(len(b["ch"]) for b in out), "chapters")
for b in out:
    print(b["code"], b["fold"], "|", b["short"], len(b["ch"]), b.get("mb"), [e[0] for e in b["extra"]])
