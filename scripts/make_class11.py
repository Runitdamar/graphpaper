#!/usr/bin/env python3
"""Build books_11.json: the Class 11 NCERT books for Science, Commerce and Humanities (English medium plus the Hindi, Sanskrit
and Music language books) in the same folder + stream layout as Class 12.

What exists (and every whole-book zip size) comes from discovery_class11.json; chapter names come from the printed contents pages
(contents_class11.json), the six science books that were already on the site (class11_inline.json) and class11_extra_titles.json
(Sanskrit / Music titles read from the tail of the contents pages)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
disc = json.loads((root / "discovery_class11.json").read_text(encoding="utf-8"))["books"]
inline = {b["code"]: b for b in json.loads((root / "class11_inline.json").read_text(encoding="utf-8"))}
extra_titles = json.loads((root / "class11_extra_titles.json").read_text(encoding="utf-8")) if (root / "class11_extra_titles.json").exists() else {}


def seq(titles, files=None, start=1):
    files = files or list(range(1, len(titles) + 1))
    return [[start + i, t, f] for i, (t, f) in enumerate(zip(titles, files))]


# code -> (folder, subject label, full title, short title, chapter label, chapter list or None for inline/extra titles)
BOOKS = [
    ("keph1", "Physics", "Physics", "Physics Part I", "Part I", "Chapter", None),
    ("keph2", "Physics", "Physics", "Physics Part II", "Part II", "Chapter", None),
    ("kech1", "Chemistry", "Chemistry", "Chemistry Part I", "Part I", "Unit", None),
    ("kech2", "Chemistry", "Chemistry", "Chemistry Part II", "Part II", "Unit", None),
    ("kemh1", "Mathematics", "Mathematics", "Mathematics", "Mathematics", "Chapter", None),
    ("kebo1", "Biology", "Biology", "Biology", "Biology", "Chapter", None),
    ("keac1", "Accountancy", "Accountancy", "Financial Accounting Part I", "Part I", "Chapter", seq([
        "Introduction to Accounting", "Theory Base of Accounting", "Recording of Transactions - I", "Recording of Transactions - II",
        "Bank Reconciliation Statement", "Trial Balance and Rectification of Errors", "Depreciation, Provisions and Reserves"])),
    ("keac2", "Accountancy", "Accountancy", "Financial Accounting Part II", "Part II", "Chapter", seq([
        "Financial Statements - I", "Financial Statements - II"], start=8)),
    ("kebs1", "Business Studies", "Business Studies", "Business Studies", "Business Studies", "Chapter", seq([
        "Business, Trade and Commerce", "Forms of Business Organisation", "Private, Public and Global Enterprises", "Business Services",
        "Emerging Modes of Business", "Social Responsibilities of Business and Business Ethics", "Formation of a Company",
        "Sources of Business Finance", "MSME and Business Entrepreneurship", "Internal Trade", "International Business"])),
    ("keec1", "Economics", "Economics", "Indian Economic Development", "Indian Economic Development", "Chapter", seq([
        "Indian Economy on the Eve of Independence", "Indian Economy 1950–1990", "Liberalisation, Privatisation and Globalisation: An Appraisal",
        "Human Capital Formation in India", "Rural Development", "Employment: Growth, Informalisation and Other Issues",
        "Environment and Sustainable Development", "Comparative Development Experiences of India and Its Neighbours"])),
    ("kest1", "Economics", "Economics", "Statistics for Economics", "Statistics for Economics", "Chapter", seq([
        "Introduction", "Collection of Data", "Organisation of Data", "Presentation of Data", "Measures of Central Tendency",
        "Correlation", "Index Numbers", "Use of Statistical Tools"])),
    ("kehs1", "History", "History", "Themes in World History", "Themes in World History", "Theme", seq([
        "Writing and City Life", "An Empire Across Three Continents", "Nomadic Empires", "The Three Orders", "Changing Cultural Traditions",
        "Displacing Indigenous Peoples", "Paths to Modernisation"])),
    ("kegy1", "Geography", "Geography", "India: Physical Environment", "India: Physical Environment", "Chapter", seq([
        "India — Location", "Structure and Physiography", "Drainage System", "Climate", "Natural Vegetation", "Natural Hazards and Disasters"])),
    ("kegy2", "Geography", "Geography", "Fundamentals of Physical Geography", "Fundamentals of Physical Geography", "Chapter", seq([
        "Geography as a Discipline", "The Origin and Evolution of the Earth", "Interior of the Earth", "Distribution of Oceans and Continents",
        "Geomorphic Processes", "Landforms and their Evolution", "Composition and Structure of Atmosphere",
        "Solar Radiation, Heat Balance and Temperature", "Atmospheric Circulation and Weather Systems", "Water in the Atmosphere",
        "World Climate and Climate Change", "Water (Oceans)", "Movements of Ocean Water", "Biodiversity and Conservation"])),
    ("kegy3", "Geography", "Geography", "Practical Work in Geography Part I", "Practical Work in Geography", "Chapter", seq([
        "Introduction to Maps", "Map Scale", "Latitude, Longitude and Time", "Map Projections", "Topographical Maps", "Introduction to Remote Sensing"])),
    ("keps1", "Political Science", "Political Science", "Political Theory", "Political Theory", "Chapter", seq([
        "Political Theory: An Introduction", "Freedom", "Equality", "Social Justice", "Rights", "Citizenship", "Nationalism", "Secularism"])),
    ("keps2", "Political Science", "Political Science", "Indian Constitution at Work", "Indian Constitution at Work", "Chapter", seq([
        "Constitution: Why and How?", "Rights in the Indian Constitution", "Election and Representation", "Executive", "Legislature",
        "Judiciary", "Federalism", "Local Governments", "Constitution as a Living Document", "The Philosophy of the Constitution"])),
    ("kesy1", "Sociology", "Sociology", "Introducing Sociology", "Introducing Sociology", "Chapter", seq([
        "Sociology and Society", "Terms, Concepts and their Use in Sociology", "Understanding Social Institutions", "Culture and Socialisation",
        "Doing Sociology: Research Methods"])),
    ("kesy2", "Sociology", "Sociology", "Understanding Society", "Understanding Society", "Chapter", seq([
        "Social Structure, Stratification and Social Processes in Society", "Social Change and Social Order in Rural and Urban Society",
        "Environment and Society", "Introducing Western Sociologists", "Indian Sociologists"])),
    ("kepy1", "Psychology", "Psychology", "Psychology", "Psychology", "Chapter", seq([
        "What is Psychology?", "Methods of Enquiry in Psychology", "Human Development", "Sensory, Attentional and Perceptual Processes",
        "Learning", "Human Memory", "Thinking", "Motivation and Emotion"])),
    ("kehb1", "English", "English", "Hornbill (English Core)", "Hornbill · Core", "Chapter", seq([
        "The Portrait of a Lady · poem: A Photograph", "We’re Not Afraid to Die... if We Can All Be Together",
        "Discovering Tut: the Saga Continues · poems: The Laburnum Top, The Voice of the Rain",
        "The Ailing Planet: the Green Movement’s Role · poem: Childhood", "The Adventure", "Silk Road · poem: Father to Son",
        "Writing Skills: Note-making", "Writing Skills: Summarising", "Writing Skills: Sub-titling", "Writing Skills: Essay-writing",
        "Writing Skills: Letter-writing", "Writing Skills: Creative Writing"], [1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 16])),
    ("kesp1", "English", "English", "Snapshots (English Core, supplementary reader)", "Snapshots · Core", "Chapter", seq([
        "The Summer of the Beautiful White Horse", "The Address", "Mother’s Day", "Birth", "The Tale of Melon City"])),
    ("keww1", "English", "English", "Woven Words (English Elective)", "Woven Words · Elective", "Chapter", seq([
        "Short story: The Lament", "Short story: A Pair of Mustachios", "Short story: The Rocking-horse Winner",
        "Short story: The Adventure of the Three Garridebs", "Short story: Pappachi’s Moth", "Short story: The Third and Final Continent",
        "Short story: Glory at Twilight", "Short story: The Luncheon",
        "Poem: The Peacock", "Poem: Let Me Not to the Marriage of True Minds", "Poem: Coming", "Poem: Telephone Conversation",
        "Poem: The World is too Much With Us", "Poem: Mother Tongue", "Poem: Hawk Roosting", "Poem: For Elkana", "Poem: Refugee Blues",
        "Poem: Felling of the Banyan Tree", "Poem: Ode to a Nightingale", "Poem: Ajamil and the Tigers",
        "Essay: My Watch", "Essay: My Three Passions", "Essay: Patterns of Creativity", "Essay: Tribal Verse", "Essay: What is a Good Book?",
        "Essay: The Story", "Essay: Bridges"],
        [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 31, 32, 33, 34, 35, 36, 37])),
    ("khar1", "Hindi", "Hindi", "आरोह भाग 1 (Hindi Core)", "आरोह भाग 1 · Core", "Chapter", seq([
        "प्रेमचंद – नमक का दारोगा", "कृष्णा सोबती – मियाँ नसीरुद्दीन", "सत्यजित राय – अपू के साथ ढाई साल", "बालमुकुंद गुप्त – विदाई-संभाषण",
        "शेखर जोशी – गलता लोहा", "मन्नू भंडारी – रजनी", "कृश्नचंदर – जामुन का पेड़", "जवाहरलाल नेहरू – भारत माता",
        "कबीर – हम तौ एक एक करि जानाँ", "मीरा – मेरे तो गिरधर गोपाल, दूसरो न कोई", "भवानीप्रसाद मिश्र – घर की याद",
        "त्रिलोचन – चंपा काले-काले अच्छर नहीं चीन्हती", "दुष्यंत कुमार – ग़ज़ल", "अक्कमहादेवी – हे भूख! मत मचल; हे मेरे जूही के फूल जैसे ईश्वर",
        "अवतार सिंह पाश – सबसे खतरनाक", "निर्मला पुतुल – आओ, मिलकर बचाएँ"])),
    ("khat1", "Hindi", "Hindi", "अंतरा भाग 1 (Hindi Elective)", "अंतरा भाग 1 · Elective", "Chapter", seq([
        "प्रेमचंद – ईदगाह", "अमरकांत – दोपहर का भोजन", "हरिशंकर परसाई – टार्च बेचनेवाले", "रांगेय राघव – गूँगे", "सुधा अरोड़ा – ज्योतिबा फुले",
        "ओमप्रकाश वाल्मीकि – खानाबदोश", "पांडेय बेचन शर्मा ‘उग्र’ – उसकी माँ", "भारतेंदु हरिश्चंद्र – भारतवर्ष की उन्नति कैसे हो सकती है?",
        "कबीर – अरे इन दोहुन राह न पाई; बालम, आवो हमारे गेह रे", "सूरदास – खेलन में को काको गुसैयाँ; मुरली तऊ गुपालहिं भावति",
        "देव – हँसी की चोट; सपना; दरबार", "सुमित्रानंदन पंत – संध्या के बाद", "महादेवी वर्मा – जाग तुझको दूर जाना",
        "नागार्जुन – बादल को घिरते देखा है", "श्रीकांत वर्मा – हस्तक्षेप", "धूमिल – घर में वापसी"])),
    ("khvt1", "Hindi", "Hindi", "वितान भाग 1 (Hindi Core)", "वितान भाग 1 · Core", "Chapter", seq([
        "कुमार गंधर्व – भारतीय गायिकाओं में बेजोड़: लता मंगेशकर", "अनुपम मिश्र – राजस्थान की रजत बूँदें", "बेबी हालदार – आलो-आँधारि",
        "भारतीय कलाएँ", "लेखकों के बारे में"])),
    ("khan1", "Hindi", "Hindi", "अंतराल भाग 1 (Hindi Elective)", "अंतराल भाग 1 · Elective", "Chapter", seq([
        "मकबूल फ़िदा हुसैन – हुसैन की कहानी अपनी ज़बानी", "विष्णु प्रभाकर – आवारा मसीहा: दिशाहारा"])),
    ("kham1", "Hindi", "Hindi", "अभिव्यक्ति और माध्यम (Hindi)", "अभिव्यक्ति और माध्यम", "Chapter", seq([
        "जनसंचार माध्यम", "पत्रकारिता के विविध आयाम", "विभिन्न माध्यमों के लिए लेखन", "पत्रकारीय लेखन के विभिन्न रूप और लेखन प्रक्रिया",
        "विशेष लेखन – स्वरूप और प्रकार", "कैसे बनती है कविता", "नाटक लिखने का व्याकरण", "कैसे लिखें कहानी", "डायरी लिखने की कला", "कथा-पटकथा",
        "कैसे करें कहानी का नाट्य रूपांतरण", "कैसे बनता है रेडियो नाटक", "नए और अप्रत्याशित विषयों पर लेखन", "कार्यालयी लेखन और प्रक्रिया",
        "स्ववृत्त (बायोडेटा) लेखन और रोज़गार संबंधी आवेदन-पत्र", "कोश – एक परिचय"])),
    ("khsr1", "Hindi", "Hindi", "सृजन भाग 1 (Hindi Elective)", "सृजन भाग 1 · Elective", "Chapter", seq([
        "सृजनात्मकता और लेखन (Creativity and Writing)", "साहित्यिक लेखन (Literary Writing)", "मीडिया (Media)", "अनुवाद (Translation)"])),
    ("khsk1", "Other books", "Sanskrit", "भास्वती प्रथमो भागः (Sanskrit Core)", "भास्वती · Sanskrit Core", "Chapter", None),
    ("khsk2", "Other books", "Sanskrit", "शाश्वती प्रथमो भागः (Sanskrit Elective)", "शाश्वती · Sanskrit Elective", "Chapter", None),
    ("khtp1", "Other books", "Music", "संगीत: तबला एवं पखावज (Music)", "संगीत · तबला एवं पखावज", "Chapter", seq([
        "भारतीय संगीत का सामान्य परिचय", "कैसे दिखते हैं तबला एवं पखावज वाद्य?", "तबला एवं पखावज वाद्यों पर बजने वाले वर्ण एवं बोल",
        "तबला एवं पखावज वाद्यों की उत्पत्ति एवं विकास", "ताल-लिपि पद्धति एवं विभिन्न ठेके", "पारिभाषिक शब्द", "भारतीय संगीत में वाद्य वर्गीकरण",
        "तबला एवं पखावज वाद्यों के घरानों का वर्णन"])),
    ("khgv1", "Other books", "Music", "संगीत: हिंदुस्तानी गायन एवं वादन (Music)", "संगीत · गायन एवं वादन", "Chapter", None),
    ("kehp1", "Other books", "Physical Education", "Health and Physical Education", "Health and Physical Education", "Chapter", seq([
        "Physical Education", "Understanding Health", "Physical and Physiological Aspects of Physical Education and Sports", "Individual Games",
        "Team Games", "Yoga and its Relevance in the Modern Times", "Safety and Security", "Health Related Physical Fitness",
        "Measurement and Evaluation", "Tournaments and Competitions", "Adventure Sports"])),
    ("kecs1", "Other books", "Computer Science", "Computer Science", "Computer Science", "Chapter", seq([
        "Computer System", "Encoding Schemes and Number System", "Emerging Trends", "Introduction to Problem Solving", "Getting Started with Python",
        "Flow of Control", "Functions", "Strings", "Lists", "Tuples and Dictionaries", "Societal Impact"])),
    ("keip1", "Other books", "Informatics Practices", "Informatics Practices", "Informatics Practices", "Chapter", seq([
        "Computer System", "Emerging Trends", "Brief Overview of Python", "Working with Lists and Dictionaries", "Understanding Data",
        "Introduction to NumPy", "Database Concepts", "Introduction to Structured Query Language (SQL)"])),
    ("kebt1", "Other books", "Biotechnology", "Biotechnology", "Biotechnology", "Chapter", seq([
        "Introduction", "Cellular Organelles", "Biomolecules", "Enzymes and Bioenergetics", "Cellular Processes", "Basic Principles of Inheritance",
        "Basic Processes", "Genetic Disorder", "Introduction to Bioinformatics", "Protein Informatics and Cheminformatics",
        "Programming and Systems Biology", "Tools and Techniques"])),
    ("kefa1", "Other books", "Fine Arts", "An Introduction to Indian Art Part I", "Fine Arts: Indian Art Part I", "Chapter", seq([
        "Prehistoric Rock Paintings", "Arts of the Indus Valley", "Arts of the Mauryan Period", "Post-Mauryan Trends in Indian Art and Architecture",
        "Later Mural Traditions", "Temple Architecture and Sculpture", "Indian Bronze Sculpture", "Some Aspects of Indo-Islamic Architecture"])),
    ("kehe1", "Other books", "Home Science", "Human Ecology and Family Sciences Part I", "Home Science: Part I", "Chapter", seq([
        "Introduction HEFS: Evolution of the Discipline and its Relevance to Quality of Life", "Understanding the Self",
        "Food, Nutrition, Health and Fitness", "Management of Resources", "Fabrics Around Us", "Media and Communication Technology",
        "Concerns and Needs in Diverse Contexts"])),
    ("kehe2", "Other books", "Home Science", "Human Ecology and Family Sciences Part II", "Home Science: Part II", "Chapter", seq([
        "Nutrition, Health and Well-being", "Our Apparel", "Financial Management and Planning", "Care and Maintenance of Fabrics"], start=8)),
    ("keks1", "Other books", "Knowledge Traditions", "Knowledge Traditions and Practices of India", "Knowledge Traditions and Practices of India", "Chapter", seq([
        "Language and Literature of India", "Indian Philosophical Systems", "Performing Art Traditions in India", "Indian Art and Architecture",
        "Astronomy in India", "Mathematics in India", "Introducing Ayurveda: the Science of Health and Disease", "Chemistry and Metallurgy in India", "Yoga"])),
]
EXTRA = {"an": "Answers", "a1": "Appendix", "gl": "Glossary"}
BOOK_EXTRA = {
    "keph1": {"an": "Answers", "a1": "Appendices"},
    "keph2": {"an": "Answers"},
    "kech1": {"an": "Answers", "a1": "Appendix"},
    "kech2": {"an": "Answers"},
    "kemh1": {"an": "Answers", "a1": "Appendix 1: Infinite Series", "a2": "Appendix 2: Mathematical Modelling"},
    "keec1": {"gl": "Glossary"}, "kegy2": {"gl": "Glossary"}, "kepy1": {"gl": "Glossary"},
    "khtp1": {"a1": "परिशिष्ट (appendices)"},
}
# Which streams see each book: S = Science, C = Commerce, H = Humanities.
STREAMS = {
    "keph1": "S", "keph2": "S", "kech1": "S", "kech2": "S", "kebo1": "S", "kebt1": "S",
    "kemh1": "SC", "kecs1": "SC", "keip1": "SC",
    "keac1": "C", "keac2": "C", "kebs1": "C",
    "keec1": "CH", "kest1": "CH",
    "kehs1": "H", "kegy1": "H", "kegy2": "H", "kegy3": "H", "keps1": "H", "keps2": "H", "kesy1": "H", "kesy2": "H",
    "kefa1": "H", "kehe1": "H", "kehe2": "H", "keks1": "H",
    "kepy1": "SH",
}
out = []
for code, fold, sub, title, short, label, chs in BOOKS:
    d = disc[code]
    if chs is None:
        if code in inline:
            chs = inline[code]["ch"]
            label = inline[code]["label"]
        elif code in extra_titles:
            chs = seq(extra_titles[code])
        else:
            raise SystemExit("no chapter titles for " + code)
    if code == "keph1":
        chs = [[n, t, i + 1] for i, (n, t, _f) in enumerate(chs)]  # the old inline data had a missing file for chapter 1
    assert len(chs) == len(d["chapters"]), (code, len(chs), len(d["chapters"]))
    have_files = {c["file"][len(code):] for c in d["chapters"]}
    for _n, _t, f in chs:
        assert "%02d" % f in have_files, (code, f)
    have = set(d["extras"])
    extra = []
    for suf, lab in BOOK_EXTRA.get(code, {}).items():
        if suf in have:
            extra.append([lab, code + suf + ".pdf"])
        else:
            print("WARN missing extra", code, suf)
    if "ps" in have:
        extra.append(["Preface and contents", code + "ps.pdf"])
    book = {"cls": 11, "sub": sub, "fold": fold, "title": title, "short": short, "code": code, "label": label,
            "ch": chs, "extra": extra, "st": STREAMS.get(code, "SCH")}
    if d["extras"].get("dd"):
        book["zip"] = code + "dd.zip"
        book["mb"] = round(d["extras"]["dd"] / 1048576, 1)
    out.append(book)
(root.parent / "books_11.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(out), "books,", sum(len(b["ch"]) for b in out), "chapters")
for b in out:
    print(b["code"], b["fold"], "|", b["short"], len(b["ch"]), b.get("mb"), b["st"], [e[0] for e in b["extra"]])
