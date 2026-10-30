/* GraphPaper core: shared helpers, state, class and book pages, router, events. Loaded first. */
var BOOKS = [];
var BBASE = "https://ncert.nic.in/textbook/pdf/";
var BPORTAL = "https://ncert.nic.in/textbook.php";
var SYL = null, PAP = null;
var P = {
 qb:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 flask:'<path d="M9 3h6M10 3v6l-5 10a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-10V3"/><path d="M8 15h8"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
 book:'<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
 doc:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
 notes:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
 news:'<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
 Physics:'<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>',
 Chemistry:'<path d="M9 3h6M10 3v6l-5 10a1 1 0 0 0 1 2h12a1 1 0 0 0 1-2l-5-10V3"/><path d="M8 15h8"/>',
 Maths:'<path d="M17 5H7l6 7-6 7h10"/>',
 Biology:'<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/>'
};
function ico(n, sz){ return '<svg width="' + (sz || 26) + '" height="' + (sz || 26) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; }
var D = document;
function $(s, r){ return (r || D).querySelector(s); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
function safeUrl(u){ return /^https?:\/\//i.test(u || "") ? u : "https://www.cbse.gov.in/"; }
function fmt(d){ var t = new Date(d + "T00:00:00"); return isNaN(t) ? d : t.toLocaleDateString("en-IN", {day:"numeric", month:"short", year:"numeric"}); }
function host(u){ try { return new URL(u).hostname.replace(/^www\./, ""); } catch(e){ return ""; } }
function isNew(d){ var t = new Date(d + "T00:00:00"); return !isNaN(t) && (Date.now() - t.getTime()) < 14 * 864e5 && t.getTime() <= Date.now() + 864e5; }

var TYPES = {
  "Circular":{label:"Circular", plural:"Circulars", c:"--a1"},
  "Date Sheet":{label:"Date sheet", plural:"Date sheets", c:"--a4"},
  "Syllabus Change":{label:"Syllabus", plural:"Syllabus", c:"--a3"},
  "Result":{label:"Result", plural:"Results", c:"--a2"}
};
var TYPE_KEYS = ["Circular", "Date Sheet", "Syllabus Change", "Result"];
var HYD = false; /* true while a pre-rendered page is still showing and data is loading: do not redraw until everything is here, so nothing jumps */
var ST = {ub:"all", stream:"Science", cls:"", wc:"", items:[], loaded:false, q:"", type:"all", hf:"all", bsub:"All", bq:""};
try { var sv = localStorage.getItem("gp-class"); if (/^(1[0-2]|[1-9])$/.test(sv || "")) ST.cls = sv; } catch(e){}
try { var sv2 = localStorage.getItem("gp-stream"); if (sv2 === "Science" || sv2 === "Commerce" || sv2 === "Humanities"){ ST.stream = sv2; ST.streamSet = true; } } catch(e){}
ST.ws = ST.streamSet ? ST.stream : ""; ST.pending = 5;

function findNotice(a){ var x = null; ST.items.forEach(function(i){ if (i.slug === a || i.id === a) x = i; }); return x; }
function relatedBox(x){
  var cls = noticeClasses(x); if (!cls.length) return "";
  var h = '<div class="card" style="--sh:var(--a3)"><h2 style="font-size:22px;margin:0">Study resources</h2>';
  cls.forEach(function(c){
    var base = "/class-" + c + (hasStreams(c) ? "/" + (ST.streamSet ? ST.stream : "Science").toLowerCase() : ""), links = [];
    links.push(['NCERT books', base + "/books"]);
    if (c >= 9) links.push(['Syllabus 2026-27', base + "/syllabus"]);
    if (c === 10 || c === 12){ links.push(['Sample papers', base + "/sample-papers"]); links.push(['Previous year papers', base + "/previous-year-papers"]); }
    if (c >= 6) links.push(['Question bank', base + "/question-bank"]);
    h += '<div><b>Class ' + c + '</b><div style="display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:6px">' + links.map(function(l){ return '<a href="' + l[1] + '" style="text-decoration:underline;font-weight:700">' + l[0] + '</a>'; }).join("") + '</div></div>';
  });
  return h + '</div>';
}
function nurl(x){ return "#/notice/" + encodeURIComponent(x.slug || x.id); }
function typeOf(x){ return TYPES[x.tag] || TYPES.Circular; }
function pill(x, extra){ var t = typeOf(x); return '<span class="pill" style="background:var(' + t.c + ')">' + esc(t.label) + '</span>' + (extra || ""); }
var CHECKED = "";
var LKS = null;
try { var lksEl = document.getElementById("lks"); if (lksEl) LKS = JSON.parse(lksEl.textContent); } catch(e){}
try { var chkEl = document.getElementById("chk"); if (chkEl) CHECKED = (JSON.parse(chkEl.textContent) || {}).date || ""; } catch(e){}
var NSUBJ = [["Physics",/physics/i],["Chemistry",/chemistry/i],["Mathematics",/\bmaths?\b|mathematics/i],["Biology",/biology/i],["Accountancy",/accountancy/i],["Business Studies",/business studies/i],["Economics",/economics/i],["English",/english/i],["Hindi",/hindi/i],["Sanskrit",/sanskrit/i],["History",/history/i],["Geography",/geography/i],["Political Science",/political science/i],["Psychology",/psychology/i],["Sociology",/sociology/i],["Computer Science",/computer science|informatics/i],["Science",null],["Social Science",/social science/i]];
function nmeta(x){
  if (x._m) return x._m;
  var t = x.title || "", t2 = t.replace(/social science/ig, ""), m = {};
  m.classes = noticeClasses(x);
  m.streams = []; if (/\bscience\b/i.test(t2)) m.streams.push("Science"); if (/\bcommerce\b/i.test(t2)) m.streams.push("Commerce"); if (/\bhumanities\b|\barts\b/i.test(t2)) m.streams.push("Humanities");
  m.subjects = []; NSUBJ.forEach(function(s){ if (s[1] ? s[1].test(t) : /\bscience\b/i.test(t2)) m.subjects.push(s[0]); });
  var yr = /\b(20\d\d)\b/.exec(t); m.year = yr ? yr[1] : "";
  var d = new Date(x.date + "T00:00:00"); m.age = isNaN(d) ? 0 : Math.floor((Date.now() - d.getTime()) / 864e5);
  m.archived = x.archived === true || (x.archived !== false && m.age > 180);
  var who = [];
  if (m.classes.length) who.push((m.classes.length === 1 ? "Class " + m.classes[0] : "Classes " + m.classes.join(", ")) + " students");
  if (/school|principal|affiliat|\bLOC\b|UDISE|registration|submission|portal/i.test(t)) who.push("school heads and staff");
  if (/parent/i.test(t)) who.push("parents");
  if (/teacher|faculty|training|webinar|workshop|capacity/i.test(t)) who.push("teachers");
  m.affectsAuto = !x.affects;
  m.affects = x.affects || (who.length ? who.join(", ").replace(/^./, function(c){ return c.toUpperCase(); }) : "Students, parents and schools");
  return (x._m = m);
}
function ageText(m){ return m.age < 1 ? "today" : m.age < 31 ? m.age + " day" + (m.age === 1 ? "" : "s") + " ago" : m.age < 365 ? Math.round(m.age / 30) + " months ago" : (Math.round(m.age / 36.5) / 10) + " years ago"; }
var UCAT = {
  "circulars": ["Circular", "circulars", "Circulars from CBSE and CBSE Academic about exams, registration, schools and students, each linked to the official notice."],
  "date-sheets": ["Date Sheet", "date sheets", "CBSE date sheets for board and special examinations, each linked to the official PDF. Always check dates in the official PDF before you plan."],
  "syllabus-changes": ["Syllabus Change", "syllabus changes", "CBSE notices that change a syllabus or curriculum, each linked to the official source."],
  "results": ["Result", "results", "CBSE result announcements, each linked to the official source."]
};
var UCAT_SLUG = {}; Object.keys(UCAT).forEach(function(k){ UCAT_SLUG[UCAT[k][0]] = k; });
function uPreset(arg){ var p = {type: "", cls: "", arg: arg || ""}; if (arg && UCAT[arg]) p.type = UCAT[arg][0]; var m = /^class-(9|1[0-2])$/.exec(arg || ""); if (m) p.cls = m[1]; return p; }
function uFilter(p, raw){
  var q = raw ? "" : (ST.q || "").trim().toLowerCase(), cur = [], arc = [], type = p.type || (raw ? "all" : ST.type);
  ST.items.forEach(function(x){
    var m = nmeta(x);
    if (type && type !== "all" && x.tag !== type) return;
    if (p.cls && m.classes.indexOf(+p.cls) < 0) return;
    if (!raw){
      if (ST.fs && m.streams.length && m.streams.indexOf(ST.fs) < 0) return;
      if (ST.fsub && m.subjects.indexOf(ST.fsub) < 0) return;
      if (ST.fy && m.year !== ST.fy) return;
      if (q && (x.title + " " + typeOf(x).label + " " + (x.summary || "")).toLowerCase().indexOf(q) < 0) return;
    }
    (m.archived ? arc : cur).push(x);
  });
  return {cur: cur, arc: arc};
}
function noticeCard(x, small){
  var t = typeOf(x), m = nmeta(x);
  return '<article class="card' + (small ? ' sm' : '') + '" style="--sh:var(' + t.c + ')">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:700;font-size:14px">' + pill(x) +
    (m.archived ? '<span class="pill tag-arch">Archived</span>' : isNew(x.date) ? '<span class="pill" style="background:var(--a3)">New</span>' : '<span>CBSE</span>') + '</div>' +
    '<h3><a href="' + nurl(x) + '">' + esc(x.title) + '</a></h3>' +
    '<div class="meta">' + esc(fmt(x.date)) + ' \u00b7 ' + esc(noticeClass(x)) + '</div>' +
    (x.deadline ? '<div class="meta" style="color:var(--ink);font-weight:700">Deadline: ' + esc(x.deadline) + '</div>' : '') +
    '<a class="more" href="' + nurl(x) + '">Read notice →</a></article>';
}
function loadingOrEmpty(msg){ return '<div class="card" style="grid-column:1/-1;text-align:center;box-shadow:0 6px 0 var(--a1)">' + (ST.loaded ? esc(msg) : 'Loading notices...') + '</div>'; }
function classOf(x, c){ return noticeClasses(x).indexOf(+(c || ST.cls)) > -1; }
var ROMAN = {I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11, XII:12};
function noticeClasses(x){
  var t = x.title, out = {}, m, re;
  re = /\bclass(?:es)?\s*[-:]?\s*((?:(?:XII|XI|X|IX|VIII|VII|VI|IV|V|III|II|I|\d{1,2})(?:th)?\b[\s,&/\-]*(?:and|to|&)?\s*)+)/gi;
  while ((m = re.exec(t))) {
    var parts = m[1].match(/XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I|\d{1,2}/gi) || [];
    var nums = parts.map(function(p){ return ROMAN[p.toUpperCase()] || parseInt(p, 10); }).filter(function(n){ return n >= 1 && n <= 12; });
    if (/\bto\b|\u2013|-/i.test(m[1]) && nums.length === 2 && nums[0] < nums[1]) { for (var k = nums[0]; k <= nums[1]; k++) out[k] = 1; }
    else nums.forEach(function(n){ out[n] = 1; });
  }
  re = /\b(XII|XI)\b/g;
  while ((m = re.exec(t))) out[ROMAN[m[1]]] = 1;
  re = /\b(1[0-2]|[1-9])\s*(?:th|st|nd|rd)\b/gi;
  while ((m = re.exec(t))) out[+m[1]] = 1;
  return Object.keys(out).map(Number).sort(function(a, b){ return a - b; });
}
function noticeClass(x){
  var c = noticeClasses(x);
  if (!c.length) return "CBSE";
  return c.length === 1 ? "Class " + c[0] : "Class " + c.slice(0, -1).join(", ") + " and " + c[c.length - 1];
}
function clsLabel(){ return ST.cls ? "Class " + ST.cls : "Class 11 and 12"; }

/* ---------- views ---------- */
var VIEWS = {};
var TITLES = {home:"GraphPaper: CBSE notices, NCERT books and syllabus", welcome:"Welcome | GraphPaper", updates:"All updates | GraphPaper", notice:"Notice | GraphPaper", "class":"Study shelf | GraphPaper", books:"NCERT books | GraphPaper", booklist:"Book list | GraphPaper", syllabus:"Syllabus | GraphPaper", papers:"Papers | GraphPaper", qbank:"Question bank | GraphPaper", board:"Boards | GraphPaper", about:"About | GraphPaper", parents:"For parents | GraphPaper", contact:"Contact | GraphPaper", terms:"Terms | GraphPaper", privacy:"Privacy | GraphPaper"};

function pickerCard(){
  var sel = ST.wc, cb = "";
  var needS = hasStreams(ST.wc), sb = "";
  if (needS) STREAMS.forEach(function(v){ sb += '<button class="f fr" data-act="ws" data-v="' + v + '" aria-pressed="' + (ST.ws === v ? "true" : "false") + '" style="font-weight:600;font-size:19px;min-height:56px;padding:6px 10px">' + v + '</button>'; });
  var cbP = "";
  for (var i = 1; i <= 12; i++) { var one = '<button class="f fr" data-act="wc" data-v="' + i + '" aria-pressed="' + (sel === String(i) ? "true" : "false") + '" style="font-weight:600;font-size:22px;min-height:56px;padding:6px">' + i + '</button>'; if (i <= 8) cbP += one; else cb += one; }
  function bd(n, c, state, note){
    return '<button class="f fr" ' + (state === "on" ? 'aria-pressed="true"' : 'disabled aria-disabled="true"') + ' style="background:var(' + c + ');color:var(--ink);font-weight:500;font-size:20px;min-height:72px;border-radius:24px;padding:8px">' + n + (note ? '<span style="display:block;font-family:Nunito,sans-serif;font-weight:700;font-size:12px">' + note + '</span>' : '') + '</button>';
  }
  function step(n, id, t){ return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><span class="fr" style="flex:none;width:34px;height:34px;border-radius:50%;background:var(--a1);border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:17px">' + n + '</span><div id="' + id + '" class="fr" style="font-weight:600;font-size:22px">' + t + '</div></div>'; }
  return '<div style="background:var(--card);border:2px solid var(--ink);border-radius:32px;padding:28px 24px;text-align:left;display:flex;flex-direction:column;gap:22px;box-shadow:0 6px 0 var(--a1)">' +
   '<div>' + step(1, "wh1", "Your class") + '<div role="group" aria-labelledby="wh1">' +
   '<div class="fr" style="font-weight:600;font-size:17px;margin:0 0 8px">Parent of a child in Class 1 to 8</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">' + cbP + '</div>' +
   '<div class="fr" style="font-weight:600;font-size:17px;margin:0 0 8px">Student in Class 9 to 12</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' + cb + '</div></div>' +
   '<div style="font-size:14px;color:var(--mut);margin-top:12px">Colors grow up with you, from candy pastels to calm, deep tones.</div></div>' +
   (needS ? '<div>' + step(2, "wh3", "Your stream") + '<div role="group" aria-labelledby="wh3" class="wst">' + sb + '</div>' +
   '<div style="font-size:14px;color:var(--mut);margin-top:12px">Books, syllabus, papers and question banks will show your stream\u2019s subjects first. You can change this any time.</div></div>' : '') +
   '<div style="font-size:14px;color:var(--mut)">Books and CBSE notices are live for Class 1 to 12, and the syllabus for Class 9 to 12.</div>' +
   '<div id="werr" role="alert" hidden style="background:var(--a2);border:2px solid var(--ink);border-radius:16px;padding:10px 16px;font-weight:700">Please pick your class first.</div>' +
   '<button class="btn dark" data-act="wgo" style="min-height:56px;font-size:19px;padding:14px 32px">Take me in</button></div>';
}

VIEWS.welcome = function(){
  return '<div style="position:relative;max-width:720px;margin:0 auto;padding:40px 24px 64px;text-align:center">' +
   '<div style="position:absolute;top:24px;right:12px;width:90px;height:90px;border-radius:50%;background:var(--a4);pointer-events:none"></div>' +
   '<div style="position:absolute;top:150px;left:8px;width:64px;height:64px;border-radius:22px;background:var(--a3);transform:rotate(14deg);pointer-events:none"></div>' +
   '<div style="position:relative"><img src="/logo-96.png" width="72" height="72" alt="" style="border-radius:20px">' +
   '<div class="fr" style="font-weight:600;font-size:28px;margin:8px 0 28px">GraphPaper</div>' +
   '<h1 style="font-size:clamp(34px,7vw,56px);margin-bottom:12px">Hi there! Which class are you in?</h1>' +
   '<p style="margin:0 auto 32px;color:var(--mut);max-width:460px">Pick your class and, for Class 11 and 12, your stream, and we’ll set up your page.</p>' +
   pickerCard() +
   '<div style="margin-top:20px"><a href="#/home" style="font-weight:700;text-decoration:underline">Skip for now</a></div></div></div>';
};

VIEWS.booklist = function(){
  var c = ST.cls || "4", n = +c, cn = clsName(c);
  var crumb = '<div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>Book list</b></div>';
  var body;
  if (!ST.booksLoaded) body = '<div class="card" style="--sh:var(--a1)">Loading books...</div>';
  else {
    var fl = classSubs(c).slice(), nb = 0, nc = 0;
    if (hasStreams(c)){ var od = FOLD12S[(ST.stream || "Science").charAt(0)]; fl.sort(function(a, b){ var x = od.indexOf(a), y = od.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); }); }
    body = fl.map(function(f, i){
      var bks = classBooks(c).filter(function(b){ return foldOf(b) === f && streamOk(b); });
      if (+c === 10) bks.sort(function(x, y){ return ORDER10.indexOf(x.code) - ORDER10.indexOf(y.code); });
      if (!bks.length) return "";
      return '<section class="card" style="--sh:var(' + subCol(f) + ');gap:6px;padding:22px 24px"><h2 style="font-size:24px;margin:0 0 6px">' + esc(f) + '</h2>' + bks.map(function(b){
        nb++; nc += b.ch.length;
        var titles = b.ch.map(function(h){ return h[1]; }).filter(Boolean);
        var outline = titles.length === b.ch.length ? '<div class="bko">' + titles.map(esc).join(' \u00b7 ') + '</div>' : '';
        return '<div class="bkrow"><div class="bkmain"><div class="bkt">' + esc(b.title) + '</div><div class="bkm"><span>' + esc(b.code) + '</span><span>' + b.ch.length + ' ' + b.label.toLowerCase() + (b.ch.length === 1 ? '' : 's') + '</span></div>' + outline + '<div class="noprint bka">' + (b.zip ? '<a class="fpill dl" href="' + BBASE + b.zip + '" target="_blank" rel="noopener">Whole book ZIP' + (b.mb ? ' \u00b7 ' + b.mb + ' MB' : '') + '</a>' : '') + '<a class="fpill alt" href="#/books">Chapters</a></div></div></div>';
      }).join("") + '</section>';
    }).join("");
    body = '<div class="meta" style="margin-bottom:16px">' + nb + ' books \u00b7 ' + nc + ' chapters.</div><div style="display:flex;flex-direction:column;gap:22px">' + body + '</div>';
  }
  return '<div class="wrap sec" style="max-width:860px">' + crumb + '<div class="head"><div class="tile" style="background:var(--a1)">' + ico("list", 30) + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Book list</h1><p>Every NCERT textbook for ' + cn + ', in one list. English-medium books plus the Hindi and Sanskrit language books.</p></div></div>' +
   '<div class="noprint" style="margin-bottom:20px"><button class="btn dark" type="button" data-act="print">Print this list</button></div>' + body +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">Your school may use other books as well, so check its list.</p></div>';
};
VIEWS.notfound = function(){
  return '<div class="wrap sec" style="padding-bottom:64px"><div class="crumb"><a href="#/home">Home</a> / <b>Not found</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(30px,5vw,48px)">Page not found</h1><p style="color:var(--mut)">That page does not exist. <a href="#/home" style="text-decoration:underline;font-weight:700">Go to the home page</a> or <a href="#/updates" style="text-decoration:underline;font-weight:700">see all updates</a>.</p></div>';
};
function featCard(bg, icon, title, text, href){
  return '<a href="' + href + '" style="background:var(--card);border-radius:28px;padding:26px;display:block"><div class="sq" style="width:52px;height:52px;border-radius:16px;background:var(' + bg + ');margin-bottom:14px">' + ico(icon, 26) + '</div><h3 style="font-size:21px;margin:0 0 6px">' + title + '</h3><div style="color:var(--mut)">' + text + '</div></a>';
}
function howStep(n, title, text){
  return '<div style="display:flex;gap:14px;align-items:flex-start"><span class="fr" style="flex:none;width:40px;height:40px;border-radius:50%;background:var(--a1);border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:19px">' + n + '</span><div><div class="fr" style="font-weight:600;font-size:21px;margin-bottom:2px">' + title + '</div><div style="color:var(--mut)">' + text + '</div></div></div>';
}
function landing(){
  var latest = ST.items.slice(0, 3);
  return '<div class="wrap hr" style="align-items:start"><div>' +
    '<h1 id="pg" tabindex="-1" style="font-size:clamp(38px,6vw,64px);line-height:1.08;margin:0 0 16px">Your school year, all in one cozy place.</h1>' +
    '<p style="color:var(--mut);margin:0 0 22px;max-width:520px;font-size:18px">NCERT books, the syllabus and official notices, sorted for your class. Free, with no sign-up.</p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px;font-weight:700;font-size:15px"><span class="pill" style="background:var(--a1);padding:6px 14px">Parents: Class 1 to 8</span><span class="pill" style="background:var(--a3);padding:6px 14px">Students: Class 9 to 12</span><span class="pill" style="background:var(--a4);padding:6px 14px">Official sources only</span><span class="pill" style="background:var(--a5);padding:6px 14px">Free</span></div>' +
    '<p style="margin:24px 0 0"><a href="#/updates" style="font-weight:700;text-decoration:underline">Just browsing? See the latest CBSE updates</a></p></div>' +
    '<div id="boards" style="scroll-margin-top:16px"><div class="fr" style="font-weight:600;font-size:26px;margin:0 0 12px">Let\u2019s set up your page</div>' + pickerCard() + '</div></div>' +
    '<div class="wrap sec"><h2 style="font-size:34px;margin:0 0 8px">What you\u2019ll find here</h2><p style="margin:0 0 24px;color:var(--mut);max-width:560px">Everything links to the official CBSE and NCERT websites. We never host the files ourselves.</p>' +
    '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))">' +
    featCard("--a1", "news", "Official updates", "CBSE circulars, date sheets and results, newest first. Most useful from Class 9.", "#/updates") +
    featCard("--a3", "book", "NCERT books", "Class 1 to 12, chapter by chapter, with a whole-book download and a printable book list. Pick your class to start.", "#/home?s=boards") +
    featCard("--a2", "doc", "Syllabus and papers", "The official 2026-27 syllabus, sample papers and question banks where CBSE publishes them. Pick your class to start.", "#/home?s=boards") +
    featCard("--a4", "notes", "For parents", "Plain answers on school stages, exams and report cards, for Classes 1 to 8 and beyond.", "#/parents") +
    '</div></div>' +
    '<div style="background:var(--shelf);padding:56px 0"><div class="wrap"><h2 style="font-size:34px;margin:0 0 24px">How it works</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:24px">' +
    howStep(1, "Pick your class", "Choose your class, and your stream for Class 11 and 12. It is remembered on your device, so there is no account to make.") +
    howStep(2, "Get your page", "Books, syllabus, papers and notices show up for your class and stream, with the rest tucked away.") +
    howStep(3, "Open the official source", "Every link goes straight to CBSE or NCERT, so what you read is what the board published.") +
    '</div></div></div>' +
    (latest.length ? '<div class="wrap sec" style="padding-bottom:64px"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px"><h2 style="font-size:34px;margin:0">Fresh from CBSE</h2><a class="btn dark" href="#/updates" style="display:inline-flex;padding:12px 26px">See all updates</a></div><div class="grid g3">' + latest.map(function(x){ return noticeCard(x); }).join("") + '</div></div>' : '');
}
VIEWS.home = function(){ return ST.cls ? homeReturning() : landing(); };
function shelfCard(bg, icon, title, text, href){
  var inner = '<div class="sq" style="width:56px;height:56px;border-radius:18px;background:var(' + bg + ');margin-bottom:16px">' + ico(icon, 28) + '</div><h3 style="font-size:22px;margin:0 0 6px">' + title + '</h3><div style="color:var(--mut)">' + text + '</div>';
  return href ? '<a href="' + href + '" style="background:var(--card);border-radius:28px;padding:28px;display:block">' + inner + '</a>' : '<div style="background:var(--card);border-radius:28px;padding:28px">' + inner + '</div>';
}
function homeShelf(c){
  var n = +c, hi = n >= 11, tag = (hi ? ' ' + ST.stream : '');
  var cards = shelfCard("--a3", "book", "NCERT books", n <= 8 ? "Every book for Class " + c + ", chapter by chapter" : "Class " + c + tag + ", subject by subject", "#/books") +
    shelfCard("--a1", "doc", "Book list", "A printable list with chapter titles", "#/booklist");
  if (n <= 8) cards += shelfCard("--a4", "news", "For parents", "How school stages, exams and report cards work", "#/parents");
  if (n >= 9) cards += shelfCard("--a2", "doc", "Syllabus", "Official 2026-27 syllabus for Class " + c, "#/syllabus");
  if (n === 10 || n === 12) cards += shelfCard("--a4", "doc", "Papers", "CBSE sample papers and past board papers", "#/papers");
  if (n >= 6) cards += shelfCard("--a2", "doc", "Question bank", "Practice questions and NCERT Exemplar problems", "#/qbank");
  return '<div id="shelf" style="background:var(--shelf);padding:64px 0"><div class="wrap"><h2 style="font-size:34px;margin:0 0 8px">Your study shelf</h2><p style="margin:0 0 28px;color:var(--mut);max-width:560px">Everything for Class ' + c + tag + ', in one place.</p><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))">' + cards + '</div></div></div>';
}
function homeCopy(c){
  var n = +c, hi = n >= 11;
  if (n <= 5) return {h: "Your child’s Class " + c + ", made simple. One cozy place.", p: "Every NCERT book chapter by chapter, a printable book list, and plain answers about how school works."};
  if (n <= 8) return {h: "Class " + c + ", made simple for you and your child. One cozy place.", p: "Every NCERT book chapter by chapter, a printable book list, and plain answers about exams and report cards."};
  var parts = ["NCERT books", "the official syllabus"];
  if (n === 10 || n === 12) parts.push("sample papers");
  parts.push("a question bank", "and the latest CBSE updates");
  return {h: "Class " + c + (hi ? " " + ST.stream : "") + ", all in one cozy place.", p: parts.slice(0, -1).join(", ") + " " + parts[parts.length - 1] + "."};
}
var SUBJ = {
  a:["English","Hindi","Mathematics","EVS","Art"], b:["English","Hindi","Mathematics","Science","Social Science","Sanskrit"], c:["English","Hindi","Mathematics","Science","Social Science"],
  Science:["Physics","Chemistry","Mathematics","Biology","English"], Commerce:["Accountancy","Business Studies","Economics","Mathematics","English"], Humanities:["History","Political Science","Geography","Psychology","English"]
};
function sbk(c, st){ var l = st.charAt(0), n = 0, ch = 0; classBooks(c).forEach(function(b){ if (!b.st || b.st.indexOf(l) > -1){ n++; ch += b.ch.length; } }); return n ? n + " NCERT books, " + ch + " chapters" : ""; }
VIEWS.streams = function(r){
  var c = r.cls, info = {Science: "Physics, Chemistry, Mathematics, Biology and more", Commerce: "Accountancy, Business Studies, Economics and more", Humanities: "History, Political Science, Geography, Psychology and more"}, cols = {Science: "--a3", Commerce: "--a4", Humanities: "--a2"};
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Class ' + c + '</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a1)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">CBSE Class ' + c + ': choose your stream</h1><p>Class ' + c + ' splits into Science, Commerce and Humanities, and each stream has its own subjects, NCERT books' + (+c === 12 ? ', sample papers' : '') + ' and question banks. Pick yours and GraphPaper keeps the page for that stream, so you only see what applies to you. English and Hindi are common to every stream, and the syllabus for Classes 11 and 12 is published by CBSE as one document.</p></div></div>' +
   '<div class="grid g3" style="margin-bottom:48px">' + ["Science", "Commerce", "Humanities"].map(function(st){
     return '<a class="card" href="/class-' + c + '/' + st.toLowerCase() + '" style="--sh:var(' + cols[st] + ')"><h3 style="font-size:24px">Class ' + c + ' ' + st + '</h3><div class="meta">' + info[st] + '</div><div class="meta">' + sbk(c, st) + '</div><span class="more">Open \u2192</span></a>';
   }).join("") + '</div></div>';
};
VIEWS["class"] = function(){
  var c = ST.cls || "4", n = +c, hi = n >= 11;
  if (n >= 9) return studentShelf(c);
  var subs, cols = ["--a1","--a2","--a3","--a4","--a5"], s2b = {Physics:"Physics", Chemistry:"Chemistry", Mathematics:"Maths", Biology:"Biology"};
  function card(label, href, icon, col, note){
    var inner = '<span class="ic" style="background:var(' + col + ')">' + icon + '</span><b>' + esc(label) + '</b><span style="color:var(--mut);font-size:15px">' + note + '</span>' + (href ? '<span style="font-weight:700">Open →</span>' : '');
    return href ? '<a class="bq" href="' + href + '" style="--sh:var(' + col + ')">' + inner + '</a>' : '<div class="bq" style="--sh:var(' + col + ')">' + inner + '</div>';
  }
  var nb = classBooks(c).filter(streamOk).length;
  var desc = 'Chapter-wise PDFs for ' + (nb ? 'all ' + nb + ' books of ' : '') + 'Class ' + c + (hasStreams(n) ? ' ' + ST.stream : '') + ', linked from the official NCERT site' + (hasFolders(c) ? ', plus a whole-book download for each.' : '.');
  subs = card("NCERT books", !nb && ST.booksLoaded ? "" : '#/books', ico("book"), "--a3", desc);
  var streams = hi ? '<a href="#/welcome" class="pill" style="background:var(--a3);padding:6px 16px;font-size:15px">' + ST.stream + ' \u00b7 Change</a>' : '';
  var more0 = card("Book list", nb ? '#/booklist' : "", ico("doc"), "--a1", 'A printable list of every NCERT book for Class ' + c + (hi ? ' ' + ST.stream : '') + ', with its chapter titles.');
  function lk(t, h, col, d){ return '<a class="card" href="' + h + '" style="--sh:var(' + col + ')"><h3 style="font-size:22px">' + t + '</h3><div class="meta">' + d + '</div><span class="more">Open \u2192</span></a>'; }
  var more = "";
  if (n <= 8) more += lk("For parents", "#/parents", "--a5", "How school stages, exams, holding back and report cards work, from official documents.");
  if (n >= 9) more += lk("Syllabus", "#/syllabus", "--a3", 'Official 2026-27 CBSE syllabus for every subject of Class ' + c + (hi ? ' (one PDF covers Class 11 and 12)' : '') + '.');
  if (n === 10 || n === 12) more += lk("Sample papers 2026-27", "#/sqp", "--a4", "Official CBSE sample papers with marking schemes for Class " + c + ", subject by subject.") + lk("Previous year papers", "#/pyq", "--a5", "Past board exam question papers for Class " + c + ", year by year, with the second exam where CBSE held one.");
  if (n >= 9) more += lk("Calculator", "#/calculator", "--a1", "Marks to percentage, and CGPA to percentage by CBSE's own rule.");
  if (n >= 6) more += lk("Question bank", "#/qbank", "--a2", n === 10 || n === 12 ? 'CBSE\'s official question bank and practice questions with marking schemes, plus NCERT Exemplar problems.' : n === 11 ? 'NCERT Exemplar problems for Maths, Physics, Chemistry and Biology.' : 'CBSE competency-based questions and NCERT Exemplar problems.');
  var subj = n >= 9 ? subjectFolds(c, true) : [];
  var bySub = subj.length ? '<h2>By subject</h2><div class="grid g4" style="margin-bottom:48px">' + subj.map(function(f){
    var cnt = 0; classBooks(c).forEach(function(b){ if (foldOf(b) === f && streamOk(b)) cnt += b.ch.length; });
    return '<a class="card sm" href="#/subject/' + slug(f) + '" style="--sh:var(' + subCol(f) + ')"><h3>' + esc(f) + '</h3><div class="meta">' + cnt + ' chapters' + (subProg(c, f, true).d ? ', ' + subProg(c, f, true).d + ' done' : ', syllabus and practice') + '</div><span class="more">Open \u2192</span></a>';
  }).join("") + '</div>' : "";
  var mine = ST.items.filter(function(x){ return classOf(x, c); }).slice(0, 3);
  var latest = '<h2>Latest for Class ' + c + '</h2><div class="grid g3">' + (mine.length ? mine.map(function(x){ return noticeCard(x, true); }).join("") : '<div class="card" style="grid-column:1/-1;box-shadow:0 6px 0 var(--a1)">' + (ST.loaded ? (n <= 8 ? 'CBSE rarely sends notices meant for Classes 1 to 8. <a href="#/updates" style="font-weight:700;text-decoration:underline">See all CBSE updates</a> or read the <a href="#/parents" style="font-weight:700;text-decoration:underline">guide for parents</a>.' : 'No notices that mention Class ' + c + ' yet. <a href="#/updates" style="font-weight:700;text-decoration:underline">See all CBSE updates</a>.') : 'Loading notices...') + '</div>') + '</div>';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Study shelf</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a1)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">' + (n >= 9 ? 'CBSE ' : '') + 'Class ' + c + (hi ? ' ' + ST.stream : '') + (n >= 9 ? ' for 2026-27' : '') + '</h1><p>' + (n >= 9 ? esc(classIntro(n, c)) : 'Every NCERT book for Class ' + c + ', chapter by chapter, with a printable book list.') + ' <a href="#/welcome" style="font-weight:700;text-decoration:underline">Change class' + (hi ? ' or stream' : '') + '</a></p></div></div>' +
   '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px"><h2 style="margin:0">NCERT books</h2>' + streams + '</div>' +
   '<div class="grid g3" style="margin-bottom:48px">' + subs + more0 + '</div>' + bySub +
   '<h2>More for Class ' + c + (hi ? ' ' + ST.stream : '') + '</h2><div class="grid g3" style="margin-bottom:48px">' + more + '</div>' +
   (n <= 8 ? '' : latest) + '</div>';
};

