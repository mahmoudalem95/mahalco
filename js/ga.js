/* Google Analytics (G-HGFLQEM5HT), loaded as a file so it passes the pages' Content-Security-Policy.
   The site owner's browser (marked by admin.html) is not tracked. */
(function () {
  var ID = 'G-HGFLQEM5HT';
  try { if (localStorage.getItem('mh-owner') === '1') window['ga-disable-' + ID] = true; } catch (e) {}
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', ID);
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }
})();
