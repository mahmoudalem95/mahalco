/* Visits bar (Hebrew site). Counts the page view with GoatCounter and, for the site owner only,
   shows a one-line terminal-style footer with this page's visit counts.
   Turn it on in a browser:  any-page.html?visits=on   · turn it off:  ?visits=off
   Needs GoatCounter → Settings → "Allow adding visitor counts on your website" to be enabled. */
(function () {
  'use strict';
  var GC = 'https://mahalco.goatcounter.com';
  var KEY = 'mh-visits';

  // 1) count the view (skip if the page already loads GoatCounter)
  if (!document.querySelector('script[data-goatcounter]')) {
    var s = document.createElement('script');
    s.async = true; s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', GC + '/count');
    document.head.appendChild(s);
  }

  // 2) owner switch
  var on = false;
  try {
    var q = new URLSearchParams(location.search).get('visits');
    if (q === 'on') localStorage.setItem(KEY, '1');
    if (q === 'off') localStorage.removeItem(KEY);
    on = localStorage.getItem(KEY) === '1';
  } catch (e) {}
  if (!on) return;

  var path = location.pathname;
  function fmt(v) { return v == null ? '–' : String(v); }
  function get(extra) {
    return fetch(GC + '/counter/' + encodeURIComponent(path) + '.json' + (extra || ''), { cache: 'no-store' })
      .then(function (r) { if (r.status === 404) return { count: '0', count_unique: '0' }; if (!r.ok) throw r.status; return r.json(); });
  }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function mount() {
    var bar = document.createElement('div');
    bar.id = 'mh-visits-bar';
    bar.setAttribute('dir', 'ltr');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483000;margin:0;' +
      'padding:6px 12px calc(6px + env(safe-area-inset-bottom,0px));background:#0b0e12;color:#7CFC9A;' +
      'font:12.5px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap;overflow-x:auto;' +
      'border-top:1px solid #1f2a22;box-shadow:0 -2px 10px rgba(0,0,0,.35);pointer-events:auto';
    bar.textContent = 'mahalco:~$ visits ' + path + '  …';
    document.body.appendChild(bar);
    document.body.style.paddingBottom = (bar.offsetHeight + 4) + 'px';

    Promise.all([get(), get('?start=' + today()).catch(function () { return null; })])
      .then(function (r) {
        var all = r[0], t = r[1];
        bar.textContent = 'mahalco:~$ visits ' + path + '  →  total ' + fmt(all.count) +
          '  ·  unique ' + fmt(all.count_unique) + (t ? '  ·  today ' + fmt(t.count) : '');
      })
      .catch(function (err) {
        bar.style.color = '#FF8A80';
        bar.textContent = 'mahalco:~$ visits ' + path + '  →  no data (' + err + '). Enable "Allow adding visitor counts" in GoatCounter settings.';
      });
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