function classIntro(n, c){
  var sj = {Science:"Physics, Chemistry, Mathematics and Biology", Commerce:"Accountancy, Business Studies and Economics", Humanities:"History, Political Science, Geography and more"}[ST.stream] || "";
  var T = {
    9: "Class 9 is the first year of CBSE\u2019s secondary stage and the base for your Class 10 board exams. Your school sets the exams this year, so the NCERT books and the official 2026-27 syllabus are the best guide to what to study. Start with the chapter lists below, then use the question bank for practice.",
    10: "Class 10 ends with CBSE\u2019s first board exam. In most subjects the final marks combine a board paper with internal assessment from your school. Everything for it is here in one place: the official 2026-27 syllabus, sample papers with marking schemes, previous years\u2019 board papers, every NCERT book and the latest CBSE notices that mention Class 10.",
    11: "Class 11 " + ST.stream + " is the first year of a two-year course: your school sets this year\u2019s exams, but these chapters carry into the Class 12 board exam and into entrance tests. " + (sj ? "This page follows " + sj + ". " : "") + "CBSE publishes one syllabus PDF for Class 11 and 12 together, so the syllabus link below covers both years.",
    12: "Class 12 " + ST.stream + " ends with CBSE\u2019s second board exam, and its result matters for college admission. " + (sj ? "This page follows " + sj + ". " : "") + "Find the official 2026-27 syllabus, sample papers with marking schemes, previous years\u2019 board papers, every NCERT book and the latest notices that mention Class 12."
  };
  return T[n] || "";
}
var SUBCOL = {Physics:"--a1", Chemistry:"--a3", Maths:"--a4", Biology:"--a2", Mathematics:"--a4", Science:"--a3", English:"--a1", "Social Science":"--a2", "Environmental Studies":"--a3", Arts:"--a5", "Physical Education":"--a1", "Vocational Education":"--a5", "Skill Education":"--a5", Hindi:"--a4", Sanskrit:"--a5", Urdu:"--a4", "Other books":"--a5", Accountancy:"--a3", "Business Studies":"--a1", Economics:"--a4", History:"--a2", Geography:"--a3", "Political Science":"--a1", Sociology:"--a5", Psychology:"--a2"};
var SUBICON = {Physics:"Physics", Chemistry:"Chemistry", Maths:"Maths", Biology:"Biology", Mathematics:"Maths", Science:"Biology"};
function subCol(s){ return SUBCOL[s] || "--a1"; }
function subIcon(s){ return ico(SUBICON[s] || "book", 24); }
function classBooks(c){ return BOOKS.filter(function(b){ return b.cls === +c; }); }
var FOLD8 = ["English", "Hindi", "Sanskrit", "Mathematics", "Environmental Studies", "Science", "Social Science", "Arts", "Physical Education", "Vocational Education", "Other books"];
var FOLD10 = ["English", "Hindi", "Mathematics", "Science", "Social Science", "Other books"];
var FOLD12 = ["Physics", "Chemistry", "Mathematics", "Biology", "Accountancy", "Business Studies", "Economics", "History", "Geography", "Political Science", "Sociology", "Psychology", "English", "Hindi", "Other books"];
var FOLD12S = {
  S: ["Physics", "Chemistry", "Mathematics", "Biology", "Psychology", "English", "Hindi", "Other books"],
  C: ["Accountancy", "Business Studies", "Economics", "Mathematics", "English", "Hindi", "Other books"],
  H: ["History", "Geography", "Political Science", "Sociology", "Economics", "Psychology", "English", "Hindi", "Other books"]
};
var STREAMS = ["Science", "Commerce", "Humanities"];
function streamOk(b){ return !b.st || b.st.indexOf((ST.stream || "Science").charAt(0)) > -1; }
var SLANG = /^(english|hindi|sanskrit)/i;
var SSUB = {
  Science: /^(physics|chemistry|biology|biotechnology|mathematics|applied math|computer science|informatics|physical education|psychology|engg?(ineering)?\.? graphic)/i,
  Commerce: /^(accountancy|bus{1,2}iness studies|economics|mathematics|applied math|entrepreneurship|computer science|informatics|physical education|legal studies)/i,
  Humanities: /^(history|geography|pol\w*ical science|sociology|psychology|economics|legal studies|home science|knowledge trad|mathematics|applied math|computer science|informatics|physical education)/i
};
function inStream(name){ return !hasStreams(ST.cls) || SLANG.test(name) || SSUB[ST.stream || "Science"].test(name); }
function otherBlk(html, n){
  return '<details class="qo" style="grid-column:1/-1;margin-top:14px"' + ((ST.qq || ST.pq || ST.sq || "").trim() ? ' open' : '') + '><summary style="cursor:pointer;font-weight:700;padding:8px 0">Other subjects' + (n ? ' (' + n + ')' : '') + '</summary>' + html + '</details>';
}
function folderStream(c, f){
  var o = ""; classBooks(c).forEach(function(b){ if (foldOf(b) === f && b.st) o += b.st; });
  return o;
}
function hasFolders(c){ return +c >= 1; }
function hasStreams(c){ return +c === 11 || +c === 12; }
function foldOf(b){ return b.fold || b.sub; }
function classSubs(c){
  var o = []; classBooks(c).forEach(function(b){ var k = foldOf(b); if (o.indexOf(k) < 0) o.push(k); });
  if (+c === 9 || +c === 10) o.sort(function(a, b){ return FOLD10.indexOf(a) - FOLD10.indexOf(b); });
  if (hasStreams(c)) o.sort(function(a, b){ return FOLD12.indexOf(a) - FOLD12.indexOf(b); });
  if (+c < 9) o.sort(function(a, b){ var x = FOLD8.indexOf(a), y = FOLD8.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
  return o;
}
var ORDER10 = ["jeff1","jefp1","jhks1","jhkr1","jhsp1","jhsy1","jemh1","jesc1","jess3","jess4","jess2","jess1","jehp1","jhsk1","jhva1","june1","juge1","jujp1","judp1","jusr1","juuq1"];
function pdfUrl(b, f){ return BBASE + (typeof f === "string" ? f : b.code + (f < 10 ? "0" : "") + f + ".pdf"); }
var DONE = {};
try { DONE = JSON.parse(localStorage.getItem("gp-done") || "{}") || {}; } catch(e){ DONE = {}; }
function dk(b, h){ return b.code + ":" + h[0]; }
function saveDone(){ try { localStorage.setItem("gp-done", JSON.stringify(DONE)); } catch(e){} }
function bookByCode(code){ var r = null; BOOKS.forEach(function(b){ if (b.code === code) r = b; }); return r; }
function tickBtn(k, lbl){
  return '<button class="tick" type="button" data-act="tick" data-k="' + esc(k) + '" aria-pressed="' + (DONE[k] ? "true" : "false") + '" aria-label="' + esc(lbl) + '"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
}
function subProg(c, f, byStream){
  var t = 0, d = 0;
  classBooks(c).forEach(function(b){ if (foldOf(b) === f && (!byStream || streamOk(b))) b.ch.forEach(function(h){ t++; if (DONE[dk(b, h)]) d++; }); });
  return {t: t, d: d};
}
function progInner(c, f){
  var p = subProg(c, f, false), pc = p.t ? Math.round(p.d * 100 / p.t) : 0;
  return '<b>Your progress</b><div class="pbar" role="progressbar" aria-label="Chapters done" aria-valuemin="0" aria-valuemax="' + p.t + '" aria-valuenow="' + p.d + '"><i style="width:' + pc + '%"></i></div><span>' + p.d + ' of ' + p.t + ' chapters done</span>' +
    (p.d ? '<button class="btn" type="button" data-act="resetprog" data-c="' + c + '" data-f="' + esc(f) + '" style="align-self:flex-start;padding:8px 18px;font-size:15px">Clear my ticks</button>' : '');
}
function refreshProg(){
  D.querySelectorAll("[data-prog]").forEach(function(x){
    if (x.dataset.prog === "sub") x.innerHTML = progInner(x.dataset.c, x.dataset.f);
    else { var b = bookByCode(x.dataset.code); if (b){ var d = 0; b.ch.forEach(function(h){ if (DONE[dk(b, h)]) d++; }); x.textContent = d + " of " + b.ch.length + " chapters of this book done"; } }
  });
}
function chapPath(b, num){
  var ts = "", i;
  b.ch.forEach(function(h){ if (h[0] === num && h[1]) ts = slug(h[1]).slice(0, 60).replace(/-+$/, ""); });
  return "/class-" + b.cls + "/" + slug(foldOf(b)) + "/" + b.code + "-" + num + (ts ? "-" + ts : "");
}
function chRows(b, chs){
  var tk = b.cls >= 9;
  return chs.map(function(h){
    var file = h[2], lbl = tk ? '<a class="no" href="#/chapter/' + b.code + '-' + h[0] + '">' + b.label + ' ' + h[0] + '</a>' : '<span class="no">' + b.label + ' ' + h[0] + '</span>';
    var tb = tk ? tickBtn(dk(b, h), "Mark " + b.label + " " + h[0] + " as done") : "";
    if (file) return '<div class="chr' + (tk ? ' tk' : '') + '">' + tb + lbl + '<a class="tt" style="font-weight:700" href="' + pdfUrl(b, file) + '" target="_blank" rel="noopener">' + esc(h[1] || "Open chapter PDF") + '</a><span aria-hidden="true">↗</span></div>';
    return '<div class="chr na' + (tk ? ' tk' : '') + '">' + tb + lbl + '<span class="tt">' + esc(h[1] || "") + '</span><span></span><small>PDF not found. Open the book on the NCERT site.</small></div>';
  }).join("");
}
function extraRows(b){
  return (b.extra || []).map(function(x){
    return '<div class="chr"><span class="no">Extra</span><a class="tt" style="font-weight:700" href="' + BBASE + x[1] + '" target="_blank" rel="noopener">' + esc(x[0]) + '</a><span aria-hidden="true">↗</span></div>';
  }).join("");
}
function zipBtn(b){
  return b.zip ? '<a class="btn dark" href="' + BBASE + b.zip + '" target="_blank" rel="noopener" style="margin-top:12px">Whole book (ZIP' + (b.mb ? ', ' + b.mb + ' MB' : '') + ') ↓</a>' : '';
}
function bookBlock(b, chs, q, label, op){
  var col = subCol(b.sub), nm = label || (b.sub === b.title ? b.sub : b.sub + ": " + b.title);
  return '<details class="book" style="--sh:var(' + col + ')"' + (q || op || ST.bopen[b.code] ? ' open' : '') + ' data-code="' + b.code + '"><summary><span class="bi" style="background:var(' + col + ')">' + subIcon(b.sub) + '</span><span class="bt"><b>' + (b.cls <= 10 || b.fold ? esc(nm) : 'Class ' + b.cls + ' ' + esc(b.title)) + '</b><span>' + chs.length + ' chapter' + (chs.length === 1 ? '' : 's') + (q ? ' match' : '') + '</span></span><svg class="car" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="chs">' + chRows(b, chs) + (q ? '' : extraRows(b)) +
    (b.zip ? zipBtn(b) : '<a class="btn" href="' + BPORTAL + '" target="_blank" rel="noopener" style="margin-top:12px">Open NCERT textbook page ↗</a>') + '</div></details>';
}
function matchCh(b, q){
  return b.ch.filter(function(h){ return !q || ((h[1] || "") + " " + b.label + " " + h[0] + " " + b.title + " " + (b.short || "") + " " + b.sub + " " + foldOf(b)).toLowerCase().indexOf(q) !== -1; });
}
function foldersHtml(q, c){
  var out = "", n = 0;
  var fl = classSubs(c).slice();
  if (hasStreams(c)){ var od = FOLD12S[(ST.stream || "Science").charAt(0)]; fl.sort(function(a, b){ var x = od.indexOf(a), y = od.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); }); }
  fl.forEach(function(f){
    var bks = classBooks(c).filter(function(b){ return foldOf(b) === f && streamOk(b); });
    if (+c === 10) bks.sort(function(x, y){ return ORDER10.indexOf(x.code) - ORDER10.indexOf(y.code); });
    var shown = [], total = 0;
    bks.forEach(function(b){ var chs = matchCh(b, q); if (chs.length){ shown.push([b, chs]); total += chs.length; } });
    if (!shown.length) return;
    n++;
    var col = subCol(f), open = q || ST.bfold[f] || ST.bsub === f, inner;
    if (shown.length === 1 && bks.length === 1) {
      var b = shown[0][0], chs = shown[0][1];
      inner = '<div class="chs" style="border-top:0">' + chRows(b, chs) + (q ? '' : extraRows(b)) + zipBtn(b) + '</div>';
    } else {
      inner = '<div class="fin">' + shown.map(function(x){ return bookBlock(x[0], x[1], q, x[0].short || x[0].title); }).join("") + '</div>';
    }
    out += '<details class="book folder" style="--sh:var(' + col + ')"' + (open ? ' open' : '') + ' data-fold="' + esc(f) + '"><summary><span class="bi" style="background:var(' + col + ')">' + subIcon(f) + '</span><span class="bt"><b>' + esc(f) + '</b><span>' + (bks.length > 1 ? bks.length + ' books · ' : '') + total + ' chapter' + (total === 1 ? '' : 's') + (q ? ' match' : '') + '</span></span><svg class="car" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>' + inner + '</details>';
  });
  return {n:n, html: out};
}
function booksHtml(){
  var c = +bcls(), q = ST.bq.trim().toLowerCase(), out = "", n = 0;
  if (hasFolders(c)) {
    var r = foldersHtml(q, c); out = r.html; n = r.n;
  } else {
    BOOKS.forEach(function(b){
      if (b.cls !== c || (ST.bsub !== "All" && b.sub !== ST.bsub)) return;
      var chs = matchCh(b, q);
      if (!chs.length) return;
      n++;
      out += bookBlock(b, chs, q);
    });
  }
  return {n:n, html: out || '<div class="card" style="box-shadow:0 6px 0 var(--a1)">' + (ST.booksLoaded ? 'No books found.' : 'Loading books...') + '</div>'};
}
ST.bopen = {}; ST.bfold = {};
function bcls(){ return /^(1[0-2]|[1-9])$/.test(ST.cls || "") ? ST.cls : "12"; }
VIEWS.books = function(r){
  var c = bcls(), subs = classSubs(c), s = r.q.get("sub"), f10 = hasFolders(c);
  if (s && subs.indexOf(s) > -1) ST.bsub = s;
  if (ST.bsub !== "All" && subs.indexOf(ST.bsub) < 0) ST.bsub = "All";
  var chips = hasStreams(c) ? '<div style="margin-bottom:20px"><a href="#/welcome" class="pill" style="background:var(--a3);padding:6px 16px;font-size:15px">Class ' + c + ' ' + ST.stream + ' \u00b7 Change</a></div>' : f10 ? "" : '<div class="chips" role="group" aria-label="Subject" style="margin-bottom:20px">' + ["All"].concat(subs).map(function(s){ return '<button class="f" data-act="bs" data-v="' + esc(s) + '" aria-pressed="' + (ST.bsub === s ? "true" : "false") + '">' + esc(s) + '</button>'; }).join("") + '</div>';
  var lead = f10 ? 'Open a subject folder, then pick a chapter. Each book also has a whole-book download from NCERT.' :
    'Chapter-wise PDFs for Class ' + c + ', linked from the official NCERT site. Chapter titles show where they could be read from the PDF.';
  var note = f10 ? 'NCERT offers each whole book as a ZIP of chapter PDFs, not as one single PDF.' + (hasStreams(c) ? ' Showing ' + ST.stream + ' books. Tap Change above to pick another stream. English-medium books only for now.' : '') : 'English-medium books only for now.';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>NCERT books</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a3)">' + ico("book", 30) + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">NCERT books</h1><p>' + lead + '</p></div></div>' +
   '<div class="search" style="max-width:560px;margin-bottom:16px"><label for="bq" style="position:absolute;left:-9999px">Search chapters</label><input id="bq" type="search" placeholder="Search chapters" value="' + esc(ST.bq) + '" autocomplete="off"></div>' + chips +
   '<div class="grid" id="blist" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));align-items:start">' + booksHtml().html + '</div>' +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">' + note + '</p></div>';
};

