/* מהאלco · מחשבון ערכי תכן + חיפוש בהנחיות בעמוד אחד
   - שני המקטעים מוצגים יחד (בלי לשוניות)
   - «סינון לפי ספר» נפתח תמיד מקופל; המשתמש יכול לפתוח ידנית */
(function () {
  var calc = document.getElementById('calcView');
  var sv = document.getElementById('searchView');
  if (!calc || !sv) return;

  var tabCalc = document.querySelector('.tab[data-tab="calc"]');
  var tabSearch = document.querySelector('.tab[data-tab="search"]');

  // אתחול מנוע החיפוש (נטען רק במעבר ללשונית) ואז חזרה – שני המקטעים יוצגו בכפייה ב-CSS
  try { if (tabSearch) tabSearch.click(); if (tabCalc) tabCalc.click(); } catch (e) {}
  document.body.classList.add('one-page');

  // כותרות למקטעים במקום הלשוניות
  function head(sec, id, text) {
    if (sec.querySelector(':scope > .op-head')) return;
    var h = document.createElement('h2');
    h.className = 'op-head'; h.id = id; h.textContent = text;
    sec.insertBefore(h, sec.firstChild);
  }
  head(calc, 'calc', 'מחשבון ערכי תכן');
  head(sv, 'search', 'חיפוש לפי ההנחיות');

  // קישור עם ‎#search‎ – גלילה לחיפוש ופוקוס על השדה
  function goSearch() {
    var q = document.getElementById('q');
    sv.scrollIntoView({ block: 'start' });
    if (q) try { q.focus({ preventScroll: true }); } catch (e) {}
  }
  if (location.hash === '#search') {
    setTimeout(goSearch, 60);
    window.addEventListener('load', function () { setTimeout(goSearch, 250); });
  }

  // «סינון לפי ספר» – תמיד מקופל בכניסה (גם אחרי כל רינדור מחדש), אלא אם המשתמש פתח
  var userOpen = false;
  function fold(root) {
    if (!root) return;
    var list = Array.prototype.slice.call(root.querySelectorAll('details'));
    if (root.tagName === 'DETAILS') list.unshift(root);
    list.forEach(function (d) {
      if (d.dataset.opFold) return;
      d.dataset.opFold = '1';
      if (userOpen) d.setAttribute('open', ''); else d.removeAttribute('open');
      var s = d.querySelector(':scope > summary');
      if (s) s.addEventListener('click', function () { userOpen = !d.open; });
    });
  }
  ['docFilters', 'mFilt'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) fold(el);
  });
  var mo = new MutationObserver(function () {
    fold(document.getElementById('docFilters'));
    fold(document.getElementById('mFilt'));
  });
  mo.observe(sv, { childList: true, subtree: true });
})();
