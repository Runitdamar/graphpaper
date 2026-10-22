var BOOKS = [];
var BBASE = "https://ncert.nic.in/textbook/pdf/";
var BPORTAL = "https://ncert.nic.in/textbook.php";
var SYL = null, PAP = null;
var P = {
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
var ST = {ub:"all", stream:"Science", cls:"", wc:"", items:[], loaded:false, q:"", type:"all", hf:"all", bsub:"All", bq:""};
try { var sv = localStorage.getItem("gp-class"); if (/^(1[0-2]|[1-9])$/.test(sv || "")) ST.cls = sv; } catch(e){}
try { var sv2 = localStorage.getItem("gp-stream"); if (sv2 === "Science" || sv2 === "Commerce" || sv2 === "Humanities"){ ST.stream = sv2; ST.streamSet = true; } } catch(e){}
ST.ws = ST.streamSet ? ST.stream : ""; ST.pending = 5;

function typeOf(x){ return TYPES[x.tag] || TYPES.Circular; }
function pill(x, extra){ var t = typeOf(x); return '<span class="pill" style="background:var(' + t.c + ')">' + esc(t.label) + '</span>' + (extra || ""); }
function noticeCard(x, small){
  var t = typeOf(x);
  return '<article class="card' + (small ? ' sm' : '') + '" style="--sh:var(' + t.c + ')">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:700;font-size:14px">' + pill(x) +
    (isNew(x.date) ? '<span class="pill" style="background:var(--a3)">New</span>' : '<span>CBSE</span>') + '</div>' +
    '<h3><a href="#/notice/' + encodeURIComponent(x.id) + '">' + esc(x.title) + '</a></h3>' +
    '<div class="meta">' + esc(fmt(x.date)) + ' \u00b7 ' + esc(noticeClass(x)) + '</div>' +
    '<a class="more" href="#/notice/' + encodeURIComponent(x.id) + '">Read notice →</a></article>';
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

VIEWS.welcome = function(){
  var sel = ST.wc, cb = "";
  var needS = hasStreams(ST.wc), sb = "";
  if (needS) STREAMS.forEach(function(v){ sb += '<button class="f fr" data-act="ws" data-v="' + v + '" aria-pressed="' + (ST.ws === v ? "true" : "false") + '" style="font-weight:600;font-size:19px;min-height:56px;padding:6px 10px">' + v + '</button>'; });
  for (var i = 1; i <= 12; i++) cb += '<button class="f fr" data-act="wc" data-v="' + i + '" aria-pressed="' + (sel === String(i) ? "true" : "false") + '" style="font-weight:600;font-size:22px;min-height:56px;padding:6px">' + i + '</button>';
  function bd(n, c, state, note){
    return '<button class="f fr" ' + (state === "on" ? 'aria-pressed="true"' : 'disabled aria-disabled="true"') + ' style="background:var(' + c + ');color:var(--ink);font-weight:500;font-size:20px;min-height:72px;border-radius:24px;padding:8px">' + n + (note ? '<span style="display:block;font-family:Nunito,sans-serif;font-weight:700;font-size:12px">' + note + '</span>' : '') + '</button>';
  }
  function step(n, id, t){ return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px"><span class="fr" style="flex:none;width:34px;height:34px;border-radius:50%;background:var(--a1);border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:17px">' + n + '</span><div id="' + id + '" class="fr" style="font-weight:600;font-size:22px">' + t + '</div></div>'; }
  return '<div style="position:relative;max-width:720px;margin:0 auto;padding:40px 24px 64px;text-align:center">' +
   '<div style="position:absolute;top:24px;right:12px;width:90px;height:90px;border-radius:50%;background:var(--a4);pointer-events:none"></div>' +
   '<div style="position:absolute;top:150px;left:8px;width:64px;height:64px;border-radius:22px;background:var(--a3);transform:rotate(14deg);pointer-events:none"></div>' +
   '<div style="position:relative"><svg width="64" height="64" viewBox="0 0 36 36" aria-hidden="true"><rect x="2" y="2" width="32" height="32" rx="10" style="fill:var(--a1);stroke:var(--ink)" stroke-width="2"/><path d="M13 3v30M23 3v30M3 13h30M3 23h30" style="stroke:var(--ink)" stroke-width="1.5" opacity=".35"/><circle cx="18" cy="18" r="4" style="fill:var(--a2);stroke:var(--ink)" stroke-width="2"/></svg>' +
   '<div class="fr" style="font-weight:600;font-size:28px;margin:8px 0 28px">GraphPaper</div>' +
   '<h1 style="font-size:clamp(34px,7vw,56px);margin-bottom:12px">Hi there! Which class are you in?</h1>' +
   '<p style="margin:0 auto 32px;color:var(--mut);max-width:460px">Pick your class, your board and, for Class 11 and 12, your stream, and we’ll set up your page.</p>' +
   '<div style="background:var(--card);border:2px solid var(--ink);border-radius:32px;padding:28px 24px;text-align:left;display:flex;flex-direction:column;gap:22px;box-shadow:0 6px 0 var(--a1)">' +
   '<div>' + step(1, "wh1", "Your class") + '<div role="group" aria-labelledby="wh1" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">' + cb + '</div>' +
   '<div style="font-size:14px;color:var(--mut);margin-top:12px">Colors grow up with you, from candy pastels to calm, deep tones.</div></div>' +
   (needS ? '<div>' + step(2, "wh3", "Your stream") + '<div role="group" aria-labelledby="wh3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">' + sb + '</div>' +
   '<div style="font-size:14px;color:var(--mut);margin-top:12px">Books, syllabus, papers and question banks will show your stream\u2019s subjects first. You can change this any time.</div></div>' : '') +
   '<div>' + step(needS ? 3 : 2, "wh2", "Your board") + '<div role="group" aria-labelledby="wh2" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + bd("CBSE", "--a1", "on") + bd("ICSE", "--a4", "off", "Coming soon") + bd("State boards", "--a2", "off", "Coming soon") + '</div>' +
   '<div style="font-size:14px;color:var(--mut);margin-top:12px">CBSE notices are live. Other boards are on the way. Books and notices are live for Class 1 to 12, and the syllabus for Class 9 to 12.</div></div>' +
   '<div id="werr" role="alert" hidden style="background:var(--a2);border:2px solid var(--ink);border-radius:16px;padding:10px 16px;font-weight:700">Please pick your class first.</div>' +
   '<button class="btn dark" data-act="wgo" style="min-height:56px;font-size:19px;padding:14px 32px">Take me in</button></div>' +
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
        var outline = titles.length === b.ch.length ? '<div class="meta" style="margin-top:4px">' + titles.map(esc).join(' \u00b7 ') + '</div>' : '<div class="meta" style="margin-top:4px">' + b.ch.length + ' ' + b.label.toLowerCase() + (b.ch.length === 1 ? '' : 's') + '</div>';
        return '<div style="display:flex;gap:12px;padding:12px 0;border-top:2px solid var(--gl)"><span aria-hidden="true" style="font-size:22px;line-height:1.2">\u2610</span><div style="min-width:0"><div style="font-weight:700;overflow-wrap:anywhere">' + esc(b.title) + '</div><div class="meta">' + esc(b.code) + ' \u00b7 ' + b.ch.length + ' ' + b.label.toLowerCase() + (b.ch.length === 1 ? '' : 's') + '</div>' + outline + '<div class="noprint" style="margin-top:8px">' + (b.zip ? '<a href="' + BBASE + b.zip + '" target="_blank" rel="noopener" style="font-weight:700;text-decoration:underline">Whole book (ZIP' + (b.mb ? ', ' + b.mb + ' MB' : '') + ') \u2193</a> \u00b7 ' : '') + '<a href="#/books" style="font-weight:700;text-decoration:underline">Chapters</a></div></div></div>';
      }).join("") + '</section>';
    }).join("");
    body = '<div class="meta" style="margin-bottom:16px">' + nb + ' books \u00b7 ' + nc + ' chapters. Tick each book as you get it.</div><div style="display:flex;flex-direction:column;gap:22px">' + body + '</div>';
  }
  return '<div class="wrap sec" style="max-width:860px">' + crumb + '<div class="head"><div class="tile" style="background:var(--a1)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Book list</h1><p>Every NCERT textbook for ' + cn + ', in one checklist. English-medium books plus the Hindi and Sanskrit language books.</p></div></div>' +
   '<div class="noprint" style="margin-bottom:20px"><button class="btn dark" type="button" data-act="print">Print this list</button></div>' + body +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">Books are free to read and download on ncert.nic.in. GraphPaper does not host them. Your school may use other books as well, so check its list.</p></div>';
};
VIEWS.notfound = function(){
  return '<div class="wrap sec" style="padding-bottom:64px"><div class="crumb"><a href="#/home">Home</a> / <b>Not found</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(30px,5vw,48px)">Page not found</h1><p style="color:var(--mut)">That page does not exist. <a href="#/home" style="text-decoration:underline;font-weight:700">Go to the home page</a> or <a href="#/updates" style="text-decoration:underline;font-weight:700">see all updates</a>.</p></div>';
};
VIEWS.home = function(){
  var it = ST.items, latest3 = it.slice(0, 3);
  var board = [["CBSE","--a1","C",false],["ICSE","--a4","I",true],["State boards","--a2","S",true]].map(function(b){
    return '<a class="bcard" href="#/board/' + encodeURIComponent(b[0]) + '" style="background:var(' + b[1] + ')">' + b[0] + (b[3] ? '<div style="font-family:Nunito,sans-serif;font-weight:700;font-size:13px;margin-top:4px">Coming soon</div>' : '') + '</a>';
  }).join("");
  var fresh = it.filter(function(x){ return ST.hf === "all" || x.tag === ST.hf; }).slice(0, 4);
  var f = [["all","All"]].concat(TYPE_KEYS.map(function(k){ return [k, TYPES[k].plural]; })).map(function(p){
    return '<button class="f" data-act="hf" data-v="' + esc(p[0]) + '" aria-pressed="' + (ST.hf === p[0] ? "true" : "false") + '">' + esc(p[1]) + '</button>';
  }).join("");
  return '<div class="wrap hr"><div>' +
    '<a href="#/welcome" class="pill" style="background:var(--a3);padding:6px 16px;font-size:15px">' + (ST.cls ? 'Class ' + ST.cls + (hasStreams(ST.cls) && ST.streamSet ? ' \u00b7 ' + ST.stream : '') + ' \u00b7 CBSE \u00b7 Change' : 'Pick your class and stream \u2192') + '</a>' +
    '<h1 style="font-size:clamp(38px,6vw,66px);line-height:1.08;margin:20px 0 16px">Every CBSE circular, date sheet and result. One cozy place.</h1>' +
    '<p style="color:var(--mut);margin:0 0 28px;max-width:520px">Official notices from CBSE, gathered and sorted so you never miss one. NCERT books and the syllabus sit right next to them.</p>' +
    '<form class="search" data-act="hsearch"><label for="hq" style="position:absolute;left:-9999px">Search notices</label><input id="hq" placeholder="Search notices, e.g. date sheet" autocomplete="off"><button class="go" type="submit">Search</button></form>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:24px;font-weight:700;font-size:15px;align-items:center"><span style="color:var(--mut)">Popular:</span>' +
    '<a class="pill" href="#/updates?type=Circular" style="background:var(--a1);padding:6px 14px;font-size:15px">CBSE circulars</a><a class="pill" href="#/updates?type=Date%20Sheet" style="background:var(--a4);padding:6px 14px;font-size:15px">Date sheets</a><a class="pill" href="#/updates?type=Result" style="background:var(--a5);padding:6px 14px;font-size:15px">Results</a></div></div>' +
    '<div style="position:relative;padding:20px"><div style="position:absolute;top:-8px;right:-4px;width:150px;height:150px;border-radius:50%;background:var(--a4)"></div><div style="position:absolute;bottom:-12px;left:0;width:110px;height:110px;border-radius:36px;background:var(--a3);transform:rotate(14deg)"></div>' +
    '<div class="grid-paper" style="position:relative;border:2px solid var(--ink);border-radius:32px;padding:28px;display:flex;flex-direction:column;gap:14px;transform:rotate(-2deg)"><div class="fr" style="font-weight:600;font-size:22px">Today on the board</div>' +
    (latest3.length ? latest3.map(function(x){ return '<a href="#/notice/' + encodeURIComponent(x.id) + '" style="display:block;background:var(--card);border:2px solid var(--ink);border-radius:18px;padding:14px 16px">' + pill(x) + '<div style="margin-top:6px;font-weight:700;overflow-wrap:anywhere">' + esc(x.title) + '</div></a>'; }).join("") : '<div style="background:var(--card);border:2px solid var(--ink);border-radius:18px;padding:14px 16px">' + (ST.loaded ? 'No notices yet.' : 'Loading notices...') + '</div>') +
    '</div></div></div>' +
    '<div id="boards" class="wrap sec"><h2 style="font-size:34px">Follow your board</h2><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:16px">' + board + '</div></div>' +
    '<div id="updates" class="wrap sec" style="padding-bottom:64px"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px"><h2 style="font-size:34px;margin:0">Fresh from the boards</h2><div class="chips">' + f + '</div></div>' +
    '<div class="grid g3">' + (fresh.length ? fresh.map(function(x){ return noticeCard(x); }).join("") : loadingOrEmpty("No notices of this type yet.")) + '</div>' +
    '<div style="text-align:center;margin-top:32px"><a class="btn dark" href="#/updates" style="display:inline-flex;padding:14px 32px">See all updates</a></div></div>' +
    '<div id="shelf" style="background:var(--shelf);padding:64px 0"><div class="wrap"><h2 style="font-size:34px;margin:0 0 8px">Your study shelf</h2><p style="margin:0 0 28px;color:var(--mut);max-width:560px">Books, syllabus and notes for your class, right next to the notices.</p>' +
    '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))">' +
    '<a href="#/books" style="background:var(--card);border-radius:28px;padding:28px;display:block"><div class="sq" style="width:56px;height:56px;border-radius:18px;background:var(--a3);margin-bottom:16px">'+ico("book",28)+'</div><h3 style="font-size:22px;margin:0 0 6px">NCERT books</h3><div style="color:var(--mut)">Class 1 to 12, subject by subject</div></a>' +
    '<a href="#/syllabus" style="background:var(--card);border-radius:28px;padding:28px;display:block"><div class="sq" style="width:56px;height:56px;border-radius:18px;background:var(--a2);margin-bottom:16px">'+ico("doc",28)+'</div><h3 style="font-size:22px;margin:0 0 6px">Syllabus</h3><div style="color:var(--mut)">Official 2026-27 syllabus, Class 9 to 12</div></a>' +
    '<div style="background:var(--card);border-radius:28px;padding:28px"><div class="sq" style="width:56px;height:56px;border-radius:18px;background:var(--a5);margin-bottom:16px">'+ico("notes",28)+'</div><h3 style="font-size:22px;margin:0 0 6px">Notes <span class="pill" style="background:var(--a4);font-size:13px;margin-left:6px">Coming soon</span></h3><div style="color:var(--mut)">Chapter notes and quick revision sheets</div></div></div></div></div>';
};

