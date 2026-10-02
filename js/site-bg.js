/* MAHALCO · רקע אחיד לכל הכלים – תואם לרקע העמוד הראשי (index.html) בבוקר (בהיר) ובלילה (כהה).
   אותן העדפות כמו בעמוד הראשי: localStorage 'mh-theme' (auto|light|dark) ו-'mh-glass' (on|off).
   data-remap="1" על תגית הסקריפט = כלי שנבנה כהה בלבד; במצב בהיר הפלטה שלו מומרת לבהירה. */
(function () {
  var d = document.documentElement, K = 'mh-theme', G = 'mh-glass';
  var me = document.currentScript || { dataset: {} };
  var REMAP = me.dataset && me.dataset.remap === '1';
  var OWN = me.dataset && me.dataset.own === '1';      /* לעמוד מתג מראה משלו – רק צובעים את הרקע */
  function rd(k, v) { try { return localStorage.getItem(k) || v; } catch (e) { return v; } }
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };

  /* צבעי הרקע של העמוד הראשי */
  var BG = { light: '#E7E8E3', dark: '#0E1114' };          /* ללא זכוכית */
  var GL = { light: '#E9ECF1', dark: '#0B0D11' };          /* בסיס זכוכית + כתמי צבע */

  function apply() {
    var pref = rd(K, 'auto'); if (!/^(light|dark|auto)$/.test(pref)) pref = 'auto';
    var t = pref === 'auto' ? (mq.matches ? 'dark' : 'light') : pref;
    var gl = rd(G, 'on') === 'on' ? 'on' : 'off';
    if (OWN) { if (!d.getAttribute('data-theme')) d.setAttribute('data-theme', t); if (!d.getAttribute('data-glass')) d.setAttribute('data-glass', gl); }
    else if (!window.MHTheme) {     /* בעמודים עם מתג המראה המשותף – הוא כבר קובע את זה */
      d.setAttribute('data-theme', t); d.setAttribute('data-theme-pref', pref); d.setAttribute('data-glass', gl);
      d.style.colorScheme = t;
    }
    meta();
    if (REMAP) fixWarn();
  }

  function meta() {
    var t = d.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var ms = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < ms.length; i++) { ms[i].removeAttribute('media'); ms[i].setAttribute('content', BG[t]); }
  }

  var css = [
    '@media screen{',
    /* הרקע עצמו – זהה לעמוד הראשי */
    'html[data-theme="light"]{background:' + BG.light + '!important}',
    'html[data-theme="dark"]{background:' + BG.dark + '!important}',
    'html[data-glass="on"][data-theme="light"]{background:' + GL.light + '!important}',
    'html[data-glass="on"][data-theme="dark"]{background:' + GL.dark + '!important}',
    'html[data-theme] body{background:transparent!important}',
    '#mh-site-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;display:none}',
    'html[data-glass="on"] #mh-site-bg{display:block}',
    'html[data-glass="on"][data-theme="light"] #mh-site-bg{background:radial-gradient(38% 34% at 88% 6%,rgba(233,177,47,.42),transparent 72%),radial-gradient(44% 40% at 6% 38%,rgba(64,128,214,.34),transparent 72%),radial-gradient(42% 38% at 72% 94%,rgba(52,170,110,.24),transparent 72%),' + GL.light + '}',
    'html[data-glass="on"][data-theme="dark"] #mh-site-bg{background:radial-gradient(38% 34% at 88% 6%,rgba(233,177,47,.24),transparent 72%),radial-gradient(44% 40% at 6% 38%,rgba(70,120,230,.30),transparent 72%),radial-gradient(42% 38% at 72% 94%,rgba(150,90,220,.20),transparent 72%),' + GL.dark + '}',
    'html[data-glass="on"] #mh-bg{display:none!important}',
    'html[data-glass="off"][data-theme="light"]{--bg:' + BG.light + '}',
    'html[data-glass="off"][data-theme="dark"]{--bg:' + BG.dark + '}',
    '}'
  ];

  if (REMAP) {
    /* כלים כהים בלבד: פלטה בהירה תואמת (כמו בכלי תקני החניה / נפח נתיב קריטי) */
    css.push(
      '@media screen{html.mh-remap[data-theme="light"]{color-scheme:light;',
      '--bg:' + GL.light + ';--card:#FFFFFF;--card-2:#F3F3F7;--field:#FFFFFF;--surface:#FFFFFF;--sunk:#F1F1F5;',
      '--line:rgba(20,20,40,.13);--line-2:rgba(20,20,40,.08);--rule:rgba(20,20,40,.13);--rule2:rgba(20,20,40,.08);',
      '--ink:#1C1B26;--ink-2:#55536A;--ink-3:#807E93;--ink2:#55536A;--ink3:#807E93;',
      '--accent-dim:rgba(232,163,61,.14);--green:#1E8A4C;--ok:#1E8A4C;--ok-bg:rgba(30,138,76,.12);',
      '--danger:#C8372D;--info:#1F5FA8;--mid:#B87308;',
      '--dir-n:#1E9E57;--dir-s:#0E9AB5;--dir-e:#C77F12;--dir-w:#7C5BD6;',
      '--bg-deep:' + GL.light + ';--panel:#FFFFFF;--txt:#1C1B26;--muted:#55536A}',
      /* פסים דביקים שצבעם קשיח בכלים (ספירות / אורך תור) */
      'html.mh-remap[data-theme="light"] :is(.topbar,[data-mount] .topbar,[data-mount] #mTop){background:rgba(244,245,248,.94)!important;border-color:rgba(20,20,40,.1)}',
      'html.mh-remap[data-theme="light"] [data-mount] #mRes{background:rgba(255,255,255,.97)!important;box-shadow:0 -6px 18px rgba(0,0,0,.08)}',
      'html.mh-remap[data-theme="light"].mh-warn-red{--warn:#C8372D;--warn-bg:rgba(200,55,45,.10)}',
      'html.mh-remap[data-theme="light"].mh-warn-amber{--warn:#A86B0C;--warn-bg:rgba(168,107,12,.10)}',
      '}'
    );
    d.classList.add('mh-remap');
  }

  var st = document.createElement('style'); st.id = 'mh-site-bg-css'; st.textContent = css.join('\n');
  (document.head || d).appendChild(st);

  /* --warn הוא אדום בחלק מהכלים וצהוב באחרים – בודקים מה הכלי הגדיר במקור */
  var warnDone = false;
  function fixWarn() {
    if (warnDone || !document.body) return;
    var probe = document.createElement('i'); probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
    d.classList.remove('mh-remap'); document.body.appendChild(probe);
    probe.style.color = 'var(--warn,transparent)';
    var c = getComputedStyle(probe).color; probe.remove(); d.classList.add('mh-remap');
    var m = c.match(/\d+/g); if (!m) return;
    warnDone = true;
    if (+m[0] > 200 && +m[1] < 120) d.classList.add('mh-warn-red'); else if (+m[0] > 200 && +m[1] > 150) d.classList.add('mh-warn-amber');
  }

  function addLayer() {
    meta();
    if (!document.getElementById('mh-site-bg') && document.body) {
      var b = document.createElement('div'); b.id = 'mh-site-bg'; b.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(b, document.body.firstChild);
    }
    if (REMAP) fixWarn();
  }

  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLayer); else addLayer();
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
  window.addEventListener('storage', function (e) { if (e.key === K || e.key === G) apply(); });
  document.addEventListener('mh:theme', function () { meta(); if (REMAP) fixWarn(); });
  if (window.MutationObserver) new MutationObserver(meta).observe(d, { attributes: true, attributeFilter: ['data-theme'] });
})();
