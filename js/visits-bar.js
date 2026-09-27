/* MAHALCO visit counter (own server, replaces GoatCounter).
   - Every page view sends one small beacon to the mahalco server. No cookies, no IP stored;
     the browser keeps a random visitor id so returning visitors can be counted.
   - The site owner's browser is never counted (set from admin.html).
   - For the owner only, a one-line terminal footer shows this page's counts. */
(function () {
  'use strict';
  var API = 'https://junction-los-api.onrender.com/api/v1/visits';
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  function rid() {
    var a = new Uint8Array(12);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; });
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  var vid = ls.get('mh-vid'); if (!vid) { vid = rid(); ls.set('mh-vid', vid); }
  var owner = ls.get('mh-owner') === '1';
  var path = location.pathname;

  // 1) count this view (never the owner, never bots that don't run JS)
  if (!owner && !/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)) {
    var ref = '';
    try { if (document.referrer) { var h = new URL(document.referrer).hostname; if (h !== location.hostname) ref = h; } } catch (e) {}
    var body = JSON.stringify({ p: path, v: vid, r: ref });
    var sent = false;
    try { sent = navigator.sendBeacon && navigator.sendBeacon(API + '/hit', new Blob([body], { type: 'text/plain' })); } catch (e) {}
    if (!sent) { try { fetch(API + '/hit', { method: 'POST', body: body, keepalive: true, mode: 'no-cors', headers: { 'Content-Type': 'text/plain' } }); } catch (e) {} }
  }

  // 2) owner footer (turned on from admin.html; ?visits=off hides it)
  try {
    var q = new URLSearchParams(location.search).get('visits');
    if (q === 'off') ls.set('mh-visits', '0');
    if (q === 'on') ls.set('mh-visits', '1');
  } catch (e) {}
  var key = ls.get('mh-admin-key');
  var hebrew = /^\/mahalco\/(index\.html)?$|^\/mahalco\/he\//.test(path);   // the footer is for the Hebrew site only
  if (!owner || !key || !hebrew || ls.get('mh-visits') === '0') return;

  function mount() {
    var bar = document.createElement('div');
    bar.id = 'mh-visits-bar'; bar.setAttribute('dir', 'ltr');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;margin:0;' +
      'padding:6px 12px calc(6px + env(safe-area-inset-bottom,0px));background:#0b0e12;color:#7CFC9A;' +
      'font:12.5px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap;overflow-x:auto;' +
      'border-top:1px solid #1f2a22;box-shadow:0 -2px 10px rgba(0,0,0,.35)';
    bar.textContent = 'mahalco:~$ visits ' + path + '  … (server may take ~50 s to wake)';
    document.body.appendChild(bar);
    document.body.style.paddingBottom = (bar.offsetHeight + 4) + 'px';
    fetch(API + '/page', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ key: key, p: path }) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        bar.textContent = 'mahalco:~$ visits ' + path + '  →  views ' + d.total.views + '  ·  visitors ' + d.total.visitors +
          '  ·  returning ' + d.total.returning + '  ·  today ' + d.today.views + ' views / ' + d.today.visitors + ' visitors';
      })
      .catch(function (e) { bar.style.color = '#FF8A80'; bar.textContent = 'mahalco:~$ visits ' + path + '  →  ' + e.message + ' (check the admin key on admin.html)'; });
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