function listHtml(){
  var q = ST.q.trim().toLowerCase();
  var shown = ST.items.filter(function(x){
    if (ST.type !== "all" && x.tag !== ST.type) return false;
    if (ST.ub !== "all" && ST.ub !== "CBSE") return false;
    return !q || (x.title + " " + typeOf(x).label + " " + (x.summary || "")).toLowerCase().indexOf(q) !== -1;
  });
  return {n: shown.length, html: shown.length ? shown.map(function(x){ return noticeCard(x); }).join("") : loadingOrEmpty(ST.ub !== "all" && ST.ub !== "CBSE" ? ST.ub + " notices are coming soon." : "No notices found.")};
}
VIEWS.updates = function(r){
  var t = r.q.get("type"); if (t && (t === "all" || TYPES[t])) ST.type = t;
  var qq = r.q.get("q"); if (qq !== null) ST.q = qq;
  var f = [["all","All"]].concat(TYPE_KEYS.map(function(k){ return [k, TYPES[k].plural]; })).map(function(p){
    return '<button class="f" data-act="ut" data-v="' + esc(p[0]) + '" aria-pressed="' + (ST.type === p[0] ? "true" : "false") + '">' + esc(p[1]) + '</button>';
  }).join("");
  var l = listHtml();
  var bf = ["all","CBSE","ICSE","State boards"].map(function(v){ return '<button class="f" data-act="ub" data-v="' + v + '" aria-pressed="' + (ST.ub === v ? "true" : "false") + '">' + (v === "all" ? "All boards" : v) + '</button>'; }).join("");
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Updates</b></div>' +
    '<h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">All updates</h1><p style="margin:0 0 24px;color:var(--mut)">Every CBSE notice, newest first.</p>' +
    '<div class="search" style="max-width:560px;margin-bottom:20px"><label for="uq" style="position:absolute;left:-9999px">Search updates</label><input id="uq" type="search" placeholder="Search updates" value="' + esc(ST.q) + '" autocomplete="off"></div>' +
    '<div class="chips" role="group" aria-label="Board" style="margin-bottom:12px">' + bf + '</div>' +
    '<div class="chips" role="group" aria-label="Type" style="margin-bottom:16px">' + f + '</div>' +
    '<div class="meta" id="ucount" aria-live="polite" style="margin-bottom:16px">Showing ' + l.n + ' notice' + (l.n === 1 ? '' : 's') + '</div><div class="grid g3" id="ulist">' + l.html + '</div></div>';
};

