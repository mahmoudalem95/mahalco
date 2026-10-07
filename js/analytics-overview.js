/* GA4 overview for admin.html: KPIs, daily trend, top pages, sources, countries, devices, site language.
   Uses the read-only Google sign-in owned by analytics-map.js (it calls MHGAOverview.load / clear). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
  var nf = function (n, d) { return Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: d || 0 }); };
  var lastDaily = [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dur(sec) { sec = Math.round(sec || 0); return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); }
  function m(names) { return names.map(function (n) { return { name: n }; }); }
  function d(names) { return names.map(function (n) { return { name: n }; }); }

  function clear() { $('ga-overview').hidden = true; }

  function load(ctx) {
    var range = [{ startDate: ctx.start, endDate: 'today' }];
    var q = function (body) { body.dateRanges = range; return ctx.run(body); };
    Promise.all([
      q({ metrics: m(['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'engagementRate', 'averageSessionDuration']) }),
      q({ dimensions: d(['date']), metrics: m(['activeUsers', 'sessions', 'screenPageViews']), orderBys: [{ dimension: { dimensionName: 'date' } }], limit: '400' }),
      q({ dimensions: d(['hostName', 'pagePath']), metrics: m(['screenPageViews', 'activeUsers']), orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: '1000' }),
      q({ dimensions: d(['sessionSourceMedium']), metrics: m(['sessions', 'activeUsers']), orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: '12' }),
      q({ dimensions: d(['country']), metrics: m(['activeUsers']), orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit: '12' }),
      q({ dimensions: d(['deviceCategory']), metrics: m(['activeUsers']), orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }] })
    ]).then(function (r) {
      if (!ctx.live()) return;
      var t = r[0][0] || {};
      $('o-users').textContent = nf(t.activeUsers); $('o-new').textContent = nf(t.newUsers);
      $('o-sessions').textContent = nf(t.sessions); $('o-views').textContent = nf(t.screenPageViews);
      $('o-eng').textContent = nf((t.engagementRate || 0) * 100) + '%'; $('o-dur').textContent = dur(t.averageSessionDuration);
      drawChart(r[1].map(function (x) { return { day: x.date.slice(0, 4) + '-' + x.date.slice(4, 6) + '-' + x.date.slice(6), users: x.activeUsers, sessions: x.sessions, views: x.screenPageViews }; }));
      pages(r[2]);
      table('o-sources', r[3], function (x) { return [x.sessionSourceMedium, x.sessions, x.activeUsers]; });
      table('o-countries', r[4], function (x) { return [x.country, x.activeUsers]; });
      table('o-devices', r[5], function (x) { return [{ desktop: 'מחשב', mobile: 'טלפון', tablet: 'טאבלט' }[x.deviceCategory] || x.deviceCategory, x.activeUsers]; });
      $('ga-overview').hidden = false;
    }).catch(function (e) {
      if (!ctx.live() || e.name === 'AbortError') return;
      $('ga-overview').hidden = false; $('o-error').textContent = 'חלק מהסיכום לא נטען: ' + e.message;
    });
    $('o-error').textContent = '';
  }

  function section(host, path) {
    if (/onrender\.com$/.test(host)) return 'כלים בשרת (Render)';
    if (/\/en\//.test(path)) return 'אנגלית';
    if (/\/ar\//.test(path)) return 'ערבית';
    return 'עברית';
  }
  function pages(rows) {
    var top = rows.slice(0, 12), max = Math.max(1, ...top.map(function (p) { return p.screenPageViews; }));
    $('o-pages').innerHTML = top.map(function (p) {
      var label = (/onrender/.test(p.hostName) ? '⧉ ' : '') + p.pagePath.replace(/^\/mahalco/, '');
      return '<div class="bar" title="' + esc(p.hostName + p.pagePath) + ' · ' + nf(p.activeUsers) + ' משתמשים"><span class="lab">' + esc(label) + '</span><span class="val">' + nf(p.screenPageViews) + '</span><div class="track"><div class="fill" style="width:' + (100 * p.screenPageViews / max) + '%"></div></div></div>';
    }).join('') || '<span class="muted">אין נתונים</span>';
    var by = {};
    rows.forEach(function (p) { var k = section(p.hostName, p.pagePath); by[k] = (by[k] || 0) + p.screenPageViews; });
    var list = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).map(function (k) { return { k: k, v: by[k] }; });
    table('o-langs', list, function (x) { return [x.k, x.v]; });
  }
  function table(id, rows, cells) {
    $(id).innerHTML = rows.map(function (x) {
      return '<tr>' + cells(x).map(function (c, i) { return i ? '<td class="n">' + nf(c) + '</td>' : '<td dir="auto">' + esc(c === '(not set)' ? 'לא מזוהה' : c) + '</td>'; }).join('') + '</tr>';
    }).join('') || '<tr><td class="muted">אין נתונים</td></tr>';
  }

  function drawChart(daily) {
    lastDaily = daily;
    var svg = $('o-chart'), W = 900, H = 260, L = 44, R = 12, T = 12, B = 30;
    if (!daily.length) { svg.innerHTML = '<text x="450" y="130" text-anchor="middle" fill="' + css('--muted') + '" font-size="14">אין נתונים בטווח הזה</text>'; return; }
    var n = daily.length, max = Math.max(1, ...daily.map(function (x) { return Math.max(x.views, x.sessions, x.users); }));
    var step = Math.pow(10, Math.floor(Math.log10(max))), nice = Math.ceil(max / step) * step; if (nice / step > 6) step *= 2; nice = Math.ceil(max / step) * step;
    var x = function (i) { return n === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (n - 1); }, y = function (v) { return T + (H - T - B) * (1 - v / nice); };
    var g = '', ink = css('--muted'), grid = css('--grid');
    for (var v = 0; v <= nice + 1e-9; v += step) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="' + grid + '"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="' + ink + '">' + v + '</text>';
    var every = Math.max(1, Math.ceil(n / 8));
    daily.forEach(function (dd, i) { if ((i % every === 0 && n - 1 - i >= every / 2) || i === n - 1) g += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="' + ink + '">' + dd.day.slice(8, 10) + '/' + dd.day.slice(5, 7) + '</text>'; });
    [['views', '--s1'], ['sessions', '--s3'], ['users', '--s2']].forEach(function (s) {
      var col = css(s[1]), pts = daily.map(function (dd, i) { return x(i) + ',' + y(dd[s[0]]); }).join(' ');
      if (s[0] === 'views') g += '<polygon points="' + L + ',' + y(0) + ' ' + pts + ' ' + x(n - 1) + ',' + y(0) + '" fill="' + col + '" fill-opacity=".10"/>';
      g += '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      g += '<circle cx="' + x(n - 1) + '" cy="' + y(daily[n - 1][s[0]]) + '" r="4" fill="' + col + '" stroke="' + css('--card') + '" stroke-width="2"/>';
    });
    g += '<line id="o-xh" x1="0" x2="0" y1="' + T + '" y2="' + (H - B) + '" stroke="' + ink + '" stroke-dasharray="3 3" opacity="0"/>';
    g += '<rect id="o-hit" x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + (H - T - B) + '" fill="transparent"/>';
    svg.innerHTML = g;
    var tip = $('o-tip'), xh = svg.querySelector('#o-xh'), hit = svg.querySelector('#o-hit');
    hit.addEventListener('pointermove', function (ev) {
      var r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width;
      var i = Math.max(0, Math.min(n - 1, Math.round(n === 1 ? 0 : (px - L) / ((W - L - R) / (n - 1))))), dd = daily[i];
      xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.setAttribute('opacity', '.6');
      tip.innerHTML = '<div class="muted">' + dd.day + '</div>צפיות <b>' + nf(dd.views) + '</b><br>ביקורים <b>' + nf(dd.sessions) + '</b><br>משתמשים <b>' + nf(dd.users) + '</b>';
      var bx = x(i) * r.width / W; tip.style.left = Math.min(r.width - tip.offsetWidth - 4, Math.max(4, bx + 12)) + 'px'; tip.style.top = '10px'; tip.style.opacity = 1;
    });
    hit.addEventListener('pointerleave', function () { tip.style.opacity = 0; xh.setAttribute('opacity', '0'); });
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { if (lastDaily.length) drawChart(lastDaily); });

  window.MHGAOverview = { load: load, clear: clear };
})();
