#!/usr/bin/env python3
"""Build books_9.json: the Class 9 NCERT books (English medium plus the Hindi, Sanskrit and Urdu language books)
in the same folder layout as Classes 10 and 12.

What exists (and the size of every whole-book zip) comes from discovery_class9.json; the chapter names come from the
printed contents pages of each book (contents_class9.json), typed in below."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
disc = json.loads((root / "discovery_class9.json").read_text(encoding="utf-8"))["books"]
uvals = json.loads((root / "class9_extra_titles.json").read_text(encoding="utf-8")) if (root / "class9_extra_titles.json").exists() else {}


def seq(titles, start=1):
    return [[start + i, t, i + 1] for i, t in enumerate(titles)]


KAVERI = [("How I Taught My Grandmother to Read", "Bharat Our Land"), ("The Pot Maker", "Gifts of Grace: Honouring Our Vocations"),
          ("Winds of Change", "Canvas of Soil"), ("Vitamin-M", "I Cannot Remember My Mother"),
          ("The World of Limitless Possibilities", "Nine Gold Medals"), ("Twin Melodies", "A Friend Found in Music"),
          ("Carrier of Words", "Words"), ("Follow That Dream", "Believe in Yourself")]

BOOKS = [
    ("iebe1", "English", "English", "Kaveri (English)", "Kaveri", "Unit",
     seq(["%s · %s (poem)" % p for p in KAVERI])),
    ("ihga1", "Hindi", "Hindi", "हिंदी की पाठ्यपुस्तक (Hindi)", "हिंदी पाठ्यपुस्तक", "Chapter", seq([
        "प्रेमचंद – दो बैलों की कथा", "पदुमलाल पुन्नालाल बख्शी – क्या लिखूँ?", "शेखर जोशी – संवादहीन",
        "यतींद्र मिश्र – ऐसी भी बातें होती हैं (लता मंगेशकर से साक्षात्कार)", "मोहन राकेश – आखिरी चट्टान तक",
        "जगदीशचंद्र माथुर – रीढ़ की हड्डी", "कन्हैयालाल मिश्र ‘प्रभाकर’ – मैं और मेरा देश",
        "रैदास – पद", "तुलसीदास – राम-लक्ष्मण-परशुराम संवाद", "सूर्यकांत त्रिपाठी ‘निराला’ – भारति, जय, विजय करे!",
        "सुभद्रा कुमारी चौहान – झाँसी की रानी", "भवानीप्रसाद मिश्र – घर की याद"])),
    ("iemh1", "Mathematics", "Mathematics", "Ganita Manjari (Part 1)", "Ganita Manjari Part 1", "Chapter", seq([
        "Orienting Yourself: The Use of Coordinates", "Introduction to Linear Polynomials", "The World of Numbers", "Exploring Algebraic Identities",
        "I’m Up and Down, and Round and Round", "Measuring Space: Perimeter and Area", "The Mathematics of Maybe: Introduction to Probability",
        "Predicting What Comes Next: Exploring Sequences and Progressions"])),
    ("iemh2", "Mathematics", "Mathematics", "Ganita Manjari (Part 2)", "Ganita Manjari Part 2", "Chapter", seq([
        "Propositions and their Converses", "How Quantities Combine: Understanding Data", "The World of Algorithms", "Quadrilaterals",
        "Two Variables, One Line", "Math of Space: Surface Area and Volume"], 9)),
    ("iesc1", "Science", "Science", "Science", "Science", "Chapter", seq([
        "Exploration: Entering the World of Secondary Science", "Cell: The Building Block of Life", "Tissues in Action", "Describing Motion Around Us",
        "Exploring Mixtures and their Separation", "How Forces Affect Motion", "Work, Energy, and Simple Machines", "Journey Inside the Atom",
        "Atomic Foundations of Matter", "Sound Waves: Characteristics and Applications", "Reproduction: How Life Continues",
        "Patterns in Life: Diversity and Classification", "Earth as a System: Energy, Matter, and Life"])),
    ("iest1", "Social Science", "Social Science", "Understanding Society: India and Beyond (Part 1)", "Understanding Society Part 1", "Chapter", seq([
        "Understanding Social Science", "Geography: Shaping of the Earth’s Surface", "Geography: Atmosphere and Climate",
        "History: Early Humans and Beginning of Civilisation", "History: State and Society up to 1000 CE", "Political Science: Democracy",
        "Political Science: Elections", "Economics: Building Blocks in Economics: The Problem of Choice", "Economics: The Price Puzzle: What Drives the Market"])),
    ("iest2", "Social Science", "Social Science", "Understanding Society: India and Beyond (Part 2)", "Understanding Society Part 2", "Chapter", seq([
        "Geography: Oceans and Life", "Geography: Life on Earth", "History: Resistance and Resilience (1000–1700 CE)",
        "Political Science: Governance and Public Policy", "Economics: Managing Your Personal Finances", "Economics: From Ideas to Startups"])),
    ("iemr1", "Other books", "Arts", "Madhurima: A Textbook of Arts", "Madhurima (Arts)", "Chapter", seq([
        "Introduction to the History of Arts", "Theatre: The Stage Is Yours", "Theatre: Symbols and Metaphors on Stage", "Theatre: Creativity in Light and Sound",
        "Theatre: From Vision to Performance: Direction and Acting", "Music: Music and Us", "Music: The Science of Music", "Music: Rāga and Tāla",
        "Music: Music Travels Around the World", "Dance: Components of Dance", "Dance: Dance as Visual Storytelling", "Dance: Cultural Connections Through Dance",
        "Dance: Dance Choreography", "Visual Arts: Exploring the Fundamentals of Visual Arts", "Visual Arts: Mediums and Techniques in Visual Art",
        "Visual Arts: Visual Composition", "Visual Arts: Branches of Visual Arts"])),
    ("iehp1", "Other books", "Physical Education", "Khel Praveen: Physical Education and Well-being", "Khel Praveen", "Unit", seq([
        "Evolution of Physical Education and Well-being (chapters 1–4)", "Science and Sports (chapters 5–8)", "Olympism (chapters 9–11)",
        "Sports for All (chapters 12–17)", "Sports (chapters 18–20)", "Yoga for Holistic Health and Personal Excellence (chapters 21–23)"])),
    ("iekv1", "Other books", "Skill Education", "Kaushal Vikas: Skill Education", "Kaushal Vikas", "Chapter", seq([
        "Work with Life Forms: Introduction to Agricultural Practices", "Work with Life Forms: Rooftop Gardening", "Work with Life Forms: Precision Farming",
        "Work with Life Forms: Additional Vocations (Mushroom Cultivation)", "Work with Machines and Materials: Shaping Materials",
        "Work with Machines and Materials: Construction", "Work with Machines and Materials: Apparel",
        "Work with Machines and Materials: Additional Vocations (Sheet Metal Work)", "Work in Human Services: Personal and Lifestyle Services",
        "Work in Human Services: Healthcare", "Work in Human Services: Tourism", "Work in Human Services: Additional Vocations (Hospitality)"])),
    ("ihsh1", "Other books", "Sanskrit", "शारदा (Sanskrit)", "शारदा · Sanskrit", "Chapter", seq(uvals.get("ihsh1") or [
        "सत्यं शिवं सुन्दरं संस्कृतम्", "सुखस्य मूलं धर्मः, धर्मस्य मूलम् अर्थः", "आत्मवत्सर्वभूतेषु यः पश्यति सः पण्डितः", "न खलु वयस्तेजसो हेतुः",
        "कृतकबुद्धिः", "मनःपूतं समाचरेत्", "उपायं चिन्तयेत् प्राज्ञस्तथापायं च चिन्तयेत्", "अन्नाद् आनन्दं प्रति",
        "कृतं प्रतिकृतं भूयादेष धर्मः सनातनः", "णमो अरिहन्ताणम्", "वर्णोच्चारण-शिक्षा २",
        "परिशिष्टम् १: अन्वयः", "परिशिष्टम् २: समासः", "परिशिष्टम् ३: वाच्यम्", "परिशिष्टम् ४: शब्दरूपाणि", "परिशिष्टम् ५: धातुरूपाणि"])),
    ("iuju1", "Other books", "Urdu", "Jamuna (Urdu)", "Jamuna · Urdu", "Chapter", None),
]

BOOK_EXTRA = {"iebe1": {"a1": "Appendix"}}
out = []
for code, fold, sub, title, short, label, chs in BOOKS:
    d = disc[code]
    if chs is None:
        chs = [[i + 1, None, i + 1] for i in range(len(d["chapters"]))]
    assert len(chs) == len(d["chapters"]), (code, len(chs), len(d["chapters"]))
    have = set(d["extras"])
    extra = []
    for suf, lab in BOOK_EXTRA.get(code, {}).items():
        if suf in have:
            extra.append([lab, code + suf + ".pdf"])
    if "ps" in have:
        extra.append(["Preface and contents", code + "ps.pdf"])
    book = {"cls": 9, "sub": sub, "fold": fold, "title": title, "short": short, "code": code, "label": label, "ch": chs, "extra": extra}
    if d["extras"].get("dd"):
        book["zip"] = code + "dd.zip"
        book["mb"] = round(d["extras"]["dd"] / 1048576, 1)
    out.append(book)
(root.parent / "books_9.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "books,", sum(len(b["ch"]) for b in out), "chapters")
for b in out:
    print(b["code"], b["fold"], "|", b["short"], len(b["ch"]), b.get("mb"), [e[0] for e in b["extra"]])