VIEWS.notice = function(r){
  var x = null; ST.items.forEach(function(i){ if (i.id === r.arg) x = i; });
  if (!x) return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/updates">Updates</a></div><h1 id="pg" tabindex="-1" style="font-size:clamp(30px,5vw,48px)">' + (ST.loaded ? 'Notice not found' : 'Loading...') + '</h1><p style="color:var(--mut)">' + (ST.loaded ? 'This notice may have been removed. <a href="#/updates" style="text-decoration:underline;font-weight:700">See all updates</a>.' : '') + '</p></div>';
  var t = typeOf(x), url = safeUrl(x.url);
  var more = ST.items.filter(function(i){ return i.id !== x.id; });
  more = more.filter(function(i){ return i.tag === x.tag; }).concat(more.filter(function(i){ return i.tag !== x.tag; })).slice(0, 3);
  return '<div class="wrap sec" style="padding-bottom:64px"><div class="crumb"><a href="#/home">Home</a> / <a href="#/updates">Updates</a> / <b>' + esc(t.label) + '</b></div>' +
   '<div style="display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start"><div style="flex:1 1 560px;min-width:0;display:flex;flex-direction:column;gap:28px">' +
   '<div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px">' + pill(x, (isNew(x.date) ? '<span class="pill" style="background:var(--a3)">New</span>' : '') + '<span style="font-weight:700;font-size:15px">CBSE</span>') + '</div>' +
   '<h1 id="pg" tabindex="-1" style="font-size:clamp(28px,4.6vw,46px);line-height:1.15;overflow-wrap:anywhere">' + esc(x.title) + '</h1></div>' +
   '<div class="info"><div><small>Published</small><div>' + esc(fmt(x.date)) + '</div></div><div><small>Type</small><div>' + esc(t.label) + '</div></div><div><small>Board</small><div>CBSE</div></div><div><small>Source</small><div>' + esc(host(url)) + '</div></div></div>' +
   (x.summary ? '<div style="background:var(--a4);border:2px solid var(--ink);border-radius:28px;padding:24px;box-shadow:0 6px 0 var(--ink)"><h2 style="font-size:24px;margin:0 0 12px">In short</h2><div>' + esc(x.summary) + '</div></div>' : '') +
   '<div><h2 style="font-size:26px;margin:0 0 14px">The full notice</h2><div class="grid-paper" style="border:2px solid var(--ink);border-radius:28px;min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:24px">' +
   '<svg width="72" height="88" viewBox="0 0 72 88" aria-hidden="true"><path d="M8 4h38l18 18v62H8z" style="fill:var(--a2);stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/><path d="M46 4v18h18" fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/><path d="M20 44h32M20 56h32M20 68h20" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round"/></svg>' +
   '<div class="fr" style="font-weight:500;font-size:20px">The official notice is on ' + esc(host(url)) + '</div><div style="color:var(--mut)">It opens in a new tab. GraphPaper does not host the file.</div></div></div></div>' +
   '<aside style="flex:1 1 280px;max-width:360px;display:flex;flex-direction:column;gap:16px;min-width:0"><a class="btn dark" href="' + esc(url) + '" target="_blank" rel="noopener">Open official notice ↗</a>' +
   '<button class="btn" data-act="share" type="button">Share</button><div id="shmsg" class="meta" role="status" style="text-align:center"></div>' +
   '<div class="badge"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" style="fill:var(--card);stroke:var(--ink)" stroke-width="2"/><path d="M6 10.5l3 3 5-6" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Official source: ' + esc(host(url)) + '</div></aside></div>' +
   '<div style="margin-top:56px"><h2>More from CBSE</h2><div class="grid g3">' + more.map(function(i){ return noticeCard(i, true); }).join("") + '</div></div></div>';
};

