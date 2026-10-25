/* Students (Classes 9 to 12): notices, status tracker, syllabus, papers, question bank, subject and chapter pages, calculator. */
var TRK = null;
try { var trkEl = document.getElementById("trk"); if (trkEl) TRK = JSON.parse(trkEl.textContent); } catch(e){}
function trackerSection(c){
  var n = +c, items = TRK ? TRK.items.filter(function(x){ return x.classes.indexOf(n) > -1; }).slice(0, 4) : [];
  if (!items.length) return "";
  var cards = items.map(function(x){
    var u = x.src.u, ext = /^https?:/.test(u);
    return '<div class="card st-' + esc(x.status) + '" style="--sh:var(--a3)"><h3 style="font-size:20px;margin:0">' + esc(x.q) + '</h3>' +
      '<div><span class="stp"><i aria-hidden="true"></i>' + esc(x.label) + '</span></div>' +
      '<div style="color:var(--mut)">' + esc(x.detail) + '</div>' +
      '<div class="meta" style="margin-top:auto">Source: <a href="' + esc(u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + ' style="text-decoration:underline">' + esc(x.src.t) + '</a> \u00b7 checked ' + esc(fmt(x.asof)) + '</div></div>';
  }).join("");
  return '<div id="status" class="wrap sec" style="padding-bottom:64px"><h2 style="font-size:34px;margin:0 0 8px">Quick status check</h2>' +
    '<p style="margin:0 0 24px;color:var(--mut);max-width:620px">The questions students ask most about Class ' + c + (hasStreams(c) ? ' ' + ST.stream : '') + ', answered automatically from CBSE\u2019s own notices and lists. Last checked ' + esc(fmt(TRK.checked)) + '. Always confirm on cbse.gov.in.</p>' +
    '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr))">' + cards + '</div>' +
    '</div>';
}
function homeReturning(){
  var c = ST.cls;
  if (+c <= 8) return homeParents(c);
  var it = ST.items, latest3 = it.slice(0, 3), cp = homeCopy(c);
  var fresh = it.filter(function(x){ return ST.hf === "all" || x.tag === ST.hf; }).slice(0, 4);
  var f = [["all","All"]].concat(TYPE_KEYS.map(function(k){ return [k, TYPES[k].plural]; })).map(function(p){
    return '<button class="f" data-act="hf" data-v="' + esc(p[0]) + '" aria-pressed="' + (ST.hf === p[0] ? "true" : "false") + '">' + esc(p[1]) + '</button>';
  }).join("");
  return '<div class="wrap hr"><div>' +
    '<a href="#/welcome" class="pill" style="background:var(--a3);padding:6px 16px;font-size:15px">Class ' + c + (hasStreams(c) && ST.streamSet ? ' · ' + ST.stream : '') + ' · CBSE · Change</a>' +
    '<h1 id="pg" tabindex="-1" style="font-size:clamp(32px,5.4vw,60px);line-height:1.1;margin:20px 0 16px">' + cp.h + '</h1>' +
    '<p style="color:var(--mut);margin:0 0 28px;max-width:520px">' + cp.p + '</p>' +
    '<form class="search" data-act="hsearch"><label for="hq" style="position:absolute;left:-9999px">Search notices</label><input id="hq" placeholder="Search notices, e.g. date sheet" autocomplete="off"><button class="go" type="submit">Search</button></form>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:24px;font-weight:700;font-size:15px;align-items:center"><span style="color:var(--mut)">Popular:</span>' +
    '<a class="pill" href="#/updates?type=Circular" style="background:var(--a1);padding:6px 14px;font-size:15px">CBSE circulars</a><a class="pill" href="#/updates?type=Date%20Sheet" style="background:var(--a4);padding:6px 14px;font-size:15px">Date sheets</a><a class="pill" href="#/updates?type=Result" style="background:var(--a5);padding:6px 14px;font-size:15px">Results</a><a class="pill" href="#/calculator" style="background:var(--a3);padding:6px 14px;font-size:15px">Percentage calculator</a></div></div>' +
    '<div style="position:relative;padding:20px"><div style="position:absolute;top:-8px;right:-4px;width:150px;height:150px;border-radius:50%;background:var(--a4)"></div><div style="position:absolute;bottom:-12px;left:0;width:110px;height:110px;border-radius:36px;background:var(--a3);transform:rotate(14deg)"></div>' +
    '<div class="grid-paper" style="position:relative;border:2px solid var(--ink);border-radius:32px;padding:28px;display:flex;flex-direction:column;gap:14px;transform:rotate(-2deg)"><div class="fr" style="font-weight:600;font-size:22px">Latest from CBSE</div>' +
    (latest3.length ? latest3.map(function(x){ return '<a href="' + nurl(x) + '" style="display:block;background:var(--card);border:2px solid var(--ink);border-radius:18px;padding:14px 16px">' + pill(x) + '<div style="margin-top:6px;font-weight:700;overflow-wrap:anywhere">' + esc(x.title) + '</div></a>'; }).join("") : '<div style="background:var(--card);border:2px solid var(--ink);border-radius:18px;padding:14px 16px">' + (ST.loaded ? 'No notices yet.' : 'Loading notices...') + '</div>') +
    '<a class="btn dark" href="#/updates" style="display:flex;justify-content:center;padding:12px 20px">See all updates</a></div></div></div>' +
    trackerSection(c) +
    homeShelf(c);
}

ST.fs = ""; ST.fsub = ""; ST.fy = ""; ST.up = uPreset("");
function ucount(l){ return "Showing " + l.n + " current notice" + (l.n === 1 ? "" : "s") + (l.a ? " and " + l.a + " archived" : ""); }
function listHtml(){
  var f = uFilter(ST.up), card = function(x){ return noticeCard(x); };
  var cur = f.cur.length ? f.cur.map(card).join("") : loadingOrEmpty("No current notices match these filters." + (f.arc.length ? " See the archived notices below." : ""));
  var arc = f.arc.length ? '<details class="arch"' + (!f.cur.length ? ' open' : '') + '><summary>Archived notices (' + f.arc.length + ')</summary><p class="meta" style="margin:-8px 0 16px">Older than about six months. They may be out of date, so check CBSE for newer notices.</p><div class="grid g3">' + f.arc.map(card).join("") + '</div></details>' : '';
  return {n: f.cur.length, a: f.arc.length, html: cur, arc: arc};
}
function uSelect(id, label, opts, val){
  return '<div><div class="flab"><label for="' + id + '">' + label + '</label></div><select id="' + id + '" class="sel"><option value="">All</option>' + opts.map(function(o){ return '<option' + (o === val ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join("") + '</select></div>';
}
VIEWS.updates = function(r){
  var P = uPreset(r.arg); ST.up = P;
  var t = r.q.get("type"); if (!r.arg && t && (t === "all" || TYPES[t])) ST.type = t;
  var qq = r.q.get("q"); if (qq !== null) ST.q = qq;
  var info = UCAT[r.arg];
  var h1 = info ? "CBSE " + info[1] : P.cls ? "CBSE notices for Class " + P.cls : "All updates";
  var lead = info ? info[2] : P.cls ? "Circulars, date sheets, syllabus changes and results that name Class " + P.cls + " in the CBSE notice title. Notices sent to every class may not name one, so check All updates too." : "Every CBSE notice, newest first. Current notices come first, and older ones are archived below.";
  var curT = P.type || (r.arg ? "" : ST.type);
  var cnt = {}; ST.items.forEach(function(x){ cnt[x.tag] = (cnt[x.tag] || 0) + 1; });
  var types = '<a class="f" href="#/updates" aria-current="' + (!r.arg && ST.type === "all" ? "page" : "false") + '">All</a>' + TYPE_KEYS.filter(function(k){ return cnt[k] || curT === k; }).map(function(k){
    return '<a class="f" href="#/updates/' + UCAT_SLUG[k] + '" aria-current="' + (curT === k ? "page" : "false") + '">' + esc(TYPES[k].plural) + '</a>';
  }).join("");
  var cls = [9, 10, 11, 12].filter(function(c){ return uFilter(uPreset("class-" + c), true).cur.length + uFilter(uPreset("class-" + c), true).arc.length; }).map(function(c){ return '<a class="f" href="#/updates/class-' + c + '" aria-current="' + (P.cls === String(c) ? "page" : "false") + '">Class ' + c + '</a>'; }).join("");
  var streams = ["Science", "Commerce", "Humanities"].map(function(v){ return '<button class="f" data-act="uf" data-k="fs" data-v="' + v + '" aria-pressed="' + (ST.fs === v ? "true" : "false") + '">' + v + '</button>'; }).join("");
  var subs = {}, yrs = {};
  ST.items.forEach(function(x){ var m = nmeta(x); m.subjects.forEach(function(s){ subs[s] = 1; }); if (m.year) yrs[m.year] = 1; });
  var l = listHtml();
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / ' + (r.arg && (info || P.cls) ? '<a href="#/updates">Updates</a> / <b>' + esc(h1) + '</b>' : '<b>Updates</b>') + '</div>' +
    '<h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">' + esc(h1) + '</h1><p style="margin:0 0 8px;color:var(--mut);max-width:680px">' + esc(lead) + '</p>' +
    '<p class="meta" style="margin:0 0 24px">' + (CHECKED ? 'CBSE’s notice lists last checked on ' + esc(fmt(CHECKED)) + '. ' : '') + 'A new notice can take a day to appear here, so also look at cbse.gov.in.</p>' +
    '<div class="search" style="max-width:560px;margin-bottom:20px"><label for="uq" style="position:absolute;left:-9999px">Search updates</label><input id="uq" type="search" placeholder="Search updates" value="' + esc(ST.q) + '" autocomplete="off"></div>' +
    '<div class="flab">Type</div><div class="chips" role="group" aria-label="Type" style="margin-bottom:16px">' + types + '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:20px">' + uSelect("uyr", "Exam year", Object.keys(yrs).sort().reverse(), ST.fy) + '</div>' +
    '<div class="meta" id="ucount" aria-live="polite" style="margin-bottom:16px">' + ucount(l) + '</div><div class="grid g3" id="ulist">' + l.html + '</div><div id="uarc">' + l.arc + '</div>' +
    '<p class="meta" style="margin-top:40px">Notices that name a class: ' + cls.replace(/class="f"/g, 'style="text-decoration:underline;font-weight:700;margin-right:12px"') + '</p></div>';
};

VIEWS.notice = function(r){
  var x = findNotice(r.arg);
  if (!x) return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/updates">Updates</a></div><h1 id="pg" tabindex="-1" style="font-size:clamp(30px,5vw,48px)">' + (ST.loaded ? 'Notice not found' : 'Loading...') + '</h1><p style="color:var(--mut)">' + (ST.loaded ? 'This notice may have been removed. <a href="#/updates" style="text-decoration:underline;font-weight:700">See all updates</a>.' : '') + '</p></div>';
  var t = typeOf(x), url = safeUrl(x.url), m = nmeta(x);
  var at = ST.items.indexOf(x), more = ST.items.slice(Math.max(0, at - 2), at).concat(ST.items.slice(at + 1, at + 4)).slice(-4);
  function cell(k, v){ return '<div><small>' + k + '</small><div>' + v + '</div></div>'; }
  var facts = cell("Published", esc(fmt(x.date))) + (CHECKED ? cell("Last checked", esc(fmt(CHECKED))) : "") + cell("Status", m.archived ? "Archived" : "Current") + cell("Type", esc(t.label)) +
    cell("Who it affects", esc(m.affects) + (m.affectsAuto ? ' <span style="font-weight:400;color:var(--mut);font-size:13px">(from the title)</span>' : '')) +
    (x.deadline ? cell("Deadline", esc(x.deadline)) : "") + (m.year ? cell("Exam year", esc(m.year)) : "") + (m.subjects.length ? cell("Subject", esc(m.subjects.join(", "))) : "") + cell("Source", esc(host(url)));
  var typeLink = '<a href="#/updates/' + UCAT_SLUG[x.tag] + '" style="text-decoration:underline;font-weight:700">More CBSE ' + esc(UCAT[UCAT_SLUG[x.tag]][1]) + '</a>';
  var clsLinks = m.classes.filter(function(c){ return c >= 9; }).map(function(c){ return '<a href="#/updates/class-' + c + '" style="text-decoration:underline;font-weight:700">Class ' + c + ' notices</a>'; });
  return '<div class="wrap sec" style="padding-bottom:64px"><div class="crumb"><a href="#/home">Home</a> / <a href="#/updates">Updates</a> / <a href="#/updates/' + UCAT_SLUG[x.tag] + '">' + esc(t.label) + '</a></div>' +
   '<div style="display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start"><div style="flex:1 1 560px;min-width:0;display:flex;flex-direction:column;gap:24px">' +
   '<div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px">' + pill(x, (m.archived ? '<span class="pill tag-arch">Archived</span>' : isNew(x.date) ? '<span class="pill" style="background:var(--a3)">New</span>' : '') + '<span style="font-weight:700;font-size:15px">CBSE</span>') + '</div>' +
   '<h1 id="pg" tabindex="-1" style="font-size:clamp(28px,4.6vw,46px);line-height:1.15;overflow-wrap:anywhere">' + esc(x.title) + '</h1></div>' +
   '<a class="btn dark offbtn" href="' + esc(url) + '" target="_blank" rel="noopener">Open the official notice on ' + esc(host(url)) + ' ↗</a>' +
   (m.archived ? '<div class="card" style="--sh:var(--a4)"><b>This notice is archived.</b> It was published ' + esc(ageText(m)) + ' and may be out of date. Check CBSE for newer notices on the same topic.</div>' : '') +
   '<div class="info">' + facts + '</div>' +
   (x.summary ? '<div style="background:var(--a4);border:2px solid var(--ink);border-radius:28px;padding:24px;box-shadow:0 6px 0 var(--ink)"><h2 style="font-size:24px;margin:0 0 12px">In short</h2><div>' + esc(x.summary) + '</div></div>' : '') +
   '<div class="meta">' + typeLink + (clsLinks.length ? ' · ' + clsLinks.join(' · ') : '') + '</div></div>' +
   '<aside style="flex:1 1 280px;max-width:360px;display:flex;flex-direction:column;gap:16px;min-width:0">' +
   '<button class="btn" data-act="share" type="button">Share</button><div id="shmsg" class="meta" role="status" style="text-align:center"></div>' +
   '<div class="badge"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" style="fill:var(--card);stroke:var(--ink)" stroke-width="2"/><path d="M6 10.5l3 3 5-6" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Official source: ' + esc(host(url)) + '</div>' + relatedBox(x) + '</aside></div>' +
   (more.length ? '<div style="margin-top:48px"><h2 style="font-size:24px">Around the same date</h2><ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px">' + more.map(function(i){ return '<li><a href="' + nurl(i) + '" style="text-decoration:underline;overflow-wrap:anywhere">' + esc(i.title) + '</a> <span class="meta">' + esc(fmt(i.date)) + '</span></li>'; }).join("") + '</ul></div>' : '') + '</div>';
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
  var crumb = '<div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>Syllabus</b></div>';
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
  var key = c === "10" ? "X" : "XII", html = ST.pm ? "" : chipRow("Paper type", "pt", [["sample", "Sample papers 2026-27"], ["pyq", "Previous years"]], ST.pt);
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
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / ' + (ST.pm ? '<a href="#/papers">Papers</a> / <b>' + (ST.pm === "sample" ? "Sample papers" : "Previous years") + '</b>' : '<b>Papers</b>') + '</div>' +
   '<div class="head"><div class="tile" style="background:var(--a4)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">' + (ST.pm === "sample" ? "Sample papers 2026-27" : ST.pm === "pyq" ? "Previous year papers" : "Papers") + '</h1><p>' + lead + (ok && hasStreams(c) ? ' ' + ST.stream + ' subjects are listed first.' : '') + '</p></div></div>' + body +
   (ok && ST.pt === "pyq" ? '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">Each previous-year file is a ZIP (or PDF) with that subject\'s papers, and may hold more than one set.</p>' : '') + '</div>';
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
  return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>Question bank</b></div>' +
   '<div class="head"><div class="tile" style="background:var(--a2)">' + c + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">Question bank</h1><p>' + lead + (hasStreams(c) ? ' ' + ST.stream + ' subjects are listed first.' : '') + '</p></div></div>' + body +
   (ok && (n === 10 || n === 12) ? '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">CBSE adds practice questions by session, so the newest ones may take a while to appear here.</p>' : '') + '</div>';
};

/* ---------- subject pages (Class 9 to 12) ---------- */
function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
var SUBALIAS = {"Mathematics":"(mathematics|applied math)", "Social Science":"social science"};
function subRe(f){ return new RegExp("^" + (SUBALIAS[f] || f.toLowerCase().replace(/[^a-z0-9 ]/g, ""))); }
function subjectFolds(c, byStream){
  var seen = [];
  classBooks(c).forEach(function(b){ var f = foldOf(b); if (f !== "Other books" && (!byStream || streamOk(b)) && seen.indexOf(f) < 0) seen.push(f); });
  var od = hasStreams(c) ? (byStream ? FOLD12S[(ST.stream || "Science").charAt(0)] : FOLD12) : FOLD10;
  return seen.sort(function(a, b){ var x = od.indexOf(a), y = od.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
}
function subjectOf(r){
  var c = r.cls || ST.cls, found = null;
  if (!c || +c < 9) return null;
  subjectFolds(c, false).forEach(function(f){ if (slug(f) === r.arg) found = f; });
  return found;
}
function subHit(re){ return function(r){ return re.test(String(r[0]).toLowerCase()); }; }
function subSyl(c, re){
  var out = [];
  SYL.parts[SYLKEY[c]].groups.forEach(function(g){ g.items.forEach(function(it){ if (re.test(it[0].toLowerCase())) out.push(it); }); });
  return out;
}
function subSample(c, re){
  var sq = PAP.sqp[c === "10" ? "X" : "XII"];
  return sq.items.filter(subHit(re)).map(function(it){
    return qbRow(it[0], (it[1] ? pillA(sq.base + it[1], "Sample paper \u2197") : "") + (it[2] ? pillA(sq.base + it[2], "Marking scheme \u2197") : ""));
  });
}
function subPyq(c, re){
  var key = c === "10" ? "X" : "XII", out = "", cnt = 0;
  Object.keys(PAP.pyq[key]).sort().reverse().forEach(function(y){
    var yd = PAP.pyq[key][y], pills = "";
    ["main", "comp"].forEach(function(e){
      var slot = yd[e]; if (!slot) return;
      var hits = slot.items.filter(subHit(re));
      hits.forEach(function(it){
        var kind = /\.pdf$/i.test(it[1]) ? "PDF" : "ZIP", lab = e === "main" ? "Main exam" : (key === "X" && y === "2026" ? "Second board exam" : "Compartment");
        pills += pillA(slot.base + it[1], lab + (hits.length > 1 ? " \u00b7 " + esc(it[0]) : "") + " \u00b7 " + kind + (it[2] ? " \u00b7 " + (it[2] < 1 ? "under 1" : Math.round(it[2])) + " MB" : "") + " \u2193");
        cnt++;
      });
    });
    if (pills) out += qbRow(y, pills);
  });
  return {n: cnt, html: out};
}
function subExList(a){
  return a.map(function(l){ return '<a href="' + QB.base.ex + l[1] + '" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 0;border-bottom:2px solid var(--gl);font-weight:600;overflow-wrap:anywhere"><span>' + esc(l[0]) + '</span><span style="flex:none">\u2197</span></a>'; }).join("");
}
function subQb(c, re, sg){
  var B = QB.base, out = [], hit = subHit(re), k = sg + ":";
  if (QB.cbse[c]){ var rows = QB.cbse[c].filter(hit); out.push(qbGrp(k + "cbse", "CBSE question bank", rows.length, "file", "--a2", rows.map(function(r){ return qbRow(r[0], pillA(B.cbse + r[1], "Open PDF" + qbMb(r[2]) + " \u2197")); }).join(""), "", false)); }
  if (QB.apq[c]) Object.keys(QB.apq[c]).forEach(function(y){
    var rs = QB.apq[c][y].filter(hit);
    out.push(qbGrp(k + "apq" + y, "Practice questions " + y, rs.length, "file", "--a4", rs.map(function(r){ return qbRow(r[0], r[1].map(function(l){ return pillA(B.apq + l[1], esc(l[0]) + " \u2197"); }).join("")); }).join(""), "", false));
  });
  if (QB.items[c]){ var it = QB.items[c].filter(hit); out.push(qbGrp(k + "items", "Competency-based questions", it.length, "file", "--a1", it.map(function(r){ return qbRow(r[0], r[1].map(function(l){ return pillA(B.items + l[1], esc(l[0]) + qbMb(l[2]) + " \u2197"); }).join("")); }).join(""), "", false)); }
  if (QB.ex[c]) QB.ex[c].filter(hit).forEach(function(sj){
    var inner = subExList(sj[1]) + (sj[2].length ? '<div style="font-weight:700;margin:16px 0 0;padding-bottom:4px">\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi medium)</div>' + subExList(sj[2]) : "");
    out.push(qbGrp(k + "ex", "NCERT Exemplar: " + sj[0], sj[1].length + sj[2].length, "file", "--a3", inner, "", false));
  });
  return out.join("");
}
function subjectLead(c, f, bks, chn, n){
  var cn = "Class " + c + " " + f;
  if (!bks.length) return cn + " has no NCERT book on the official site. The syllabus and practice questions are below.";
  var first = "", last = "";
  var all = []; bks.forEach(function(b){ b.ch.forEach(function(h){ if (h[1]) all.push(h[1]); }); });
  if (all.length > 3){ first = all[0]; last = all[all.length - 1]; }
  var out = cn + " has " + (bks.length === 1 ? "one NCERT book" : (["", "", "two", "three", "four", "five"][bks.length] || bks.length) + " NCERT books (" + bks.map(function(b){ return esc(b.short || b.title); }).join(" and ") + ")") + " with " + chn + " chapters" + (first ? ", from " + esc(first) + " to " + esc(last) : "") + ".";
  var extra = [];
  if (n === 10 || n === 12) extra.push("sample papers and past board papers");
  else extra.push("a question bank");
  return out + " Below you will also find the syllabus, " + extra[0] + " and your chapter progress.";
}
VIEWS.subject = function(r){
  var c = r.cls || ST.cls || "10", n = +c, f = subjectOf(r), cn = "Class " + c;
  var crumb = '<div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>' + (f ? esc(f) : 'Subject') + '</b></div>';
  if (!f){
    return '<div class="wrap sec">' + crumb + '<h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px)">' + (ST.booksLoaded ? 'Subject not found' : 'Loading...') + '</h1>' +
      '<div class="card" style="--sh:var(--a1)">' + (ST.booksLoaded ? 'There is no such subject page for ' + cn + '. <a href="#/class" style="font-weight:700;text-decoration:underline">Go to the study shelf</a>.' : 'Loading books...') + '</div></div>';
  }
  var sg = slug(f), re = subRe(f), col = subCol(f), cards = [];
  var bks = classBooks(c).filter(function(b){ return foldOf(b) === f; });
  if (n === 10) bks.sort(function(x, y){ return ORDER10.indexOf(x.code) - ORDER10.indexOf(y.code); });
  var chn = 0; bks.forEach(function(b){ chn += b.ch.length; });
  bks.forEach(function(b){ cards.push(bookBlock(b, b.ch, "", bks.length > 1 ? (b.short || b.title) : undefined, true)); });
  var loading = (!SYL && !ST.sylFail) || (!PAP && !ST.papFail && (n === 10 || n === 12)) || (!QB && !ST.qbFail);
  if (SYL){
    var sy = subSyl(c, re);
    cards.push(qbGrp(sg + ":syl", "Syllabus 2026-27", sy.length, "file", "--a3", sy.map(function(it){ return '<div class="chr"><span class="no">PDF</span><a class="tt" style="font-weight:700" href="' + it[1] + '" target="_blank" rel="noopener">' + esc(it[0]) + '</a><span aria-hidden="true">\u2197</span></div>'; }).join(""), "", true));
  }
  if (PAP && (n === 10 || n === 12)){
    var sm = subSample(c, re); cards.push(qbGrp(sg + ":sqp", "Sample papers 2026-27", sm.length, "paper", "--a4", sm.join(""), "", true));
    var py = subPyq(c, re); cards.push(qbGrp(sg + ":pyq", "Past board papers", py.n, "file", "--a1", py.html, "", false));
  }
  if (QB && n >= 9) cards.push(subQb(c, re, sg));
  var others = subjectFolds(c, false).filter(function(x){ return x !== f; });
  var lead = subjectLead(c, f, bks, chn, n);
  return '<div class="wrap sec">' + crumb +
   '<div class="head"><div class="tile" style="background:var(' + col + ')">' + subIcon(f) + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,54px)">' + cn + ' ' + esc(f) + '</h1><p>' + lead + '</p></div></div>' +
   '<div class="card" style="--sh:var(--a3);gap:10px;margin-bottom:22px;padding:20px 24px"><div data-prog="sub" data-c="' + c + '" data-f="' + esc(f) + '" style="display:flex;flex-direction:column;gap:10px">' + progInner(c, f) + '</div><div class="meta">Tick chapters as you finish them. Saved only on this device.</div></div>' +
   '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));align-items:start">' + cards.join("") + '</div>' +
   (loading ? '<div class="card" style="--sh:var(--a1);margin-top:20px">Loading the syllabus, papers and practice questions...</div>' : '') +
   (others.length ? '<h2 style="margin-top:48px">More ' + cn + ' subjects</h2><div style="display:flex;flex-wrap:wrap;gap:10px">' + others.map(function(x){ return '<a class="pill" href="#/subject/' + slug(x) + '" style="background:var(' + subCol(x) + ');padding:6px 16px;font-size:15px">' + esc(x) + '</a>'; }).join("") + '</div>' : '') +
   '<p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">' + (hasStreams(c) ? 'The syllabus PDF covers both Class 11 and 12. ' : '') + '<a href="#/class" style="font-weight:700;text-decoration:underline">Back to the study shelf</a></p></div>';
};

/* ---------- calculator ---------- */
function calcRow(i){
  return '<div class="crow"><span class="cn">' + i + '</span><input inputmode="decimal" data-calc="o" aria-label="Marks obtained, subject ' + i + '" placeholder="Marks"><span aria-hidden="true">/</span><input inputmode="decimal" data-calc="m" value="100" aria-label="Out of, subject ' + i + '"><button class="rm" type="button" data-act="calcrm" aria-label="Remove subject ' + i + '">×</button></div>';
}
function num(v){ var x = parseFloat(String(v).replace(",", ".")); return isFinite(x) ? x : null; }
function fx(x){ return (Math.round(x * 100) / 100).toString(); }
function calcRun(){
  var out = $("#calcout"); if (!out) return;
  var list = [], bad = 0, best = +($('[data-calc="best"]') || {}).value || 0;
  D.querySelectorAll("#calc .crow").forEach(function(r){
    var o = num(r.querySelector('[data-calc="o"]').value), m = num(r.querySelector('[data-calc="m"]').value);
    if (o === null || m === null) return;
    if (m <= 0 || o < 0 || o > m){ bad++; return; }
    list.push({o: o, m: m});
  });
  if (best && list.length > best){ list.sort(function(a, b){ return b.o / b.m - a.o / a.m; }); list = list.slice(0, best); }
  var warn = bad ? '<p class="meta" style="margin:10px 0 0">' + bad + ' subject' + (bad === 1 ? ' was' : 's were') + ' left out: marks must be between 0 and the maximum.</p>' : "";
  if (!list.length){ out.innerHTML = '<span class="meta">Type your marks to see the percentage.</span>' + warn; return; }
  var to = 0, tm = 0; list.forEach(function(x){ to += x.o; tm += x.m; });
  out.innerHTML = '<div class="cres">' + fx(to * 100 / tm) + '%</div><div style="margin-top:6px;font-weight:700">' + fx(to) + ' out of ' + fx(tm) + ' in ' + list.length + ' subject' + (list.length === 1 ? '' : 's') + '</div>' + warn;
}
function calcInput(t){
  var k = t.dataset.calc;
  if (k === "cg" || k === "pc"){
    var v = num(t.value), other = $(k === "cg" ? '[data-calc="pc"]' : '[data-calc="cg"]');
    if (v === null || v < 0){ other.value = ""; return; }
    other.value = fx(k === "cg" ? v * 9.5 : v / 9.5);
    return;
  }
  calcRun();
}
VIEWS.calculator = function(){
  var rows = ""; for (var i = 1; i <= 5; i++) rows += calcRow(i);
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <b>Calculator</b></div>' +
   '<h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px);margin-bottom:10px">Percentage calculator</h1>' +
   '<p style="margin:0 0 28px;color:var(--mut)">Work out your percentage from your marks, or convert CGPA. Nothing you type is saved or sent anywhere.</p>' +
   '<div style="display:flex;flex-direction:column;gap:22px">' +
   '<section class="card" id="calc" style="--sh:var(--a3);gap:12px;padding:24px 26px"><h2 style="font-size:24px;margin:0">Marks to percentage</h2><div class="meta" style="margin-bottom:4px">Enter the marks you got and the maximum marks for each subject.</div>' +
   '<div id="crows">' + rows + '</div>' +
   '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center"><button class="btn" type="button" data-act="calcadd" style="padding:10px 20px">Add subject</button>' +
   '<label style="display:flex;align-items:center;gap:8px;font-weight:600">Count <select class="cin" data-calc="best" style="width:auto"><option value="0">all subjects</option><option value="5">best 5</option><option value="4">best 4</option><option value="3">best 3</option></select></label></div>' +
   '<div id="calcout" aria-live="polite" style="margin-top:8px;border-top:2px solid var(--gl);padding-top:16px"><span class="meta">Type your marks to see the percentage.</span></div>' +
   '<div class="meta">Some schools and colleges count only your best five subjects. Check the rule that applies to you.</div></section>' +
   '<section class="card" style="--sh:var(--a1);gap:12px;padding:24px 26px"><h2 style="font-size:24px;margin:0">CGPA and percentage</h2><div class="meta">CBSE says the overall indicative percentage of marks is 9.5 times the CGPA. Type in either box.</div>' +
   '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px"><label style="display:flex;flex-direction:column;gap:6px;font-weight:600">CGPA (out of 10)<input class="cin" inputmode="decimal" data-calc="cg" placeholder="e.g. 9.2"></label>' +
   '<label style="display:flex;flex-direction:column;gap:6px;font-weight:600">Percentage<input class="cin" inputmode="decimal" data-calc="pc" placeholder="e.g. 87.4"></label></div>' +
   '<div class="meta">Source: <a href="https://www.cbse.gov.in/helpline/FAQs.pdf" target="_blank" rel="noopener" style="font-weight:700;text-decoration:underline">CBSE frequently asked questions (PDF) ↗</a>. CBSE calls this figure indicative, so confirm with the school or college that asks for it.</div></section>' +
   '</div><p class="note" style="margin-top:24px;color:var(--mut);font-size:15px">GraphPaper is not run by CBSE. This tool is a helper, and your marksheet is the official record.</p></div>';
};

/* ---------- chapter pages ---------- */
function chapterOf(r){
  var c = r.cls || ST.cls, found = null;
  if (!c || +c < 9) return null;
  classBooks(c).forEach(function(b){
    if (b.code !== r.ck || slug(foldOf(b)) !== r.arg) return;
    b.ch.forEach(function(h, i){ if (h[0] === r.cn) found = {b: b, h: h, i: i}; });
  });
  return found;
}
VIEWS.chapter = function(r){
  var ch = chapterOf(r), c = r.cls || ST.cls || "10";
  if (!ch){
    return '<div class="wrap sec"><div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <b>Chapter</b></div><h1 id="pg" tabindex="-1" style="font-size:clamp(34px,5vw,52px)">' + (ST.booksLoaded ? 'Chapter not found' : 'Loading...') + '</h1>' +
      '<div class="card" style="--sh:var(--a1)">' + (ST.booksLoaded ? 'There is no such chapter. <a href="#/class" style="font-weight:700;text-decoration:underline">Go to the study shelf</a>.' : 'Loading books...') + '</div></div>';
  }
  var b = ch.b, h = ch.h, f = foldOf(b), k = dk(b, h), on = !!DONE[k], col = subCol(f);
  var title = h[1] || (b.label + " " + h[0]);
  var d = 0; b.ch.forEach(function(x){ if (DONE[dk(b, x)]) d++; });
  function nav(x, kind){
    if (!x) return "";
    return '<a class="card sm" href="#/chapter/' + b.code + '-' + x[0] + '" style="--sh:var(' + col + ')"><div class="meta">' + kind + ' · ' + b.label + ' ' + x[0] + '</div><h3>' + esc(x[1] || (b.label + " " + x[0])) + '</h3><span class="more">Open →</span></a>';
  }
  var pdf = h[2] ? '<a class="btn dark" href="' + pdfUrl(b, h[2]) + '" target="_blank" rel="noopener" style="align-self:flex-start">Open chapter PDF ↗</a>' : '<div class="meta">NCERT\'s chapter PDF could not be matched for this chapter.</div><a class="btn" href="' + BPORTAL + '" target="_blank" rel="noopener" style="align-self:flex-start">Open NCERT textbook page ↗</a>';
  var nb = bks_label(b);
  return '<div class="wrap sec" style="max-width:860px"><div class="crumb"><a href="#/home">Home</a> / <a href="#/class">Study shelf</a> / <a href="#/subject/' + slug(f) + '">' + esc(f) + '</a> / <b>' + b.label + ' ' + h[0] + '</b></div>' +
   '<div class="head"><div class="tile" style="background:var(' + col + ')">' + subIcon(f) + '</div><div style="flex:1 1 320px"><h1 id="pg" tabindex="-1" style="font-size:clamp(30px,5vw,48px)">' + esc(title) + '</h1><p>Class ' + c + ' ' + esc(f) + ' · ' + esc(nb) + ' · ' + b.label + ' ' + h[0] + ' of ' + b.ch.length + '</p></div></div>' +
   '<div style="display:flex;flex-direction:column;gap:22px">' +
   '<section class="card" style="--sh:var(' + col + ');gap:12px;padding:24px 26px"><h2 style="font-size:24px;margin:0">Official NCERT chapter</h2>' + pdf + (b.zip ? zipBtn(b).replace('margin-top:12px', 'margin-top:0;align-self:flex-start') : '') + '<div class="meta">Opens on ncert.nic.in. GraphPaper does not host NCERT files.</div></section>' +
   '<section class="card" style="--sh:var(--a3);gap:12px;padding:24px 26px"><h2 style="font-size:24px;margin:0">Your progress</h2><button class="btn' + (on ? '' : ' dark') + '" type="button" data-act="tick" data-k="' + esc(k) + '" data-big="1" aria-pressed="' + (on ? 'true' : 'false') + '" style="align-self:flex-start">' + (on ? 'Done ✓ (tap to undo)' : 'Mark as done') + '</button><div class="meta" data-prog="book" data-code="' + b.code + '">' + d + ' of ' + b.ch.length + ' chapters of this book done</div><div class="meta">Saved only on this device.</div></section>' +
   '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))">' + nav(b.ch[ch.i - 1], "Previous") + nav(b.ch[ch.i + 1], "Next") + '</div>' +
   '<a class="card" href="#/subject/' + slug(f) + '" style="--sh:var(--a4)"><h3 style="font-size:22px">Class ' + c + ' ' + esc(f) + '</h3><div class="meta">All chapters, the 2026-27 syllabus, papers and practice questions for this subject.</div><span class="more">Open →</span></a>' +
   '</div></div>';
};
function bks_label(b){ return b.short || b.title; }
var BOARDS = {
  "CBSE":{c:"--a1", l:"C", soon:false, url:"https://www.cbse.gov.in/", line:"The Central Board of Secondary Education runs the Class 10 and 12 board exams and publishes circulars, date sheets and results."},
  "ICSE":{c:"--a4", l:"I", soon:true, line:"ICSE notices are not on GraphPaper yet."},
  "State boards":{c:"--a2", l:"S", soon:true, line:"State board notices are not on GraphPaper yet."}
};
VIEWS.board = function(r){
  var name = BOARDS[r.arg] ? r.arg : "CBSE", b = BOARDS[name];
  var btns, body = "";
  if (b.soon) {
    btns = '<a class="btn dark" href="#/updates" style="display:inline-flex">See CBSE notices</a>';
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


/* sample papers and previous-year papers each get their own page (same data as Papers) */
function papMode(mode, r){ ST.pm = mode; ST.pt = mode; var h = VIEWS.papers(r); ST.pm = ""; return h; }
VIEWS.sqp = function(r){ return papMode("sample", r); };
VIEWS.pyq = function(r){ return papMode("pyq", r); };
