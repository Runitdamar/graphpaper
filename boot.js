/* Loads the data files and starts the app. Loaded last. */
/* ---------- data ---------- */
applyClass();
if (/^#\//.test(location.hash)) history.replaceState(null, "", toPath(location.hash));
route();
function ready(){ if (--ST.pending === 0) window.GP_READY = true; }
fetch("/papers.json").then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ PAP = d; }).catch(function(){ ST.papFail = true; }).then(function(){ var pn = parse().name; if (pn === "papers" || pn === "sqp" || pn === "pyq" || pn === "subject" || pn === "chapter") route(true); ready(); });
fetch("/qbank.json").then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ QB = d; }).catch(function(){ ST.qbFail = true; }).then(function(){ var qn = parse().name; if (qn === "qbank" || qn === "subject") route(true); ready(); });
fetch("/syllabus.json").then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ SYL = d; }).catch(function(){ ST.sylFail = true; }).then(function(){ var yn = parse().name; if (yn === "syllabus" || yn === "subject") route(true); ready(); });
function loadBooks(f){ return fetch(f).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){ if (Array.isArray(d)) d.forEach(function(b){ BOOKS.push(b); }); }).catch(function(){}); }
Promise.all([loadBooks("/books_1_8.json"), loadBooks("/books_1_10.json"), loadBooks("/books_9.json"), loadBooks("/books_11.json"), loadBooks("/books_12.json")]).then(function(){ ST.booksLoaded = true; if (parse().name !== "welcome") route(true); ready(); });
fetch("/updates.json", {cache: "no-store"}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(d){
  ST.items = (Array.isArray(d) ? d : []).filter(function(x){ return x && x.status === "approved" && !x.sample; }).sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
}).catch(function(){}).then(function(){ ST.loaded = true; route(true); ready(); });
