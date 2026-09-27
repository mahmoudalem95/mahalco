/* Microsoft Clarity, loaded as a file so it passes the pages' Content-Security-Policy.
   Hebrew site → project ylemrb1ou7; English / Arabic → yhq6a92ouj (the ids already used on the home pages).
   The site owner's browser (marked by admin.html) is not recorded. */
(function () {
  try { if (localStorage.getItem('mh-owner') === '1') return; } catch (e) {}
  if (window.clarity) return;                       // page already runs Clarity
  var p = location.pathname, id = /\/(en|ar)\//.test(p) ? 'yhq6a92ouj' : 'ylemrb1ou7';
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', id);
})();
