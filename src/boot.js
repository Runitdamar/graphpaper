/* Loads the data files and starts the app. Loaded last. */
/* ---------- data ---------- */
applyClass();
if (/^#\//.test(location.hash)) history.replaceState(null, "", toPath(location.hash));
/* Papers, question bank and syllabus are only fetched when a page needs them. */
var LAZY = {
  papers: ["/papers.json", function(d){ PAP = d; }, "papFail"],
  qbank: ["/qbank.json", function(d){ QB = d; }, "qbFail"],
  syllabus: ["/syllabus.json", function(d){ SYL = d; }, "sylFail"]
};
var NEEDS = {papers:["papers"], sqp:["papers"], pyq:["papers"], qbank:["qbank"], syllabus:["syllabus"], subject:["papers", "qbank", "syllabus"], chapter:["papers", "qbank", "syllabus"]};
var LOADING = {};
ST.inflight = 0;
function ready(){ setBusy(); if (ST.booksLoaded && ST.loaded && !ST.inflight) window.GP_READY = true; }
function needData(name){
  (NEEDS[name] || []).forEach(function(k){
    if (LOADING[k]) return;
    LOADING[k] = 1; ST.inflight++;
    var L = LAZY[k];
    fetch(L[0]).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(L[1]).catch(function(){ ST[L[2]] = true; }).then(function(){
      ST.inflight--;
      if ((NEEDS[parse().name] || []).indexOf(k) > -1) route(true);
      ready();
    });
  });
}
/* A pre-rendered page (every real URL) is already on screen. Keep it as it is until all data has arrived, then redraw once. This also holds for a visitor with saved choices when the page is for their own class, because it is exactly what they would get. Anything else gets the live render straight away. */
try {
  var sv = localStorage.getItem("gp-class"), pr = parse();
  var fresh = !sv && !localStorage.getItem("gp-done") && !localStorage.getItem("gp-stream");
  var same = !!sv && pr.cls === sv && pr.name !== "notfound" && (!hasStreams(sv) || !!pr.stream || pr.name === "subject" || pr.name === "chapter");
  HYD = !!$("#view").firstElementChild && (fresh || same);
} catch(e){ HYD = !!$("#view").firstElementChild; }
route(HYD);
function loadBooks(f){ return fetch(f).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ if (Array.isArray(d)) d.forEach(function(b){ BOOKS.push(b); }); }).catch(function(){}); }
Promise.all([loadBooks("/books_1_8.json"), loadBooks("/books_1_10.json"), loadBooks("/books_9.json"), loadBooks("/books_11.json"), loadBooks("/books_12.json")]).then(function(){ ST.booksLoaded = true; if (parse().name !== "welcome") route(true); ready(); });
fetch("/updates.json", {cache: "no-store"}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
  ST.items = (Array.isArray(d) ? d : []).filter(function(x){ return x && x.status === "approved" && !x.sample; }).sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
}).catch(function(){}).then(function(){ ST.loaded = true; route(true); ready(); });