var CONTACT_EMAIL = "134556788854fgjgdtggft@gmail.com";
var ISSUES = "https://github.com/Runitdamar/graphpaper/issues/new";
function legal(title, lead, secs, upd){
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <b>' + title + '</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">' + title + '</h1>' +
   '<p style="margin:0 0 8px;color:var(--mut)">' + lead + '</p>' + (upd ? '<div class="meta" style="margin-bottom:24px">Last updated: ' + upd + '</div>' : '') + '<div style="display:flex;flex-direction:column;gap:22px">' +
   secs.map(function(p, i){ return '<section class="card" style="--sh:var(' + ["--a1","--a3","--a4","--a2"][i % 4] + ');gap:8px;padding:24px 26px"><h2 style="font-size:24px;margin:0">' + p[0] + '</h2><div>' + p[1] + '</div></section>'; }).join("") + '</div></div>';
}
VIEWS.contact = function(){
  var form = CONTACT_EMAIL ? '<form class="card" data-act="csend" style="--sh:var(--a1)">' +
    '<label for="cname" class="fr" style="font-weight:500">Your name</label><input id="cname" style="border:2px solid var(--ink);border-radius:16px;padding:12px;font-size:17px;background:var(--bg);color:var(--ink)">' +
    '<label for="ctopic" class="fr" style="font-weight:500">Topic</label><select id="ctopic" style="border:2px solid var(--ink);border-radius:16px;padding:12px;font-size:17px;background:var(--bg);color:var(--ink)"><option>General question</option><option>Report a wrong or missing notice</option><option>Suggest a feature</option><option>Something else</option></select>' +
    '<label for="cmsg" class="fr" style="font-weight:500">Message</label><textarea id="cmsg" rows="5" style="border:2px solid var(--ink);border-radius:16px;padding:12px;font-size:17px;background:var(--bg);color:var(--ink);font-family:inherit"></textarea>' +
    '<button class="btn dark" type="submit">Open in my email app</button><div class="meta">Or write to ' + esc(CONTACT_EMAIL) + '</div></form>'
    : '<section class="card" style="--sh:var(--a4)"><span class="pill" style="background:var(--a4);align-self:flex-start">Coming soon</span><h2 style="font-size:24px;margin:0">Message form</h2><div>The contact form is not switched on yet. For now, use the link on the right to report a wrong or missing notice.</div></section>';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Contact</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">Contact us</h1>' +
   '<p style="margin:0 0 28px;color:var(--mut);max-width:560px">Found a wrong notice or have an idea? Tell us.</p><div class="grid g3" style="align-items:start">' + form +
   '<section class="card" style="--sh:var(--a3)"><h2 style="font-size:24px;margin:0">Report a wrong or missing notice</h2><div>Open a report on GitHub (a free GitHub account is needed). Please include the notice title and what looks wrong.</div><a class="btn dark" href="' + ISSUES + '?title=' + encodeURIComponent("Notice problem: ") + '" target="_blank" rel="noopener">Open a report ↗</a></section></div></div>';
};
VIEWS.terms = function(){
  return legal("Terms", "The simple rules for using GraphPaper.", [
   ["Using GraphPaper", "GraphPaper is free to use. It gathers links to official notices, books and syllabus pages so they are easier to find."],
   ["Not an official website", "GraphPaper is not run by CBSE, NCERT or any other board. Notices and dates can change, so always confirm them at the official source before you act on them. Read the <a href=\"/disclaimer\" data-h=\"#/disclaimer\" style=\"font-weight:700;text-decoration:underline\">full disclaimer</a>."],
   ["Other people's files", "GraphPaper does not host board or NCERT files. Links open the official sites, which have their own terms."],
   ["No promises", "We try to keep things correct and current, but we cannot promise that nothing is missing or out of date. If you spot a mistake, please tell us from the Contact page."],
   ["Changes", "We may update these terms as GraphPaper grows. The latest version is always on this page."]]);
};

