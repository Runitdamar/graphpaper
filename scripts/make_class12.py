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
    ("leac1", "Accountancy", "Accountancy", "Accountancy Part I: Partnership Accounts", "Part I · Partnership Accounts", seq(
        ["Accounting for Partnership Firms \u2013 Fundamentals", "Reconstitution of a Partnership Firm \u2013 Admission of a Partner",
         "Reconstitution of a Partnership Firm \u2013 Retirement/Death of a Partner", "Dissolution of Partnership Firm"])),
    ("leac2", "Accountancy", "Accountancy", "Accountancy Part II: Company Accounts and Analysis of Financial Statements", "Part II · Company Accounts", seq(
        ["Accounting for Share Capital", "Issue and Redemption of Debentures", "Financial Statements of a Company", "Analysis of Financial Statements",
         "Accounting Ratios", "Cash Flow Statement"])),
    ("leca1", "Accountancy", "Accountancy", "Accountancy: Computerised Accounting System", "Computerised Accounting System", seq(
        ["Overview of Computerised Accounting System", "Spreadsheet", "Use of Spreadsheet in Business Applications", "Graphs and Charts for Business Data"])),
    ("lebs1", "Business Studies", "Business Studies", "Business Studies Part I: Principles and Functions of Management", "Part I · Management", seq(
        ["Nature and Significance of Management", "Principles of Management", "Business Environment", "Planning", "Organising", "Staffing", "Directing", "Controlling"])),
    ("lebs2", "Business Studies", "Business Studies", "Business Studies Part II: Business Finance and Marketing", "Part II · Finance and Marketing", seq(
        ["Financial Management", "Marketing", "Consumer Protection"])),
    ("leec1", "Economics", "Economics", "Introductory Macroeconomics", "Macroeconomics", seq(
        ["Introduction", "National Income Accounting", "Money and Banking", "Determination of Income and Employment", "Government Budget and the Economy", "Open Economy Macroeconomics"])),
    ("leec2", "Economics", "Economics", "Introductory Microeconomics", "Microeconomics", seq(
        ["Introduction", "Theory of Consumer Behaviour", "Production and Costs", "The Theory of the Firm under Perfect Competition", "Market Equilibrium"])),
    ("lehs1", "History", "History", "Themes in Indian History Part I", "Part I", seq(
        ["Bricks, Beads and Bones: The Harappan Civilisation", "Kings, Farmers and Towns: Early States and Economies", "Kinship, Caste and Class: Early Societies",
         "Thinkers, Beliefs and Buildings: Cultural Developments"])),
    ("lehs2", "History", "History", "Themes in Indian History Part II", "Part II", seq(
        ["Through the Eyes of Travellers: Perceptions of Society", "Bhakti\u2013Sufi Traditions: Changes in Religious Beliefs and Devotional Texts",
         "An Imperial Capital: Vijayanagara", "Peasants, Zamindars and the State: Agrarian Society and the Mughal Empire"])),
    ("lehs3", "History", "History", "Themes in Indian History Part III", "Part III", seq(
        ["Colonialism and the Countryside: Exploring Official Archives", "Rebels and the Raj: 1857 Revolt and its Representations",
         "Mahatma Gandhi and the Nationalist Movement: Civil Disobedience and Beyond", "Framing the Constitution: The Beginning of a New Era"])),
    ("legy1", "Geography", "Geography", "Fundamentals of Human Geography", "Human Geography", seq(
        ["Human Geography: Nature and Scope", "The World Population: Distribution, Density and Growth", "Population Composition", "Primary Activities",
         "Secondary Activities", "Tertiary and Quaternary Activities", "Transport and Communication", "International Trade"])),
    ("legy2", "Geography", "Geography", "India: People and Economy", "India: People and Economy", seq(
        ["Population: Distribution, Density, Growth and Composition", "Human Settlements", "Land Resources and Agriculture", "Water Resources",
         "Mineral and Energy Resources", "Planning and Sustainable Development in Indian Context", "Transport and Communication", "International Trade",
         "Geographical Perspective on Selected Issues and Problems"])),
    ("legy3", "Geography", "Geography", "Practical Work in Geography Part II", "Practical Work Part II", seq(
        ["Data \u2013 Its Source and Compilation", "Data Processing", "Graphical Representation of Data", "Use of Computer in Data Processing and Mapping"])),
    ("leps1", "Political Science", "Political Science", "Contemporary World Politics", "Contemporary World Politics", seq(
        ["The End of Bipolarity", "Alternative Centres of Power", "Contemporary South Asia", "International Organisations", "Security in the Contemporary World",
         "Environment and Natural Resources", "Globalisation"])),
    ("leps2", "Political Science", "Political Science", "Politics in India since Independence", "Politics in India", seq(
        ["Challenges of Nation-Building", "Era of One-Party Dominance", "Politics of Planned Development", "India's External Relations",
         "Challenges to and Restoration of the Congress System", "The Crisis of Democratic Order", "Regional Aspirations", "Recent Developments in Indian Politics"])),
    ("lesy1", "Sociology", "Sociology", "Indian Society", "Indian Society", seq(
        ["Introducing Indian Society", "The Demographic Structure of the Indian Society", "Social Institutions: Continuity and Change",
         "The Market as a Social Institution", "Patterns of Social Inequality and Exclusion", "The Challenges of Cultural Diversity", "Suggestions for Project Work"])),
    ("lesy2", "Sociology", "Sociology", "Social Change and Development in India", "Social Change and Development", seq(
        ["Structural Change", "Cultural Change", "The Constitution and Social Change", "Change and Development in Rural Society",
         "Change and Development in Industrial Society", "Globalisation and Social Change", "Mass Media and Communications", "Social Movements"])),
    ("lepy1", "Psychology", "Psychology", "Psychology", "Psychology", seq(
        ["Variations in Psychological Attributes", "Self and Personality", "Meeting Life Challenges", "Psychological Disorders", "Therapeutic Approaches",
         "Attitude and Social Cognition", "Social Influence and Group Processes"])),
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
    ("lhsk1", "Other books", "Sanskrit", "भास्वती भाग 2 (Sanskrit Core)", "भास्वती · Sanskrit Core", None),
    ("lhsk2", "Other books", "Sanskrit", "शाश्वती भाग 2 (Sanskrit Elective)", "शाश्वती · Sanskrit Elective", None),
    ("lefa1", "Other books", "Fine Arts", "An Introduction to Indian Art Part II", "Fine Arts: Indian Art Part II", seq(
        ["The Manuscript Painting Tradition", "The Rajasthani Schools of Painting", "The Mughal School of Miniature Painting", "The Deccani Schools of Painting",
         "The Pahari Schools of Painting", "Company Painting", "The Modern Indian Art: Introduction to Modernism in India", "The Living Art Traditions of India"])),
    ("lehe1", "Other books", "Home Science", "Human Ecology and Family Sciences Part I", "Home Science: Part I", [
        [1, "Work, Livelihood and Career", 1], [2, "Unit II: Nutrition, Food Science and Technology", 2], [3, "Public Nutrition and Health", 3],
        [4, "Food Processing and Technology", 4], [5, "Food Quality and Food Safety", 5], [6, "Unit III: Human Development and Family Studies", 6],
        [7, "Management of Institutions and Programmes for Children, Youth and Elderly", 7]]),
    ("lehe2", "Other books", "Home Science", "Human Ecology and Family Sciences Part II", "Home Science: Part II", [
        [8, "Unit IV: Fabric and Apparel", 1], [9, "Fashion Design and Merchandising", 2], [10, "Care and Maintenance of Fabrics and Textile Products", 3],
        [11, "Unit V: Resource Management", 4], [12, "Consumer Education and Protection", 5], [13, "Unit VI: Communication and Extension", 6],
        [14, "Corporate Communication and Public Relations", 7]]),
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
    "leec1": {"gl": "Glossary"},
    "leec2": {"gl": "Glossary"},
    "lefa1": {"gl": "Glossary"},
    "legy1": {"a1": "Appendix", "gl": "Glossary"},
    "legy2": {"a1": "Appendix"},
    "lesy2": {"gl": "Glossary"},
}
# Which streams see each book: S = Science, C = Commerce, H = Humanities (Class 12 only).
STREAMS = {
    "leph1": "S", "leph2": "S", "lech1": "S", "lech2": "S", "lebo1": "S", "lebt1": "S",
    "lemh1": "SC", "lemh2": "SC", "lecs1": "SC", "leip1": "SC",
    "leac1": "C", "leac2": "C", "leca1": "C", "lebs1": "C", "lebs2": "C",
    "leec1": "CH", "leec2": "CH",
    "lehs1": "H", "lehs2": "H", "lehs3": "H", "legy1": "H", "legy2": "H", "legy3": "H", "leps1": "H", "leps2": "H",
    "lesy1": "H", "lesy2": "H", "lefa1": "H", "lehe1": "H", "lehe2": "H",
    "lepy1": "SH",
}
THEME_OFFSET = {"lehs2": 4, "lehs3": 8}
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
    label = inline[code]["label"] if code in inline else ("Theme" if code.startswith("lehs") else "Chapter")
    if code in THEME_OFFSET:
        chs = [[n + THEME_OFFSET[code], t, f] for n, t, f in chs]
    have = set(d["extras"])
    extra = []
    for suf, lab in BOOK_EXTRA.get(code, {}).items():
        if suf in have:
            extra.append([lab, code + suf + ".pdf"])
    if "ps" in have:
        extra.append(["Preface and contents", code + "ps.pdf"])
    mb = round(d["extras"]["dd"] / 1048576, 1) if d["extras"].get("dd") else None
    book = {"cls": 12, "sub": sub, "fold": fold, "title": title, "short": short, "code": code, "label": label,
            "ch": chs, "extra": extra, "st": STREAMS.get(code, "SCH")}
    if mb:
        book["zip"] = code + "dd.zip"
        book["mb"] = mb
    out.append(book)
(root.parent / "books_12.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "books,", sum(len(b["ch"]) for b in out), "chapters")
for b in out:
    print(b["code"], b["fold"], "|", b["short"], len(b["ch"]), b.get("mb"), [e[0] for e in b["extra"]])