var SUBJ = {
  a:["English","Hindi","Mathematics","EVS","Art"], b:["English","Hindi","Mathematics","Science","Social Science","Sanskrit"], c:["English","Hindi","Mathematics","Science","Social Science"],
  Science:["Physics","Chemistry","Mathematics","Biology","English"], Commerce:["Accountancy","Business Studies","Economics","Mathematics","English"], Humanities:["History","Political Science","Geography","Psychology","English"]
};
VIEWS["class"] = function(){
  var c = ST.cls || "4", n = +c, hi = n >= 11;
  var subs, cols = ["--a1","--a2","--a3","--a4","--a5"], s2b = {Physics:"Physics", Chemistry:"Chemistry", Mathematics:"Maths", Biology:"Biology"};
  function card(label, href, icon, col, note){
    var inner = '<span class="ic" style="background:var(' + col + ')">' + icon + '</span><b>' + esc(label) + '</b><span style="color:var(--mut);font-size:15px">' + note + '</span>' + (href ? '<span style="font-weight:700">Open →</span>' : '<span class="pill" style="background:var(--a4);align-self:flex-start;font-size:13px">Coming soon</span>');
    return href ? '<a class="bq" href="' + href + '" style="--sh:var(' + col + ')">' + inner + '</a>' : '<div class="bq" style="--sh:var(' + col + ')">' + inner + '</div>';
  }
  var nb = classBooks(c).filter(streamOk).length;
  var desc = 'Chapter-wise PDFs for ' + (nb ? 'all ' + nb + ' books of ' : '') + 'Class ' + c + (hasStreams(n) ? ' ' + ST.stream : '') + ', linked from the official NCERT site' + (hasFolders(c) ? ', plus a whole-book download for each.' : '.');
  subs = card("NCERT books", !nb && ST.booksLoaded ? "" : '#/books', ico("book"), "--a3", desc);
  var streams = hi ? '<a href="#/welcome" class="pill" style="background:var(--a3);padding:6px 16px;font-size:15px">' + ST.stream + ' \u00b7 Change</a>' : '';
  var more0 = card("Book list", nb ? '#/booklist' : "", ico("doc"), "--a1", 'A printable checklist of every NCERT book for Class ' + c + (hi ? ' ' + ST.stream : '') + ', with its chapter titles.');
  function lk(t, h, col, d){ return '<a class="card" href="' + h + '" style="--sh:var(' + col + ')"><h3 style="font-size:22px">' + t + '</h3><div class="meta">' + d + '</div><span class="more">Open \u2192</span></a>'; }
  var more = "";
  if (n <= 8) more += lk("For parents", "#/parents", "--a5", "How school stages, exams, holding back and report cards work, from official documents.");
  if (n >= 9) more += lk("Syllabus", "#/syllabus", "--a3", 'Official 2026-27 CBSE syllabus for every subject of Class ' + c + (hi ? ' (one PDF covers Class 11 and 12)' : '') + '.');
  if (n === 10 || n === 12) more += lk("Papers", "#/papers", "--a4", "CBSE sample papers with marking schemes, and board question papers from past years.");
  if (n >= 6) more += lk("Question bank", "#/qbank", "--a2", n === 10 || n === 12 ? 'CBSE\'s official question bank and practice questions with marking schemes, plus NCERT Exemplar problems.' : n === 11 ? 'NCERT Exemplar problems for Maths, Physics, Chemistry and Biology.' : 'CBSE competency-based questions and NCERT Exemplar problems.');
  more += '<div class="card" style="--sh:var(--a5)"><h3 style="font-size:22px">Notes <span class="pill" style="background:var(--a4);font-size:13px;margin-left:6px">Coming soon</span></h3><div class="meta">Chapter notes and quick revision sheets.</div></div>';
  var mine = ST.items.filter(function(x){ return classOf(x, c); }).slice(0, 3);
  var latest = '<h2>Latest for Class ' + c + '</h2><div class="grid g3">' + (mine.length ? mine.map(function(x){ return noticeCard(x, true); }).join("") : '<div class="card" style="grid-column:1/-1;box-shadow:0 6px 0 var(--a1)">' + (ST.loaded ? (n <= 8 ? 'CBSE rarely sends notices meant for Classes 1 to 8. <a href="#/updates" style="font-weight:700;text-decoration:underline">See all CBSE updates</a> or read the <a href="#/parents" style="font-weight:700;text-decoration:underline">guide for parents</a>.' : 'No notices that mention Class ' + c + ' yet. <a href="#/updates" style="font-weight:700;text-decoration:underline">See all CBSE updates</a>.') : 'Loading notices...') + '</div>') + '</div>';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Study shelf</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a1)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Class ' + c + (hi ? ' ' + ST.stream : '') + '</h1><p>Books, syllabus and notes for Class ' + c + (hi ? ' ' + ST.stream : '') + ', all on one shelf. <a href="#/welcome" style="font-weight:700;text-decoration:underline">Change class' + (hi ? ' or stream' : '') + '</a></p></div></div>' +
   '<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px"><h2 style="margin:0">NCERT books</h2>' + streams + '</div>' +
   '<div class="grid g3" style="margin-bottom:48px">' + subs + more0 + '</div>' +
   '<h2>More for Class ' + c + (hi ? ' ' + ST.stream : '') + '</h2><div class="grid g3" style="margin-bottom:48px">' + more + '</div>' +
   latest + '</div>';
};

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
function chRows(b, chs){
  return chs.map(function(h){
    var file = h[2], lbl = '<span class="no">' + b.label + ' ' + h[0] + '</span>';
    if (file) return '<div class="chr">' + lbl + '<a class="tt" style="font-weight:700" href="' + pdfUrl(b, file) + '" target="_blank" rel="noopener">' + esc(h[1] || "Open chapter PDF") + '</a><span aria-hidden="true">↗</span></div>';
    return '<div class="chr na">' + lbl + '<span class="tt">' + esc(h[1] || "") + '</span><span></span><small>PDF not found. Open the book on the NCERT site.</small></div>';
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
function bookBlock(b, chs, q, label){
  var col = subCol(b.sub), nm = label || (b.sub === b.title ? b.sub : b.sub + ": " + b.title);
  return '<details class="book" style="--sh:var(' + col + ')"' + (q || ST.bopen[b.code] ? ' open' : '') + ' data-code="' + b.code + '"><summary><span class="bi" style="background:var(' + col + ')">' + subIcon(b.sub) + '</span><span class="bt"><b>' + (b.cls <= 10 || b.fold ? esc(nm) : 'Class ' + b.cls + ' ' + esc(b.title)) + '</b><span>' + chs.length + ' chapter' + (chs.length === 1 ? '' : 's') + (q ? ' match' : '') + '</span></span><svg class="car" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="chs">' + chRows(b, chs) + (q ? '' : extraRows(b)) +
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
  var note = f10 ? 'Every chapter opens on ncert.nic.in. GraphPaper does not host NCERT files. NCERT offers each whole book as a ZIP of chapter PDFs, not as one single PDF.' + (hasStreams(c) ? ' Showing ' + ST.stream + ' books. Tap Change above to pick another stream. English-medium books only for now.' : '') : 'Every chapter opens on ncert.nic.in. GraphPaper does not host NCERT files. English-medium books only for now.';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>NCERT books</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a3)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">NCERT books</h1><p>' + lead + '</p></div></div>' +
   '<div class="search" style="max-width:560px;margin-bottom:16px"><label for="bq" style="position:absolute;left:-9999px">Search chapters</label><input id="bq" type="search" placeholder="Search chapters" value="' + esc(ST.bq) + '" autocomplete="off"></div>' + chips +
   '<div class="grid" id="blist" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));align-items:start">' + booksHtml().html + '</div>' +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">' + note + '</p></div>';
};

var SYLKEY = {"9":"IX", "10":"X", "11":"XI-XII", "12":"XI-XII"};
var SYL2BOOK = {"English Core":"English", "English Elective":"English", "Hindi Core":"Hindi", "Hindi Elective":"Hindi", "Sanskrit Core":"Other books", "Sanskrit Elective":"Other books", "Computer Science":"Other books", "Informatics Practices":"Other books", "Biotechnology":"Other books", "Psychology":"Psychology", "Accountancy":"Accountancy", "Business Studies":"Business Studies", "Economics":"Economics", "History":"History", "Geography":"Geography", "Political Science":"Political Science", "Sociology":"Sociology", "Fine Arts":"Other books", "Home Science":"Other books", "Sanskrit":"Other books", "Vocational Education (Kaushal Vikas)":"Other books", "Physical Education & Well Being":"Other books", "Physical Education":"Other books", "Health and Physical Education":"Other books", "Art Education":"Other books", "Knowledge Tradition - Practices India":"Other books", "Hindi Course-A":"Hindi", "Hindi Course-B":"Hindi", "English - Language and Literature":"English", "Mathematics":"Mathematics", "Science":"Science", "Social Science":"Social Science", "English":"English", "Hindi":"Hindi", "Physics":"Physics", "Chemistry":"Chemistry", "Biology":"Biology"};
var SYL2SUB = {"Sanskrit Core":"Sanskrit", "Sanskrit Elective":"Sanskrit", "Sanskrit":"Sanskrit", "Computer Science":"Computer Science", "Informatics Practices":"Informatics Practices", "Biotechnology":"Biotechnology", "Fine Arts":"Fine Arts", "Home Science":"Home Science", "Vocational Education (Kaushal Vikas)":"Skill Education", "Physical Education & Well Being":"Physical Education", "Physical Education":"Physical Education", "Health and Physical Education":"Physical Education", "Art Education":"Arts", "Knowledge Tradition - Practices India":"Knowledge Traditions"};
function sylBookLink(name, c){
  var sub = SYL2BOOK[name]; if (!sub) return "";
  var want = SYL2SUB[name];
  return classBooks(c).some(function(b){ return foldOf(b) === sub && (!want || b.sub === want) && streamOk(b); }) ? '<small><a href="#/books?sub=' + encodeURIComponent(sub) + '" style="font-weight:700;text-decoration:underline">See NCERT chapters</a></small>' : "";
}
function sylGroups(part, c){
  if (!hasStreams(c)) return part.groups;
  var mine = [], rest = [], out = [];
  part.groups.forEach(function(g){ if (g.name === "Academic subjects") g.items.forEach(function(it){ (inStream(it[0]) ? mine : rest).push(it); }); });
  out.push({name: ST.stream + " subjects", items: mine, open: true});
  part.groups.forEach(function(g){ if (g.name === "Languages" || g.name === "Internal assessment subjects") out.push(g); });
  out.splice(2, 0, {name: "Other subjects", items: rest});
  return out;
}
function sylHtml(c, q){
  var part = SYL.parts[SYLKEY[c]], out = "", n = 0;
  sylGroups(part, c).forEach(function(g, gi){
    var items = g.items.filter(function(it){ return !q || it[0].toLowerCase().indexOf(q) !== -1; });
    if (!items.length) return;
    n += items.length;
    var open = q || g.open || gi === 0 && (g.name === "Main subjects" || g.name === "Academic subjects") || ST.bfold["syl:" + g.name];
    var col = ["--a3", "--a1", "--a4", "--a2"][gi % 4];
    var rows = items.map(function(it){
      return '<div class="chr"><span class="no">PDF</span><a class="tt" style="font-weight:700" href="' + it[1] + '" target="_blank" rel="noopener">' + esc(it[0]) + '</a><span aria-hidden="true">↗</span>' + sylBookLink(it[0], c) + '</div>';
    }).join("");
    out += '<details class="book folder" style="--sh:var(' + col + ')"' + (open ? ' open' : '') + ' data-fold="syl:' + esc(g.name) + '"><summary><span class="bi" style="background:var(' + col + ')">' + ico("doc", 24) + '</span><span class="bt"><b>' + esc(g.name) + '</b><span>' + items.length + ' subject file' + (items.length === 1 ? '' : 's') + (q ? ' match' : '') + '</span></span><svg class="car" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="chs" style="border-top:2px solid var(--gl)">' + rows + '</div></details>';
  });
  return {n:n, html: out || '<div class="card" style="box-shadow:0 6px 0 var(--a1)">No subject found. Try another name.</div>'};
}
ST.sq = "";
VIEWS.syllabus = function(){
  var c = ST.cls || "10", key = SYLKEY[c], body, intro = "";
  var crumb = '<div class="crumb"><a href="#/home">Home</a> / <b>Syllabus</b></div>';
  var cbse = '<a class="btn" href="https://cbseacademic.nic.in/curriculum_2027.html" target="_blank" rel="noopener" style="margin-top:12px">Open CBSE curriculum page ↗</a>';
  if (!key) {
    body = '<div class="card" style="--sh:var(--a3)"><h3 style="font-size:22px">No CBSE syllabus PDFs for Class ' + c + '</h3><div class="meta">CBSE publishes syllabus PDFs for Classes 9 to 12 only. For Class ' + c + ', the NCERT textbooks are the best guide to what is taught.</div><a class="btn dark" href="#/books" style="margin-top:12px">Open NCERT books</a></div>';
  } else if (!SYL) {
    body = '<div class="card" style="--sh:var(--a1)">' + (ST.sylFail ? 'The syllabus list could not be loaded. You can open it on CBSE directly.' + cbse : 'Loading syllabus...') + '</div>';
  } else {
    var part = SYL.parts[key];
    intro = '<a class="card sm" href="' + part.intro + '" target="_blank" rel="noopener" style="--sh:var(--a5);margin-bottom:20px"><h3>Read this first</h3><div class="meta">CBSE\'s introduction to the ' + (key === "XI-XII" ? "senior secondary" : "secondary") + ' curriculum explains how the syllabus, marks and subject groups work.</div><span class="more">Open PDF ↗</span></a>';
    body = intro +
     '<div class="search" style="max-width:560px;margin-bottom:16px"><label for="sq" style="position:absolute;left:-9999px">Search subjects</label><input id="sq" type="search" placeholder="Search subjects" value="' + esc(ST.sq) + '" autocomplete="off"></div>' +
     '<div class="grid" id="slist" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));align-items:start">' + sylHtml(c, ST.sq.trim().toLowerCase()).html + '</div>';
  }
  var lead = !key ? 'CBSE publishes syllabus PDFs for Classes 9 to 12.' : 'Official CBSE syllabus for Class ' + c + ', session 2026-27' + (+c >= 11 ? '. One PDF per subject covers both Class 11 and 12. ' + ST.stream + ' subjects are listed first.' : '. Pick a subject to open its PDF.');
  return '<div class="wrap sec">' + crumb +
   '<div class="head"><div class="tile" style="background:var(--a2)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Syllabus</h1><p>' + lead + '</p></div></div>' + body +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">The PDFs open on cbseacademic.nic.in and are not hosted here. Always check CBSE for changes during the year. <a href="#/updates?type=Syllabus%20Change" style="font-weight:700;text-decoration:underline">See syllabus change notices</a>.</p></div>';
};

var PMAIN = {
  X: /^(science|mathematics|social science|english|hindi|sanskrit|urdu)/i,
  XII: /^(physics|chemistry|biology|mathematics|applied math|english|hindi|accountancy|business studies|economics|history|geography|political science|computer science|informatics|physical education|psychology|sociology)/i
};
ST.pt = "sample"; ST.py = ""; ST.pe = "main"; ST.pq = "";
function chipRow(label, act, opts, cur){
  return '<div class="chips" role="group" aria-label="' + label + '" style="margin-bottom:14px">' + opts.map(function(o){ return '<button class="f" data-act="' + act + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (cur === o[0] ? "true" : "false") + '">' + esc(o[1]) + '</button>'; }).join("") + '</div>';
}
function pillA(href, text){ return '<a href="' + href + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;min-height:40px;padding:4px 14px;border:2px solid var(--ink);border-radius:999px;background:var(--bg);font-weight:700;font-size:15px">' + text + '</a>'; }
function papRows(items, mk, q, cls, open1){
  var main = [], other = [];
  items.forEach(function(it){
    if (q && it[0].toLowerCase().indexOf(q) === -1) return;
    (PMAIN[cls].test(it[0]) && (cls !== "XII" || inStream(it[0])) && !q ? main : other).push(it);
  });
  function grp(name, list, col, open){
    if (!list.length) return "";
    return '<details class="book folder" style="--sh:var(' + col + ')"' + (open || q || ST.bfold["pap:" + name] ? ' open' : '') + ' data-fold="pap:' + name + '"><summary><span class="bi" style="background:var(' + col + ')">' + ico("doc", 24) + '</span><span class="bt"><b>' + name + '</b><span>' + list.length + ' subject' + (list.length === 1 ? '' : 's') + (q ? ' match' : '') + '</span></span><svg class="car" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="chs" style="border-top:2px solid var(--gl)">' +
      list.map(function(it){ return '<div style="padding:12px 0;border-bottom:2px solid var(--gl)"><div style="font-weight:700;margin-bottom:8px;overflow-wrap:anywhere">' + esc(it[0]) + '</div><div style="display:flex;flex-wrap:wrap;gap:8px">' + mk(it) + '</div></div>'; }).join("") + '</div></details>';
  }
  var html = q ? grp("Matching subjects", other, "--a3", true) : grp(cls === "XII" && hasStreams(ST.cls) ? ST.stream + " subjects" : "Main subjects", main, "--a3", true) + grp("Other subjects", other, "--a1", false);
  return html || '<div class="card" style="box-shadow:0 6px 0 var(--a1)">No subject found. Try another name.</div>';
}
function papBody(c){
  var key = c === "10" ? "X" : "XII", q = ST.pq.trim().toLowerCase(), out;
  if (ST.pt === "sample") {
    var sq = PAP.sqp[key];
    out = papRows(sq.items, function(it){
      return (it[1] ? pillA(sq.base + it[1], "Sample paper ↗") : "") + (it[2] ? pillA(sq.base + it[2], "Marking scheme ↗") : "");
    }, q, key);
  } else {
    var years = Object.keys(PAP.pyq[key]).sort().reverse();
    if (years.indexOf(ST.py) < 0) ST.py = years[0];
    var yd = PAP.pyq[key][ST.py];
    if (!yd[ST.pe]) ST.pe = yd.main ? "main" : "comp";
    var slot = yd[ST.pe];
    out = papRows(slot.items, function(it){
      var kind = /\.pdf$/i.test(it[1]) ? "PDF" : "ZIP";
      return pillA(slot.base + it[1], "Download " + kind + (it[2] ? " · " + (it[2] < 1 ? "under 1" : Math.round(it[2])) + " MB" : "") + " ↓");
    }, q, key);
  }
  return out;
}
function papCtl(c){
  var key = c === "10" ? "X" : "XII", html = chipRow("Paper type", "pt", [["sample", "Sample papers 2026-27"], ["pyq", "Previous years"]], ST.pt);
  if (ST.pt === "pyq") {
    var years = Object.keys(PAP.pyq[key]).sort().reverse();
    if (years.indexOf(ST.py) < 0) ST.py = years[0];
    var yd = PAP.pyq[key][ST.py], second = key === "X" && ST.py === "2026";
    html += chipRow("Year", "py", years.map(function(y){ return [y, y]; }), ST.py);
    var ex = [["main", "Main exam"]]; if (yd.comp) ex.push(["comp", second ? "Second board exam" : "Compartment"]);
    html += chipRow("Exam", "pe", ex, ST.pe);
  }
  return html;
}
VIEWS.papers = function(){
  var c = ST.cls || "10", ok = c === "10" || c === "12", body;
  if (!ok) {
    body = '<div class="card" style="--sh:var(--a3)"><h3 style="font-size:22px">Board papers are for Class 10 and 12</h3><div class="meta">CBSE sets board exam papers for Class 10 and Class 12 only. <a href="#/welcome" style="font-weight:700;text-decoration:underline">Change class</a> to see them.</div></div>';
  } else if (!PAP) {
    body = '<div class="card" style="--sh:var(--a1)">' + (ST.papFail ? 'The papers list could not be loaded. You can open CBSE directly.<a class="btn" href="https://www.cbse.gov.in/cbsenew/question-paper.html" target="_blank" rel="noopener" style="margin-top:12px">Open CBSE question papers ↗</a>' : 'Loading papers...') + '</div>';
  } else {
    body = '<div id="pctl">' + papCtl(c) + '</div>' +
      '<div class="search" style="max-width:560px;margin-bottom:16px"><label for="pq" style="position:absolute;left:-9999px">Search subjects</label><input id="pq" type="search" placeholder="Search subjects" value="' + esc(ST.pq) + '" autocomplete="off"></div>' +
      '<div class="grid" id="plist" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));align-items:start">' + papBody(c) + '</div>';
  }
  var lead = !ok ? 'Sample papers and previous years\' board papers, straight from CBSE.' : ST.pt === "sample" ? 'Official CBSE sample papers and marking schemes for the 2026-27 session, Class ' + c + '.' : 'Past board exam question papers for Class ' + c + ', from CBSE.';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Papers</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a4)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Papers</h1><p>' + lead + (ok && hasStreams(c) ? ' ' + ST.stream + ' subjects are listed first.' : '') + '</p></div></div>' + body +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">Every file opens on cbseacademic.nic.in or cbse.gov.in. GraphPaper does not host CBSE papers.' + (ok && ST.pt === "pyq" ? ' Each previous-year file is a ZIP (or PDF) with that subject\'s papers, and may hold more than one set.' : '') + '</p></div>';
};

/* ---------- question bank ---------- */
var QB = null;
ST.qq = "";
function qbGrp(key, name, count, unit, col, inner, q, open){
  if (!inner) return "";
  return '<details class="book folder" style="--sh:var(' + col + ')"' + (open || q || ST.bfold["qb:" + key] ? ' open' : '') + ' data-fold="qb:' + key + '"><summary><span class="bi" style="background:var(' + col + ')">' + ico("doc", 24) + '</span><span class="bt"><b>' + esc(name) + '</b><span>' + count + ' ' + unit + (count === 1 ? '' : 's') + (q ? ' match' : '') + '</span></span><svg class="car" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3l5 5-5 5" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="chs" style="border-top:2px solid var(--gl)">' + inner + '</div></details>';
}
function qbRow(name, pills){
  return '<div style="padding:12px 0;border-bottom:2px solid var(--gl)"><div style="font-weight:700;margin-bottom:8px;overflow-wrap:anywhere">' + esc(name) + '</div><div style="display:flex;flex-wrap:wrap;gap:8px">' + pills + '</div></div>';
}
function qbHit(name, q){ return !q || name.toLowerCase().indexOf(q) > -1; }
function qbMb(m){ return m ? " \u00b7 " + (m < 1 ? "under 1" : Math.round(m)) + " MB" : ""; }
function qbSplit(list, mk){
  var mine = list.filter(function(r){ return inStream(r[0]); }), other = list.filter(function(r){ return !inStream(r[0]); });
  return mine.map(mk).join("") + (other.length ? otherBlk(other.map(mk).join(""), other.length) : "");
}
function qbBody(c){
  var q = ST.qq.trim().toLowerCase(), n = +c, B = QB.base, html = "", cnt;
  if (QB.cbse[c]){
    var rows = QB.cbse[c].filter(function(r){ return qbHit(r[0], q); });
    html += qbGrp("cbse", "CBSE question bank", rows.length, "subject", "--a2", qbSplit(rows, function(r){ return qbRow(r[0], pillA(B.cbse + r[1], "Open PDF" + qbMb(r[2]) + " \u2197")); }), q, true);
  }
  if (QB.apq[c]){
    var ys = Object.keys(QB.apq[c]);
    ys.forEach(function(y, i){
      var rs = QB.apq[c][y].filter(function(r){ return qbHit(r[0], q); });
      html += qbGrp("apq" + y, "Practice questions " + y, rs.length, "subject", "--a4", qbSplit(rs, function(r){ return qbRow(r[0], r[1].map(function(l){ return pillA(B.apq + l[1], esc(l[0]) + " \u2197"); }).join("")); }), q, false);
    });
  }
  if (QB.items[c]){
    var it = QB.items[c].filter(function(r){ return qbHit(r[0], q); });
    html += qbGrp("items", "Competency-based questions", it.length, "subject", "--a1", qbSplit(it, function(r){ return qbRow(r[0], r[1].map(function(l){ return pillA(B.items + l[1], esc(l[0]) + qbMb(l[2]) + " \u2197"); }).join("")); }), q, !QB.cbse[c]);
  }
  if (QB.ex[c]){
    var exOther = "", exN = 0;
    QB.ex[c].forEach(function(sj, i){
      var name = sj[0], hit = qbHit(name, q);
      function list(a){ return a.filter(function(l){ return hit || qbHit(l[0], q); }).map(function(l){ return '<a href="' + B.ex + l[1] + '" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 0;border-bottom:2px solid var(--gl);font-weight:600;overflow-wrap:anywhere"><span>' + esc(l[0]) + '</span><span style="flex:none">\u2197</span></a>'; }).join(""); }
      var en = list(sj[1]), hi = list(sj[2]);
      if (!en && !hi) return;
      var inner = en + (hi ? '<div style="font-weight:700;margin:16px 0 0;padding-bottom:4px">\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi medium)</div>' + hi : "");
      var eg = qbGrp("ex" + name, "NCERT Exemplar: " + name, (sj[1].length + sj[2].length), "file", "--a3", inner, q, false);
      if (inStream(name)) html += eg; else { exOther += eg; exN++; }
    });
    if (exOther) html += otherBlk('<div style="display:grid;gap:16px;margin-top:8px">' + exOther + '</div>', exN);
  }
  return html || '<div class="card" style="box-shadow:0 6px 0 var(--a1)">Nothing found. Try another subject name.</div>';
}
VIEWS.qbank = function(){
  var c = ST.cls || "10", n = +c, ok = n >= 6, body;
  if (!ok){
    body = '<div class="card" style="--sh:var(--a3)"><h3 style="font-size:22px">Question banks start from Class 6</h3><div class="meta">CBSE and NCERT publish question banks and exemplar problems from Class 6 onward. For Class ' + c + ', the NCERT books are the best practice. <a href="#/welcome" style="font-weight:700;text-decoration:underline">Change class</a> if you need.</div></div>';
  } else if (!QB){
    body = '<div class="card" style="--sh:var(--a1)">' + (ST.qbFail ? 'The question bank list could not be loaded. You can open CBSE directly.<a class="btn" href="https://cbseacademic.nic.in/" target="_blank" rel="noopener" style="margin-top:12px">Open CBSE Academic ↗</a>' : 'Loading question bank...') + '</div>';
  } else {
    body = '<div class="search" style="max-width:560px;margin-bottom:16px"><label for="qq" style="position:absolute;left:-9999px">Search subjects</label><input id="qq" type="search" placeholder="Search subjects" value="' + esc(ST.qq) + '" autocomplete="off"></div>' +
      '<div class="grid" id="qlist" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));align-items:start">' + qbBody(c) + '</div>';
  }
  var lead = !ok ? 'Question banks and practice questions, straight from CBSE and NCERT.' : n === 10 || n === 12 ? 'CBSE\'s own question bank and practice questions with marking schemes, plus NCERT Exemplar problems for Class ' + c + '.' : n === 11 ? 'NCERT Exemplar problems for Class 11 Maths, Physics, Chemistry and Biology.' : 'CBSE competency-based questions and NCERT Exemplar problems for Class ' + c + '.';
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <b>Question bank</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a2)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Question bank</h1><p>' + lead + (hasStreams(c) ? ' ' + ST.stream + ' subjects are listed first.' : '') + '</p></div></div>' + body +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">Every file opens on cbseacademic.nic.in or ncert.nic.in. GraphPaper does not host them.' + (ok && (n === 10 || n === 12) ? ' CBSE adds practice questions by session, so the newest ones may take a while to appear here.' : '') + '</p></div>';
};

var BOARDS = {
  "CBSE":{c:"--a1", l:"C", soon:false, url:"https://www.cbse.gov.in/", line:"The Central Board of Secondary Education runs the Class 10 and 12 board exams and publishes circulars, date sheets and results."},
  "ICSE":{c:"--a4", l:"I", soon:true, line:"ICSE notices are not on GraphPaper yet."},
  "State boards":{c:"--a2", l:"S", soon:true, line:"State board notices are not on GraphPaper yet."}
};
VIEWS.board = function(r){
  var name = BOARDS[r.arg] ? r.arg : "CBSE", b = BOARDS[name];
  var btns, body = "";
  if (b.soon) {
    btns = '<a class="btn dark" href="#/board/CBSE" style="display:inline-flex">See CBSE notices</a>';
    body = '<div class="card" style="--sh:var(--a4)"><h3 style="font-size:22px">Coming soon</h3><div class="meta">For now GraphPaper covers CBSE notices and NCERT books for Class 1 to 12.</div></div>';
  } else {
    btns = '<a class="btn dark" href="' + b.url + '" target="_blank" rel="noopener" style="display:inline-flex">Open official site ↗</a>';
    var counts = TYPE_KEYS.map(function(k){ var n = ST.items.filter(function(x){ return x.tag === k; }).length; return '<a class="card sm" href="#/updates?type=' + encodeURIComponent(k) + '" style="--sh:var(' + TYPES[k].c + ')"><h3>' + TYPES[k].plural + '</h3><div class="meta">' + n + ' notice' + (n === 1 ? '' : 's') + '</div><span class="more">See all →</span></a>'; }).join("");
    body = '<h2>Browse CBSE by type</h2><div class="grid g4" style="margin-bottom:48px">' + counts + '</div><h2>Latest from CBSE</h2><div class="grid g3">' + (ST.items.length ? ST.items.slice(0, 3).map(function(x){ return noticeCard(x, true); }).join("") : loadingOrEmpty("No notices yet.")) + '</div>';
  }
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/home?s=boards">Boards</a> / <b>' + esc(name) + '</b></div>' +
   '<div class="head"><div class="tile" style="background:var(' + b.c + ')">' + b.l + '</div><div style="flex:1 1 320px;min-width:0"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">' + esc(name) + '</h1><p style="margin-bottom:14px">' + esc(b.line) + '</p>' +
   (b.url ? '<div class="badge" style="margin-bottom:18px">Official source: ' + esc(host(b.url)) + '</div>' : '') + '<div style="display:flex;flex-wrap:wrap;gap:12px">' + btns + '</div></div></div>' + body + '</div>';
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
   ["Not an official website", "GraphPaper is not run by CBSE, NCERT or any other board. Notices and dates can change, so always confirm them at the official source before you act on them."],
   ["Other people's files", "GraphPaper does not host board or NCERT files. Links open the official sites, which have their own terms."],
   ["No promises", "We try to keep things correct and current, but we cannot promise that nothing is missing or out of date. If you spot a mistake, please tell us from the Contact page."],
   ["Changes", "We may update these terms as GraphPaper grows. The latest version is always on this page."]]);
};