VIEWS.disclaimer = function(){
  return legal("Disclaimer", "What GraphPaper is, and what it is not.", [
   ["Not an official website", "GraphPaper is an independent website. It is not run by, connected to, or endorsed by CBSE, NCERT, the Ministry of Education or any other board or government body."],
   ["Always check the official source", "Notices, dates and rules can change or be corrected. The official notice on the board's own website always comes first. Please confirm anything important there, or with your school, before you act on it. Do not rely on GraphPaper alone for deadlines, forms or fees."],
   ["Links and files", "GraphPaper does not host board or NCERT files. Books, papers and notices open on the official websites, and they belong to their publishers. We do not control those websites, and a link can stop working when they move or remove a page."],
   ["Names and logos", "CBSE, NCERT and other names belong to their owners. They are used here only to say which board or books the information is about."],
   ["Accuracy", "Notices are checked automatically and the last-checked date is shown on the page. We work to keep everything correct and current, but mistakes and delays can happen, and we do not promise that nothing is missing or out of date."],
   ["Not advice", "GraphPaper gives general information for students and parents. It is not academic, legal or professional advice. For admissions, results, marks and other decisions, ask your school or the board."],
   ["Corrections and removal requests", "If something is wrong, or you own material linked here and want it changed or removed, tell us from the <a href=\"/contact\" data-h=\"#/contact\" style=\"font-weight:700;text-decoration:underline\">Contact page</a>. We will look at it quickly and fix or remove it."]], "25 October 2026");
};

VIEWS.about = function(){
  function sec(t, tx, sh){ return '<section class="card" style="--sh:' + sh + ';gap:8px;border-radius:28px;padding:24px 26px"><h2 style="font-size:24px;margin:0">' + t + '</h2><div>' + tx + '</div></section>'; }
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <b>About</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">About GraphPaper</h1>' +
   '<p style="margin:0 0 28px;color:var(--mut)">Books, syllabus and notices for your class, in one calm place.</p><div style="display:flex;flex-direction:column;gap:22px">' +
   sec("Our idea", "Students and parents should not have to hunt through several websites for a book, a syllabus or a circular. GraphPaper gathers the official material, sorts it by class, and links to the original so you read the real thing.", "var(--a1)") +
   sec("What you will find here", "<b>NCERT books:</b> every chapter PDF for Class 1 to 12, English-medium books plus the Hindi and Sanskrit language books, with chapter titles, a whole-book download and a printable book list.<br><b>Syllabus:</b> the official 2026-27 CBSE syllabus for Class 9 to 12.<br><b>Papers and question bank:</b> CBSE sample papers and past board papers for Class 10 and 12, and practice questions from Class 6.<br><b>Updates:</b> CBSE circulars, date sheets and results, plus a quick status check for Class 10 and 12.<br><b>For parents:</b> plain answers about school stages, exams and report cards, for Classes 1 to 8 and beyond.<br><b>Subject pages and progress:</b> every Class 9 to 12 subject has one page with its books, syllabus, papers and practice questions. Tick chapters as you finish them.<br><b>Calculator:</b> marks to percentage, and CGPA to percentage.", "var(--a3)") +
   sec("How it works", "Pick your class once, and your stream for Class 11 and 12. It is remembered on your device, so there is no account to make. Every link goes to the official CBSE or NCERT website. GraphPaper does not host the files.", "var(--a2)") +
   '<section style="background:var(--a4);border:2px solid var(--ink);border-radius:28px;padding:24px 26px;box-shadow:0 6px 0 var(--ink)"><h2 style="font-size:24px;margin:0 0 8px">Not an official website</h2><div>GraphPaper is not run by any board. Notices can change, so always check them at the official source before you act on them.</div></section>' +
   '</div></div>';
};
VIEWS.privacy = function(){
  function sec(t, tx){ return '<section class="card" style="--sh:var(--a1);gap:8px;padding:24px 26px"><h2 style="font-size:24px;margin:0">' + t + '</h2><div>' + tx + '</div></section>'; }
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <b>Privacy</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">Privacy</h1>' +
   '<p style="margin:0 0 28px;color:var(--mut)">Short version: GraphPaper does not ask for your name, email or phone number.</p><div style="display:flex;flex-direction:column;gap:22px">' +
   sec("What stays on your device", "There are no accounts and no forms that collect your details. The class you pick, and the chapters you tick as done, are saved in your own browser so the site can remember them. They are never sent to us.") +
   sec("What other services see", "The site is hosted on Vercel, which may keep standard technical logs such as IP addresses. Fonts load from Google Fonts. Links to cbse.gov.in, ncert.nic.in and cbseacademic.nic.in leave this site, and those sites have their own privacy practices.") +
   sec("Your choices", "To forget your class choice, clear this site's data in your browser settings.") + '</div></div>';
};