VIEWS.parents = function(){
  return legal('For parents', 'Plain answers for parents of children in Classes 1 to 8, taken from official documents. Each answer says where it comes from.', [["How school is divided", "The National Education Policy 2020 (paragraph 4.1) splits school into four stages:<br><br><b>Foundational:</b> ages 3 to 8, three years of pre-school and then Classes 1 and 2.<br><b>Preparatory:</b> Classes 3 to 5, ages 8 to 11.<br><b>Middle:</b> Classes 6 to 8, ages 11 to 14.<br><b>Secondary:</b> Classes 9 to 12, ages 14 to 18, in two phases: Classes 9 to 10 and Classes 11 to 12.<br><br>The policy says these are teaching stages, so schools do not have to change their buildings or split into separate schools (paragraph 4.3). Source: <a href=\"https://static.pib.gov.in/WriteReadData/userfiles/NEP_Final_English_0.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">NEP 2020</a>."], ["Are there board exams?", "CBSE board exams are for Classes 10 and 12. The NEP says \"Board exams for Grades 10 and 12 will be continued\" (paragraph 4.37). There is no CBSE board exam in Classes 1 to 8.<br><br>The NEP also says all students \"will take school examinations in Grades 3, 5, and 8 which will be conducted by the appropriate authority\" (paragraph 4.40). What your child's school actually sets in the other years is the school's own decision, so ask the school. Source: <a href=\"https://static.pib.gov.in/WriteReadData/userfiles/NEP_Final_English_0.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">NEP 2020</a>."], ["What if a child does not pass?", "For years, the rule was no child could be held back in Classes 1 to 8. On 21 December 2024 the Ministry of Education changed the rule for Classes 5 and 8, but only for schools run or controlled by the Central Government (such as Kendriya Vidyalayas) and for schools run by Union Territories without a legislature.<br><br>In those schools, a child who fails the year-end exam gets extra teaching and a re-exam within two months of the results. Only if the child still does not meet the promotion rules is the child kept in the same class. The class teacher is to work with the child and parents on the gaps. The Ministry also says no child can be expelled before finishing elementary education.<br><br>For every other school, the state or union territory decides. The Ministry's release says some states have allowed holding back, while others, including Karnataka, Kerala, Maharashtra and Uttar Pradesh, continue with no holding back from Class 1 to 8. If your child is in a private or state-run school, ask the school which rule it follows. Source: <a href=\"https://pib.gov.in/PressReleseDetailm.aspx?PRID=2087535\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">Ministry of Education press release, December 2024</a>."], ["What is a Holistic Progress Card?", "It is a report card that records more than marks. It has space for input from the child, classmates and parents as well as the teacher, so it is described as a \"360-degree\" view of how a child is doing, and it focuses on what the child can do at that age.<br><br>In December 2023, CBSE issued two sample cards for its schools: one for the foundational years before Class 1, and one for Classes 1 and 2. Schools may use them as they are or change them. NCERT's assessment unit, PARAKH, says it has finished cards for the foundational, preparatory and middle stages. Whether your child's school uses one is the school's choice, so ask. Sources: <a href=\"https://cbseacademic.nic.in/web_material/Notifications/2023/82_Notification_2023.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">CBSE notification, 27 December 2023</a>, <a href=\"https://cbseacademic.nic.in/web_material/Manuals/HPC_TeacherGuide.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">CBSE guide for teachers on the card</a>, <a href=\"https://ncert.nic.in/parakh/about.php\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">PARAKH, NCERT</a>."], ["Questions worth asking your child's school", "<b>Books:</b> does the school use NCERT books, or books from another publisher? You can find every NCERT book for each class on GraphPaper.<br><b>Tests:</b> how often are there tests, and what counts towards the year-end result?<br><b>Report card:</b> does the school use the Holistic Progress Card?<br><b>Holding back:</b> which rule does the school follow for Classes 5 and 8?<br><b>Age for Class 1:</b> the minimum age differs by state or union territory, so confirm it with the school or your state education department before applying."], ["Sources and how up to date this is", "Last checked: 21 October 2026. Rules can change, so treat the official documents as final. GraphPaper is not an official website and does not speak for CBSE, NCERT or the Government.<br><br><a href=\"https://static.pib.gov.in/WriteReadData/userfiles/NEP_Final_English_0.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">National Education Policy 2020 (full text)</a><br><a href=\"https://pib.gov.in/PressReleseDetailm.aspx?PRID=2087535\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">Ministry of Education: amended detention policy, Dec 2024</a><br><a href=\"https://cbseacademic.nic.in/web_material/Notifications/2023/82_Notification_2023.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">CBSE notification on the Holistic Progress Card</a><br><a href=\"https://cbseacademic.nic.in/web_material/Manuals/HPC_TeacherGuide.pdf\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">CBSE Holistic Progress Card guide for teachers</a><br><a href=\"https://ncert.nic.in/parakh/about.php\" target=\"_blank\" rel=\"noopener\" style=\"font-weight:700;text-decoration:underline\">PARAKH, NCERT</a>"]], '21 October 2026');
};
VIEWS.about = function(){
  function sec(t, tx, sh){ return '<section class="card" style="--sh:' + sh + ';gap:8px;border-radius:28px;padding:24px 26px"><h2 style="font-size:24px;margin:0">' + t + '</h2><div>' + tx + '</div></section>'; }
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <b>About</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">About GraphPaper</h1>' +
   '<p style="margin:0 0 28px;color:var(--mut)">Every school notice, in one calm place.</p><div style="display:flex;flex-direction:column;gap:22px">' +
   sec("Our idea", "Students should not have to hunt through several websites for a circular, date sheet or result. GraphPaper gathers the official CBSE notices, sorts them, and links to the original so you can read the real thing.", "var(--a1)") +
   sec("What you will find here", "<b>Notices:</b> CBSE circulars, date sheets, syllabus changes and results.<br><b>Books:</b> NCERT chapter PDFs for Class 1 to 12, linked from ncert.nic.in (English-medium books for now).<br><b>Syllabus:</b> the official 2026-27 syllabus for Physics, Chemistry, Maths and Biology.<br><b>Notes:</b> coming later.", "var(--a3)") +
   '<section style="background:var(--a4);border:2px solid var(--ink);border-radius:28px;padding:24px 26px;box-shadow:0 6px 0 var(--ink)"><h2 style="font-size:24px;margin:0 0 8px">Not an official website</h2><div>GraphPaper is not run by any board. Notices can change, so always check them at the official source before you act on them.</div></section>' +
   '</div></div>';
};
VIEWS.privacy = function(){
  function sec(t, tx){ return '<section class="card" style="--sh:var(--a1);gap:8px;padding:24px 26px"><h2 style="font-size:24px;margin:0">' + t + '</h2><div>' + tx + '</div></section>'; }
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <b>Privacy</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">Privacy</h1>' +
   '<p style="margin:0 0 28px;color:var(--mut)">Short version: GraphPaper does not ask for your name, email or phone number.</p><div style="display:flex;flex-direction:column;gap:22px">' +
   sec("What stays on your device", "There are no accounts and no forms that collect your details. The class you pick is saved in your own browser so the site can remember it. It is never sent to us.") +
   sec("What other services see", "The site is hosted on Vercel, which may keep standard technical logs such as IP addresses. Fonts load from Google Fonts. Links to cbse.gov.in, ncert.nic.in and cbseacademic.nic.in leave this site, and those sites have their own privacy practices.") +
   sec("Your choices", "To forget your class choice, clear this site's data in your browser settings.") + '</div></div>';
};

/* ---------- router ---------- */
var SITE = "https://graphpaper-peach.vercel.app";
var SECT = {books:"books", syllabus:"syllabus", papers:"papers", qbank:"question-bank", booklist:"book-list"};
var SECT_REV = {"books":"books", "syllabus":"syllabus", "papers":"papers", "question-bank":"qbank", "book-list":"booklist"};
function classBase(c){ return "/class-" + c + (hasStreams(c) && ST.streamSet ? "/" + ST.stream.toLowerCase() : ""); }
function toPath(h){
  var m = /^#\/?([^\/?]*)(?:\/([^?]*))?(?:\?(.*))?$/.exec(h || "#/") || [], name = m[1] || "home", arg = m[2] || "", qs = m[3] ? "?" + m[3] : "", p;
  if (name === "home") p = "/";
  else if (name === "notice" || name === "board") p = "/" + name + "/" + arg;
  else if (name === "class") p = classBase(ST.cls || "4");
  else if (name === "books") p = classBase(bcls()) + "/books";
  else if (name === "syllabus" || name === "papers" || name === "qbank" || name === "booklist") p = classBase(ST.cls || "10") + "/" + SECT[name];
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
    r.name = !sec ? "class" : (SECT_REV[sec] && segs.length === i + 1 ? SECT_REV[sec] : "notfound");
    return r;
  }
  r.name = segs.length > 2 ? "notfound" : segs[0]; r.arg = segs[1] || "";
  return r;
}
function go(p, replace){
  history[replace ? "replaceState" : "pushState"](null, "", p);
  route();
}
function rewriteLinks(){
  var as = D.querySelectorAll('a[href^="#/"], a[data-h]');
  for (var i = 0; i < as.length; i++){ var a = as[i]; if (!a.dataset.h) a.dataset.h = a.getAttribute("href"); a.setAttribute("href", toPath(a.dataset.h)); }
}
function clsName(c){ return "Class " + c + (hasStreams(c) ? " " + ST.stream : ""); }
function pageMeta(name, r){
  var T = "GraphPaper: CBSE notices, NCERT books and syllabus", D0 = "CBSE circulars, date sheets and results for Class 1 to 12, with NCERT books and the syllabus, in one place.";
  var c = r.cls || ST.cls, cn = c ? clsName(c) : "", n = c ? +c : 0, m = {t: T, d: D0, ni: false};
  if (name === "welcome"){ m.t = "Welcome | GraphPaper"; m.ni = true; }
  else if (name === "updates"){ m.t = "All CBSE updates | GraphPaper"; m.d = "Every CBSE circular, date sheet, syllabus change and result in one list, newest first."; }
  else if (name === "notice"){
    var x = null; ST.items.forEach(function(i){ if (i.id === r.arg) x = i; });
    if (x){ m.t = x.title + " | GraphPaper"; m.d = x.summary || (typeOf(x).label + " from CBSE dated " + fmt(x.date) + ": " + x.title); } else { m.t = "Notice | GraphPaper"; m.ni = true; }
  }
  else if (name === "class"){ m.t = cn + " study shelf | GraphPaper"; m.d = "NCERT books, syllabus, papers and question bank for " + cn + " (CBSE)."; if (!r.cls) m.ni = true; }
  else if (name === "books"){ m.t = "NCERT books for " + cn + " | GraphPaper"; m.d = "Chapter-wise NCERT PDFs for " + cn + ", linked from the official NCERT site, with a whole-book download for each."; }
  else if (name === "booklist"){ m.t = "NCERT book list for " + cn + " | GraphPaper"; m.d = "A printable checklist of every NCERT textbook for " + cn + " (CBSE), with chapter titles and download links."; }
  else if (name === "syllabus"){ m.t = "CBSE syllabus for " + cn + ", 2026-27 | GraphPaper"; m.d = "Official CBSE syllabus PDFs for " + cn + ", session 2026-27, subject by subject."; if (n < 9) m.ni = true; }
  else if (name === "papers"){ m.t = "CBSE sample papers and previous year papers for " + cn + " | GraphPaper"; m.d = "Official CBSE sample papers with marking schemes and past board question papers for " + cn + "."; if (n !== 10 && n !== 12) m.ni = true; }
  else if (name === "qbank"){ m.t = "CBSE question bank and practice questions for " + cn + " | GraphPaper"; m.d = "CBSE question bank, practice questions and NCERT Exemplar problems for " + cn + "."; if (n < 6) m.ni = true; }
  else if (name === "board"){ var b = BOARDS[r.arg] ? r.arg : "CBSE"; m.t = b + " notices | GraphPaper"; m.d = BOARDS[b].soon ? D0 : "Latest " + b + " circulars, date sheets, syllabus changes and results."; if (BOARDS[b].soon) m.ni = true; }
  else if (name === "parents"){ m.t = "CBSE for parents: Classes 1 to 8 explained | GraphPaper"; m.d = "Plain answers for parents of children in Classes 1 to 8: school stages, board exams, holding back, and the Holistic Progress Card, with official sources."; }
  else if (name === "about" || name === "contact" || name === "terms" || name === "privacy"){ m.t = (TITLES[name] || "GraphPaper"); }
  else if (name === "notfound"){ m.t = "Page not found | GraphPaper"; m.ni = true; }
  return m;
}
function setMeta(name, r){
  var m = pageMeta(name, r), path = location.pathname.replace(/\/+$/, "") || "/", url = SITE + (path === "/" ? "/" : path);
  if (r.q && name === "home" && r.q.get("s")) url = SITE + "/";
  function el(sel, tag, attrs){ var e = $(sel); if (!e){ e = D.createElement(tag); for (var k in attrs) e.setAttribute(k, attrs[k]); D.head.appendChild(e); } return e; }
  D.title = m.t;
  el('meta[name="description"]', "meta", {name:"description"}).setAttribute("content", m.d);
  el('link[rel="canonical"]', "link", {rel:"canonical"}).setAttribute("href", url);
  el('meta[property="og:title"]', "meta", {property:"og:title"}).setAttribute("content", m.t);
  el('meta[property="og:description"]', "meta", {property:"og:description"}).setAttribute("content", m.d);
  el('meta[property="og:url"]', "meta", {property:"og:url"}).setAttribute("content", url);
  var rb = $('meta[name="robots"]');
  if (m.ni){ el('meta[name="robots"]', "meta", {name:"robots"}).setAttribute("content", "noindex"); } else if (rb){ rb.parentNode.removeChild(rb); }
}
function syncFromPath(r){
  if (r.cls && r.cls !== ST.cls) setClass(r.cls);
  if (r.stream && (r.stream !== ST.stream || !ST.streamSet)) setStream(r.stream);
  if (r.cls && hasStreams(r.cls) && !r.stream && ST.streamSet){
    var sec = r.name === "class" ? "" : "/" + SECT[r.name];
    history.replaceState(null, "", classBase(r.cls) + sec + location.search);
  }
}
function applyClass(){
  $("#app").dataset.c = ST.cls;
}
function route(keepScroll){
  var r = parse(), name = r.name;
  if (r.cls){ syncFromPath(r); r = parse(); name = r.name; }
  if (!name) name = "home";
  if (!VIEWS[name]) name = "notfound";
  if (ST.cls && hasStreams(ST.cls) && !ST.streamSet && /^(class|books|syllabus|papers|qbank|booklist)$/.test(name)){ ST.wc = ST.wc || ST.cls; name = "welcome"; }
  if (!keepScroll){
    if (name !== "updates" || !ST.fromSearch){ if (name === "updates" || ST.navFrom === "updates"){ ST.type = "all"; ST.q = ""; ST.ub = "all"; } }
    if (name !== "books"){ ST.bq = ""; ST.bsub = "All"; }
    if (name !== "syllabus") ST.sq = "";
    if (name !== "papers") ST.pq = "";
    if (name !== "qbank") ST.qq = "";
    ST.fromSearch = false; ST.navFrom = name;
  }
  $("#topnav").hidden = $("#foot").hidden = (name === "welcome");
  if (name !== "welcome") applyClass();
  $("#view").innerHTML = VIEWS[name](r);
  rewriteLinks();
  setMeta(name, r);
  if (!keepScroll){
    var s = r.q.get("s"), tgt = s && D.getElementById(s);
    if (tgt) tgt.scrollIntoView({behavior: "smooth"}); else window.scrollTo(0, 0);
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
D.addEventListener("click", function(e){
  var el = e.target.closest("[data-act]"); if (!el) return;
  var a = el.dataset.act, v = el.dataset.v;
  if (a === "setcls"){ setClass(v); route(true); var d = $("#clsmenu"); if (d) d.open = false; }
  else if (a === "print"){ window.print(); }
  else if (a === "wc"){ ST.wc = v; route(true); $("#app").dataset.c = v; }
  else if (a === "copyfeed"){ var fu = $("#feedurl").textContent, cm = $("#copymsg"); if (navigator.clipboard) navigator.clipboard.writeText(fu).then(function(){ cm.textContent = "Copied."; }, function(){ cm.textContent = "Press and hold the address to copy it."; }); else cm.textContent = "Press and hold the address to copy it."; }
  else if (a === "wgo"){ var we = $("#werr"); if (!ST.wc){ we.textContent = "Please pick your class first."; we.hidden = false; return; } if (hasStreams(ST.wc) && !ST.ws){ we.textContent = "Please pick your stream first."; we.hidden = false; return; } setClass(ST.wc); if (hasStreams(ST.wc)) setStream(ST.ws); go("/"); }
  else if (a === "hf"){ ST.hf = v; route(true); }
  else if (a === "ut"){ ST.type = v; route(true); }
  else if (a === "ub"){ ST.ub = v; route(true); }
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
  if (e.target.id === "pq"){ ST.pq = e.target.value; if (PAP) $("#plist").innerHTML = papBody(ST.cls || "10"); return; }
  if (e.target.id === "qq"){ ST.qq = e.target.value; if (QB) $("#qlist").innerHTML = qbBody(ST.cls || "10"); return; }
  if (e.target.id === "sq"){ ST.sq = e.target.value; if (SYL) $("#slist").innerHTML = sylHtml(ST.cls || "10", ST.sq.trim().toLowerCase()).html; return; }
  if (e.target.id === "uq" || e.target.id === "bq"){
    if (e.target.id === "uq"){ ST.q = e.target.value; var l = listHtml(); $("#ulist").innerHTML = l.html; $("#ucount").textContent = "Showing " + l.n + " notice" + (l.n === 1 ? "" : "s"); }
    else { ST.bq = e.target.value; $("#blist").innerHTML = booksHtml().html; }
  }
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
window.addEventListener("popstate", function(){ route(); });
window.addEventListener("hashchange", function(){ if (/^#\//.test(location.hash)) go(toPath(location.hash), true); });

/* ---------- data ---------- */
applyClass();
if (/^#\//.test(location.hash)) history.replaceState(null, "", toPath(location.hash));
route();
function ready(){ if (--ST.pending === 0) window.GP_READY = true; }
fetch("/papers.json").then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ PAP = d; }).catch(function(){ ST.papFail = true; }).then(function(){ if (parse().name === "papers") route(true); ready(); });
fetch("/qbank.json").then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ QB = d; }).catch(function(){ ST.qbFail = true; }).then(function(){ if (parse().name === "qbank") route(true); ready(); });
fetch("/syllabus.json").then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ SYL = d; }).catch(function(){ ST.sylFail = true; }).then(function(){ if (parse().name === "syllabus") route(true); ready(); });
function loadBooks(f){ return fetch(f).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ if (Array.isArray(d)) d.forEach(function(b){ BOOKS.push(b); }); }).catch(function(){}); }
Promise.all([loadBooks("/books_1_8.json"), loadBooks("/books_1_10.json"), loadBooks("/books_9.json"), loadBooks("/books_11.json"), loadBooks("/books_12.json")]).then(function(){ ST.booksLoaded = true; var n = parse().name; if (n === "books" || n === "class" || n === "syllabus") route(true); ready(); });
fetch("/updates.json", {cache: "no-store"}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
  ST.items = (Array.isArray(d) ? d : []).filter(function(x){ return x && x.status === "approved" && !x.sample; }).sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
}).catch(function(){}).then(function(){ ST.loaded = true; route(true); ready(); });