/* ---------- router ---------- */
var SITE = "https://graphpaper.co.in";
var SECT = {books:"books", syllabus:"syllabus", papers:"papers", sqp:"sample-papers", pyq:"previous-year-papers", qbank:"question-bank", booklist:"book-list"};
var SECT_REV = {"books":"books", "syllabus":"syllabus", "papers":"papers", "sample-papers":"sqp", "previous-year-papers":"pyq", "question-bank":"qbank", "book-list":"booklist"};
function classBase(c){ return "/class-" + c + (hasStreams(c) && ST.streamSet ? "/" + ST.stream.toLowerCase() : ""); }
function toPath(h){
  var m = /^#\/?([^\/?]*)(?:\/([^?]*))?(?:\?(.*))?$/.exec(h || "#/") || [], name = m[1] || "home", arg = m[2] || "", qs = m[3] ? "?" + m[3] : "", p;
  if (name === "home") p = "/";
  else if (name === "notice" || name === "board") p = "/" + name + "/" + arg;
  else if (name === "updates") p = "/updates" + (arg ? "/" + arg : "");
  else if (name === "class") p = classBase(ST.cls || "4");
  else if (name === "subject") p = "/class-" + (ST.cls || "10") + "/" + arg;
  else if (name === "chapter"){ var cbk = bookByCode(arg.split("-")[0]); p = cbk ? chapPath(cbk, +arg.split("-")[1]) : "/"; }
  else if (name === "books") p = classBase(bcls()) + "/books";
  else if (name === "syllabus" || name === "papers" || name === "sqp" || name === "pyq" || name === "qbank" || name === "booklist") p = classBase(ST.cls || "10") + "/" + SECT[name];
  else p = "/" + name;
  return p + qs;
}
function parse(){
  var segs = location.pathname.split("/").filter(Boolean).map(function(x){ try { return decodeURIComponent(x); } catch(e){ return x; } });
  var r = {name:"", arg:"", q:new URLSearchParams(location.search)};
  if (!segs.length) return r;
  var m = /^class-(\d{1,2})$/.exec(segs[0]);
  if (m && +m[1] >= 1 && +m[1] <= 12){
    r.cls = String(+m[1]); var i = 1;
    if (hasStreams(r.cls) && /^(science|commerce|humanities)$/.test(segs[1] || "")){ r.stream = segs[1].charAt(0).toUpperCase() + segs[1].slice(1); i = 2; }
    var sec = segs[i];
    if (!sec) r.name = "class";
    else if (SECT_REV[sec] && segs.length === i + 1) r.name = SECT_REV[sec];
    else if (+r.cls >= 9 && !r.stream && /^[a-z0-9-]+$/.test(sec) && segs.length === i + 1){ r.name = "subject"; r.arg = sec; }
    else if (+r.cls >= 9 && !r.stream && segs.length === i + 2 && /^[a-z0-9-]+$/.test(sec) && /^[a-z0-9]+-\d+(-[a-z0-9-]*)?$/.test(segs[i + 1])){
      var mm = /^([a-z0-9]+)-(\d+)/.exec(segs[i + 1]); r.name = "chapter"; r.arg = sec; r.ck = mm[1]; r.cn = +mm[2];
    }
    else r.name = "notfound";
    return r;
  }
  r.name = segs.length > 2 ? "notfound" : segs[0]; r.arg = segs[1] || "";
  return r;
}
function go(p, replace){
  var inUp = /^\/updates(\/|$)/.test(location.pathname) && /^\/updates(\/|$)/.test(p.split("?")[0]);
  clearTimeout(scrT); if (!replace) scrSave();
  history[replace ? "replaceState" : "pushState"](null, "", p);
  route(inUp && !replace);
}
function rewriteLinks(){
  var as = D.querySelectorAll('a[href^="#/"], a[data-h]');
  for (var i = 0; i < as.length; i++){ var a = as[i]; if (!a.dataset.h) a.dataset.h = a.getAttribute("href"); a.setAttribute("href", toPath(a.dataset.h)); }
}
function clsName(c){ return "Class " + c + (hasStreams(c) ? " " + ST.stream : ""); }
function bstat(c){
  var bs = classBooks(c).filter(streamOk), ch = 0, f = {}, ns = 0;
  bs.forEach(function(b){ ch += b.ch.length; var k = foldOf(b); if (k && k !== "Other books") f[k] = 1; });
  for (var k in f) ns++;
  return {nb: bs.length, nch: ch, ns: ns};
}
function plu(n, w){ return n + " " + w + (n === 1 ? "" : "s"); }
var RNUM = {"9": "IX", "10": "X", "11": "XI", "12": "XII"};
function pageMeta(name, r){
  var T = "GraphPaper: CBSE notices, NCERT books and syllabus", D0 = "CBSE circulars, date sheets and results for Class 1 to 12, with NCERT books and the syllabus, in one place.";
  var c = r.cls || ST.cls, cn = c ? clsName(c) : "", n = c ? +c : 0, m = {t: T, d: D0, ni: false}, bs = c ? bstat(c) : {nb: 0, nch: 0, ns: 0}, rm = RNUM[c];
  if (name === "welcome"){ m.t = "Choose your class and stream"; m.ni = true; }
  else if (name === "updates"){
    var up = uPreset(r.arg), uc = UCAT[r.arg];
    m.t = "CBSE circulars, date sheets and results"; m.d = "Every CBSE circular, date sheet, syllabus change and result in one list, newest first, with older notices archived separately."; m.bc = [["Updates", "/updates"]];
    if (uc){ m.t = "CBSE " + uc[1] + ", newest first"; m.d = uc[2]; m.bc.push(["CBSE " + uc[1], "/updates/" + r.arg]); }
    else if (up.cls){ m.t = "CBSE notices that name Class " + up.cls; m.d = "Circulars, date sheets, syllabus changes and results that name Class " + up.cls + " in the CBSE notice title, with the official link for each and older notices archived."; m.bc.push(["Class " + up.cls, "/updates/class-" + up.cls]); }
    else if (r.arg){ m.t = "Page not found"; m.ni = true; m.bc = null; }
    if (r.arg && ST.loaded && (up.type || up.cls)){ var uf = uFilter(up, true); if (!uf.cur.length && !uf.arc.length) m.ni = true; }
  }
  else if (name === "notice"){
    var x = findNotice(r.arg);
    if (x){
      var nt = x.title.replace(/\s+([:;,])/g, "$1").replace(/\s+/g, " ").trim(), tl = typeOf(x).label;
      var ntt = nt.length > 90 ? nt.slice(0, 90).replace(/\s+\S*$/, "") + "…" : nt;
      m.t = ntt;
      m.d = x.summary || (tl + " from CBSE dated " + fmt(x.date) + ": " + nt + ". Official link, publish date and related NCERT books, syllabus and papers.");
      m.art = x; m.bc = [["Updates", "/updates"], [nt, "/notice/" + (x.slug || x.id)]];
    } else { m.t = "Notice not found"; m.ni = true; }
  }
  else if (name === "streams"){ m.t = "Class " + r.cls + ": Science, Commerce or Humanities?"; m.d = "Pick your Class " + r.cls + " stream to see its NCERT books, syllabus" + (r.cls === "12" ? ", sample papers" : "") + " and question bank."; m.bc = [["Class " + r.cls, "/class-" + r.cls]]; }
  else if (name === "class"){ var pp = (n === 10 || n === 12), sy = n >= 9;
    m.t = sy ? (pp ? cn + " boards: syllabus, sample papers and past papers" : cn + " syllabus, NCERT books and question bank") : "NCERT books for " + cn + ", chapter by chapter";
    if (bs.nb) m.d = sy ? cn + " has " + plu(bs.nb, "NCERT book") + (bs.ns ? " in " + plu(bs.ns, "subject") : "") + " with " + bs.nch + " chapter PDFs, plus the 2026-27 syllabus, " + (pp ? "CBSE sample papers, past board papers" : "a question bank") + " and recent CBSE notices." : "All " + plu(bs.nb, "NCERT book") + " for " + cn + " with " + bs.nch + " chapter titles and PDFs, a printable book list and a short guide for parents.";
    else m.d = sy ? cn + " syllabus, NCERT books and recent CBSE notices, each linked to the official file." : "Every NCERT book for " + cn + ", chapter by chapter, with a printable book list.";
    if (!r.cls) m.ni = true; m.bc = [[cn, classBase(c)]]; }
  else if (name === "books"){ m.t = cn + " NCERT textbooks with chapter-wise PDFs";
    m.d = bs.nb ? "All " + plu(bs.nb, "NCERT book") + " for " + cn + (bs.ns ? ", grouped into " + plu(bs.ns, "subject") : "") + ", with " + bs.nch + " chapter PDFs and a whole-book download for each. Files open on ncert.nic.in." : "Chapter-wise NCERT PDFs for " + cn + ", linked from the NCERT site.";
    m.bc = [[cn, classBase(c)], ["NCERT books", classBase(c) + "/books"]]; }
  else if (name === "booklist"){ m.t = "Printable NCERT book list for " + cn;
    m.d = bs.nb ? "A list of the " + plu(bs.nb, "NCERT book") + " for " + cn + " with all " + bs.nch + " chapter titles, ready to print." : "A printable list of the NCERT books for " + cn + ", with chapter titles.";
    m.bc = [[cn, classBase(c)], ["Book list", classBase(c) + "/book-list"]]; }
  else if (name === "syllabus"){ m.t = cn + " syllabus 2026-27, subject by subject";
    var sg = 0; try { SYL.parts[SYLKEY[c]].groups.forEach(function(g){ sg += g.items.length; }); } catch(e){}
    m.d = sg ? cn + " syllabus for 2026-27: official PDFs for " + plu(sg, "subject") + (n >= 11 ? " (CBSE publishes Classes 11 and 12 in one document)" : "") + ", linked from cbseacademic.nic.in." : "Official CBSE syllabus PDFs for " + cn + ", session 2026-27.";
    if (n < 9) m.ni = true; m.bc = [[cn, classBase(c)], ["Syllabus", classBase(c) + "/syllabus"]]; }
  else if (name === "papers"){ m.t = cn + " sample and past board papers"; m.d = "Sample papers with marking schemes and earlier board question papers for " + cn + ", each file hosted by CBSE."; if (n !== 10 && n !== 12) m.ni = true; m.bc = [[cn, classBase(c)], ["Papers", classBase(c) + "/papers"]]; }
  else if (name === "sqp"){ m.t = cn + " sample papers with marking schemes";
    var sq = 0; try { sq = PAP.sqp[rm].items.length; } catch(e){}
    m.d = sq ? "Sample question papers and marking schemes for " + plu(sq, "subject") + " of " + cn + ", session 2026-27, linked from cbseacademic.nic.in." : "Official CBSE sample question papers and marking schemes for " + cn + ", session 2026-27.";
    if (n !== 10 && n !== 12) m.ni = true; m.bc = [[cn, classBase(c)], ["Sample papers", classBase(c) + "/sample-papers"]]; }
  else if (name === "pyq"){ m.t = cn + " board question papers from earlier years";
    var ys = []; try { ys = Object.keys(PAP.pyq[rm]).sort(); } catch(e){}
    m.d = ys.length ? "Board exam question papers for " + cn + " from " + ys[0] + " to " + ys[ys.length - 1] + ", including the second exam where CBSE held one. Files open on CBSE’s own site." : "Past CBSE board exam question papers for " + cn + ", year by year. Files open on CBSE’s own site.";
    if (n !== 10 && n !== 12) m.ni = true; m.bc = [[cn, classBase(c)], ["Previous year papers", classBase(c) + "/previous-year-papers"]]; }
  else if (name === "qbank"){ m.t = cn + " question bank with NCERT Exemplar";
    var qp = []; try {
      if (QB.cbse[c]) qp.push(plu(QB.cbse[c].length, "CBSE question bank PDF"));
      if (QB.items[c]) qp.push("competency-based questions for " + plu(QB.items[c].length, "subject"));
      if (QB.ex[c]) qp.push("NCERT Exemplar problems for " + plu(QB.ex[c].length, "subject"));
    } catch(e){}
    m.d = qp.length ? cn + " practice material: " + qp.join(", ") + ". Everything opens on the CBSE or NCERT site." : "CBSE question bank, practice questions and NCERT Exemplar problems for " + cn + ".";
    if (n < 6) m.ni = true; m.bc = [[cn, classBase(c)], ["Question bank", classBase(c) + "/question-bank"]]; }
  else if (name === "calculator"){ m.t = "Marks to percentage and CGPA calculator"; m.bc = [["Calculator", "/calculator"]]; m.d = "Work out your percentage from your marks, or convert CGPA to percentage using CBSE's own 9.5 rule. Free, and nothing is saved or sent."; }
  else if (name === "chapter"){
    var ch = chapterOf(r); m.ni = true;
    if (ch){ m.t = (ch.h[1] || ch.b.label + " " + ch.h[0]) + " | Class " + ch.b.cls + " " + foldOf(ch.b); m.d = "Official NCERT PDF for Class " + ch.b.cls + " " + foldOf(ch.b) + ", " + ch.b.label + " " + ch.h[0] + ", with the next chapter and the whole-book download."; } else m.t = "Chapter not found";
  }
  else if (name === "subject"){
    var sf = subjectOf(r);
    if (sf){
      var pp2 = (n === 10 || n === 12), sn = sf === "Mathematics" ? "Maths" : sf, nch = 0;
      classBooks(c).forEach(function(b){ if (foldOf(b) === sf && streamOk(b)) nch += b.ch.length; });
      m.t = pp2 ? "Class " + c + " " + sn + " for the board exam: chapters and papers" : "Class " + c + " " + sn + " chapters, syllabus and practice";
      m.bc = (n < 11 ? [["Class " + c, "/class-" + c]] : []).concat([[sf, "/class-" + c + "/" + r.arg]]); m.col = true;
      m.d = "Class " + c + " " + sf + ": " + (nch ? nch + " NCERT chapters with PDF links, " : "") + "the 2026-27 syllabus, " + (pp2 ? "sample papers with marking schemes and earlier board papers." : "question bank and NCERT Exemplar practice.");
    } else { m.t = "Subject not found"; m.ni = true; }
  }
  else if (name === "board"){ var b = BOARDS[r.arg] ? r.arg : "CBSE"; m.t = b + " notices"; m.d = BOARDS[b].soon ? D0 : "Latest " + b + " circulars, date sheets, syllabus changes and results."; if (BOARDS[b].soon) m.ni = true; }
  else if (name === "parents"){ m.t = "Classes 1 to 8 explained for parents"; m.d = "Plain answers for parents of children in Classes 1 to 8: school stages, board exams, holding back, and the Holistic Progress Card, with official sources."; m.bc = [["For parents", "/parents"]]; }
  else if (name === "about"){ m.t = "About GraphPaper"; m.d = "GraphPaper brings NCERT books, the CBSE syllabus, papers and official notices together for Class 1 to 12, with links to the official sources only."; }
  else if (name === "contact"){ m.t = "Contact GraphPaper"; m.d = "Write to GraphPaper to report a wrong or missing CBSE notice, ask a question or suggest a feature."; }
  else if (name === "disclaimer"){ m.t = "Disclaimer: GraphPaper is not CBSE or NCERT"; m.d = "GraphPaper is independent and not affiliated with CBSE or NCERT. Always confirm notices and dates at the official source."; }
  else if (name === "terms"){ m.t = "Terms of use"; m.d = "The terms for using GraphPaper: an independent site that links to official CBSE and NCERT sources and is not an official board website."; }
  else if (name === "privacy"){ m.t = "Privacy: no accounts, nothing collected"; m.d = "What GraphPaper stores on your device (your class and progress ticks) and what it does not collect."; }
  else if (name === "notfound"){ m.t = "Page not found"; m.ni = true; }
  return m;
}
function setMeta(name, r){
  if (name === "notice"){ var nx = findNotice(r.arg); if (nx && nx.slug && r.arg !== nx.slug){ history.replaceState(null, "", "/notice/" + encodeURIComponent(nx.slug) + location.search); r.arg = nx.slug; } }
  var m = pageMeta(name, r), path = location.pathname.replace(/\/+$/, "") || "/", url = SITE + (path === "/" ? "/" : path);
  if (r.q && name === "home" && r.q.get("s")) url = SITE + "/";
  function el(sel, tag, attrs){ var e = $(sel); if (!e){ e = D.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); D.head.appendChild(e); } return e; }
  if (m.d.length > 165){ m.d = m.d.slice(0, 162).replace(/[\s,;:.\-]+\S*$/, "") + "\u2026"; }
  if (m.t.length <= 46 && m.t.indexOf("GraphPaper") < 0) m.t += " | GraphPaper";
  D.title = m.t;
  el('meta[name="description"]', "meta", {name:"description"}).setAttribute("content", m.d);
  if (name === "notfound"){ var cn0 = $('link[rel="canonical"]'); if (cn0) cn0.parentNode.removeChild(cn0); }
  else el('link[rel="canonical"]', "link", {rel:"canonical"}).setAttribute("href", url);
  el('meta[property="og:title"]', "meta", {property:"og:title"}).setAttribute("content", m.t);
  el('meta[property="og:description"]', "meta", {property:"og:description"}).setAttribute("content", m.d);
  el('meta[property="og:url"]', "meta", {property:"og:url"}).setAttribute("content", url);
  var graph = [];
  if (name === "home"){
    graph.push({"@type":"Organization", "@id":SITE + "/#org", name:"GraphPaper", url:SITE + "/", logo:SITE + "/logo.png"});
    graph.push({"@type":"WebSite", "@id":SITE + "/#site", name:"GraphPaper", url:SITE + "/", publisher:{"@id":SITE + "/#org"}, inLanguage:"en-IN"});
  }
  if (m.bc && !m.ni){
    var bl = [["Home", "/"]].concat(m.bc);
    graph.push({"@type":"BreadcrumbList", itemListElement: bl.map(function(b, i){ return {"@type":"ListItem", position:i + 1, name:b[0], item:SITE + b[1]}; })});
  }
  if (m.art && !m.ni){
    graph.push({"@type":"Article", headline:m.art.title.replace(/\s+([:;,])/g, "$1").replace(/\s+/g, " ").trim().slice(0, 110), description:m.d, datePublished:m.art.date, dateModified:m.art.date, mainEntityOfPage:url, url:url, inLanguage:"en-IN",
      about:{"@type":"Organization", name:"Central Board of Secondary Education (CBSE)", url:"https://www.cbse.gov.in/"}, isBasedOn:safeUrl(m.art.url),
      author:{"@type":"Organization", name:"GraphPaper", url:SITE + "/"}, publisher:{"@type":"Organization", name:"GraphPaper", logo:{"@type":"ImageObject", url:SITE + "/logo.png"}}, image:SITE + "/logo.png"});
  }
  if (m.col && !m.ni){
    graph.push({"@type":"CollectionPage", name:m.t.replace(/ \| GraphPaper$/, ""), description:m.d, url:url, isPartOf:{"@type":"WebSite", name:"GraphPaper", url:SITE + "/"}, inLanguage:"en-IN"});
  }
  var ld = $("#ld");
  if (graph.length){
    ld = el("#ld", "script", {type:"application/ld+json", id:"ld"});
    ld.textContent = JSON.stringify({"@context":"https://schema.org", "@graph":graph});
  } else if (ld){ ld.parentNode.removeChild(ld); }
  var rb = $('meta[name="robots"]');
  if (m.ni){ el('meta[name="robots"]', "meta", {name:"robots"}).setAttribute("content", "noindex"); } else if (rb){ rb.parentNode.removeChild(rb); }
}
function syncFromPath(r){
  if (r.cls && r.cls !== ST.cls) setClass(r.cls);
  if (r.stream && (r.stream !== ST.stream || !ST.streamSet)) setStream(r.stream);
  if (r.cls && hasStreams(r.cls) && !r.stream && ST.streamSet && r.name !== "subject" && r.name !== "chapter"){
    var sec = (r.name === "class" || r.name === "streams") ? "" : "/" + SECT[r.name];
    history.replaceState(null, "", classBase(r.cls) + sec + location.search);
  }
}
var FOOT_DEFAULT = '<div class="wrap" style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:32px"><div style="max-width:380px"><div class="fr" style="font-weight:600;font-size:26px;margin-bottom:8px;display:flex;align-items:center;gap:10px"><img src="/logo-96.png" width="36" height="36" alt="" style="border-radius:10px" loading="lazy">GraphPaper</div><div style="color:var(--a1);font-size:15px">GraphPaper is not an official board website. Always verify notices at the source.</div></div><div style="display:flex;flex-wrap:wrap;gap:24px;font-weight:700;align-items:flex-start"><a href="#/about">About</a><a href="#/contact">Contact</a><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a><a href="#/disclaimer">Disclaimer</a></div></div>';
function applyClass(){
  var app = $("#app"), n = +ST.cls, st = n >= 9, young = !!ST.cls && n <= 8, up = $("#nv-up"), nav = $("#topnav nav"), ft = $("#foot");
  app.dataset.c = ST.cls;
  if (st) app.dataset.s = "1"; else delete app.dataset.s;
  if (up) up.hidden = young;
  if (nav) nav.className = young ? "few" : "";
  if (ft){
    var key = st ? "s" + n + (hasStreams(n) && ST.streamSet ? ST.stream : "") : "d";
    if (ft.dataset.k !== key){ ft.dataset.k = key; ft.innerHTML = st ? sxFoot(n) : FOOT_DEFAULT; rewriteLinks(); }
  }
}
var NAVOF = {updates:"nv-up", notice:"nv-up", board:"nv-up", parents:"nv-pa", "class":"nv-sh", streams:"nv-sh", books:"nv-sh", syllabus:"nv-sh", papers:"nv-sh", sqp:"nv-sh", pyq:"nv-sh", qbank:"nv-sh", booklist:"nv-sh", subject:"nv-sh", chapter:"nv-sh", calculator:"nv-sh"};
function markNav(name){
  ["nv-up", "nv-sh", "nv-pa"].forEach(function(id){ var a = $("#" + id); if (!a) return; if (NAVOF[name] === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
}
/* While data is still arriving the footer is kept out of sight, so a page that briefly gets shorter does not pull it up into view and then push it back down. */
function setBusy(){ D.documentElement.classList.toggle("gp-busy", !(ST.booksLoaded && ST.loaded && !ST.inflight)); }
/* Back and forward: remember where each page was scrolled to and go back to that spot (the browser cannot do it itself, because the page is drawn by script). */
try { history.scrollRestoration = "manual"; } catch(e){}
var SCR = {}, POP = false, scrT = 0, scrStop = false;
try { SCR = JSON.parse(sessionStorage.getItem("gp-scr") || "{}") || {}; } catch(e){}
function scrKey(){ return location.pathname + location.search; }
function scrSave(){ SCR[scrKey()] = Math.round(window.scrollY); try { sessionStorage.setItem("gp-scr", JSON.stringify(SCR)); } catch(e){} }
function restoreScroll(y){
  scrStop = false; var t0 = Date.now();
  (function tick(){
    if (scrStop) return;
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) > 2 && Date.now() - t0 < 3000) requestAnimationFrame(tick);
  })();
}
window.addEventListener("scroll", function(){ clearTimeout(scrT); scrT = setTimeout(scrSave, 120); }, {passive: true});
["touchstart", "wheel", "keydown"].forEach(function(ev){ window.addEventListener(ev, function(){ scrStop = true; }, {passive: true}); });
function route(keepScroll){
  var pop = POP; POP = false;
  var r = parse(), name = r.name;
  if (r.cls){ syncFromPath(r); r = parse(); name = r.name; }
  else if (name === "updates" && /^class-(9|1[0-2])$/.test(r.arg || "") && r.arg.slice(6) !== ST.cls) setClass(r.arg.slice(6));
  if (!name) name = "home";
  if (!VIEWS[name]) name = "notfound";
  if (name === "updates" && r.arg && !UCAT[r.arg] && !/^class-(9|1[0-2])$/.test(r.arg)) name = "notfound";
  if (name === "class" && r.cls && hasStreams(r.cls) && !r.stream) name = "streams";
  if (ST.cls && hasStreams(ST.cls) && !ST.streamSet && /^(class|books|syllabus|papers|sqp|pyq|qbank|booklist)$/.test(name)){ ST.wc = ST.wc || ST.cls; name = "welcome"; }
  if (!keepScroll){
    if (name !== "updates" || !ST.fromSearch){ if (name === "updates" || ST.navFrom === "updates"){ ST.type = "all"; ST.q = ""; ST.ub = "all"; ST.fs = ""; ST.fsub = ""; ST.fy = ""; } }
    if (name !== "books"){ ST.bq = ""; ST.bsub = "All"; }
    if (name !== "syllabus") ST.sq = "";
    if (name !== "papers" && name !== "sqp" && name !== "pyq") ST.pq = "";
    if (name !== "qbank") ST.qq = "";
    ST.fromSearch = false; ST.navFrom = name;
  }
  if (typeof needData === "function") needData(name);
  if (HYD){ if (keepScroll && !(ST.booksLoaded && ST.loaded && !ST.inflight)) return; HYD = false; }
  setBusy();
  $("#hdr").hidden = $("#foot").hidden = (name === "welcome");
  if (name !== "welcome") applyClass();
  $("#view").innerHTML = VIEWS[name](r);
  markNav(name);
  rewriteLinks();
  setMeta(name, r);
  if (!keepScroll){
    var s = r.q.get("s"), tgt = s && D.getElementById(s);
    var back = pop && SCR[scrKey()] > 0 ? SCR[scrKey()] : 0;
    if (tgt) tgt.scrollIntoView({behavior: "smooth"}); else if (back) restoreScroll(back); else window.scrollTo(0, 0);
    var pg = $("#pg"); if (pg && !tgt) pg.focus({preventScroll:true});
  }
}
function setStream(v){
  ST.stream = v; ST.ws = v; ST.streamSet = true;
  try { localStorage.setItem("gp-stream", v); } catch(e){}
}
function setClass(v){
  ST.cls = v; ST.wc = v;
  try { localStorage.setItem("gp-class", v); } catch(e){}
  applyClass();
}

/* ---------- events ---------- */
["click", "input", "change", "submit", "keydown"].forEach(function(ev){ document.addEventListener(ev, function(){ HYD = false; }, true); });
D.addEventListener("click", function(e){
  var el = e.target.closest("[data-act]"); if (!el) return;
  var a = el.dataset.act, v = el.dataset.v;
  if (a === "setcls"){ setClass(v); route(true); var d = $("#clsmenu"); if (d) d.open = false; }
  else if (a === "print"){ window.print(); }
  else if (a === "tick"){
    var tk = el.dataset.k; if (DONE[tk]) delete DONE[tk]; else DONE[tk] = 1; saveDone();
    var on = !!DONE[tk];
    D.querySelectorAll('[data-k="' + tk + '"]').forEach(function(x){
      x.setAttribute("aria-pressed", on ? "true" : "false");
      if (x.hasAttribute("data-big")){ x.textContent = on ? "Done \u2713 (tap to undo)" : "Mark as done"; x.classList.toggle("dark", !on); }
    });
    refreshProg();
  }
  else if (a === "resetprog"){
    if (window.confirm("Clear all your ticks for Class " + el.dataset.c + " " + el.dataset.f + "?")){
      classBooks(el.dataset.c).forEach(function(b){ if (foldOf(b) === el.dataset.f) b.ch.forEach(function(h){ delete DONE[dk(b, h)]; }); });
      saveDone(); route(true);
    }
  }
  else if (a === "calcadd"){
    var cr = $("#crows"), cnt = cr.children.length; if (cnt >= 12) return;
    cr.insertAdjacentHTML("beforeend", calcRow(cnt + 1));
  }
  else if (a === "calcrm"){
    var row = el.closest(".crow"), cr2 = $("#crows"); if (cr2.children.length <= 1) return;
    row.parentNode.removeChild(row);
    Array.prototype.forEach.call(cr2.children, function(r2, i){ r2.querySelector(".cn").textContent = i + 1; });
    calcRun();
  }
  else if (a === "wc"){ ST.wc = v; route(true); var wa = $("#app"); wa.dataset.c = v; if (+v >= 9) wa.dataset.s = "1"; else delete wa.dataset.s; }
  else if (a === "copyfeed"){ var fu = $("#feedurl").textContent, cm = $("#copymsg"); if (navigator.clipboard) navigator.clipboard.writeText(fu).then(function(){ cm.textContent = "Copied."; }, function(){ cm.textContent = "Press and hold the address to copy it."; }); else cm.textContent = "Press and hold the address to copy it."; }
  else if (a === "wgo"){ var we = $("#werr"); if (!ST.wc){ we.textContent = "Please pick your class first."; we.hidden = false; return; } if (hasStreams(ST.wc) && !ST.ws){ we.textContent = "Please pick your stream first."; we.hidden = false; return; } setClass(ST.wc); if (hasStreams(ST.wc)) setStream(ST.ws); go("/"); }
  else if (a === "sxchip"){ if (!$("#resources")){ ST.sxq = v; go(toPath("#/class")); return; } var qi = $("#sxq"); if (qi) qi.value = v; sxFilter(v); var rs = $("#resources"); if (rs) rs.scrollIntoView({behavior: "smooth"}); }
  else if (a === "ut"){ ST.type = v; route(true); }
  else if (a === "uf"){ var uk = el.dataset.k; ST[uk] = ST[uk] === v ? "" : v; route(true); }
  else if (a === "ws"){ ST.ws = v; route(true); }
  else if (a === "bs"){ ST.bsub = v; route(true); }
  else if (a === "pt"){ ST.pt = v; ST.pq = ""; route(true); }
  else if (a === "py"){ ST.py = v; route(true); }
  else if (a === "pe"){ ST.pe = v; route(true); }
  else if (a === "share"){
    var url = location.href, title = D.title, msg = $("#shmsg");
    if (navigator.share){ navigator.share({title: title, url: url}).catch(function(){}); }
    else if (navigator.clipboard){ navigator.clipboard.writeText(url).then(function(){ msg.textContent = "Link copied."; }, function(){ msg.textContent = "Copy the link from the address bar."; }); }
    else msg.textContent = "Copy the link from the address bar.";
  }
});
D.addEventListener("submit", function(e){
  if (e.target.dataset && e.target.dataset.act === "csend"){ e.preventDefault(); location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("GraphPaper: " + $("#ctopic").value) + "&body=" + encodeURIComponent($("#cmsg").value + "\n\n" + $("#cname").value); return; }
  if (e.target.dataset && e.target.dataset.act === "hsearch"){ e.preventDefault(); ST.q = $("#hq").value; ST.type = "all"; ST.fromSearch = true; go(toPath("#/updates")); }
});
D.addEventListener("input", function(e){
  if (e.target.id === "sxq"){ sxFilter(e.target.value); return; }
  if (e.target.dataset && e.target.dataset.calc){ calcInput(e.target); return; }
  if (e.target.id === "pq"){ ST.pq = e.target.value; if (PAP) $("#plist").innerHTML = papBody(ST.cls || "10"); return; }
  if (e.target.id === "qq"){ ST.qq = e.target.value; if (QB) $("#qlist").innerHTML = qbBody(ST.cls || "10"); return; }
  if (e.target.id === "sq"){ ST.sq = e.target.value; if (SYL) $("#slist").innerHTML = sylHtml(ST.cls || "10", ST.sq.trim().toLowerCase()).html; return; }
  if (e.target.id === "uq" || e.target.id === "bq"){
    if (e.target.id === "uq"){ ST.q = e.target.value; var l = listHtml(); $("#ulist").innerHTML = l.html; $("#uarc").innerHTML = l.arc; $("#ucount").textContent = ucount(l); }
    else { ST.bq = e.target.value; $("#blist").innerHTML = booksHtml().html; }
  }
});
D.addEventListener("change", function(e){
  if (e.target.id === "usub"){ ST.fsub = e.target.value; route(true); }
  else if (e.target.id === "uyr"){ ST.fy = e.target.value; route(true); }
});
D.addEventListener("toggle", function(e){
  var t = e.target; if (!t.classList || ST.bq) return; if (t.classList.contains("folder")) ST.bfold[t.dataset.fold] = t.open; else if (t.classList.contains("book")) ST.bopen[t.dataset.code] = t.open;
}, true);
D.addEventListener("click", function(e){
  if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest ? e.target.closest("a[href]") : null; if (!a || a.target || a.hasAttribute("download")) return;
  var h = a.getAttribute("href"); if (!h || h.charAt(0) !== "/" || h.charAt(1) === "/" || /\.(xml|json|pdf|zip|html)(\?|$)/i.test(h)) return;
  e.preventDefault(); go(h);
});
window.addEventListener("popstate", function(){ clearTimeout(scrT); POP = true; route(); });
window.addEventListener("hashchange", function(){ if (/^#\//.test(location.hash)) go(toPath(location.hash), true); });
D.addEventListener("keydown", function(e){ if (e.key === "Enter" && e.target.id === "sxq" && !$("#resources")){ e.preventDefault(); ST.sxq = e.target.value; go(toPath("#/class")); } });
