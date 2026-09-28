/* GA4 reporting: read-only OAuth; access tokens stay in memory. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var geo = window.MHAnalyticsGeography;
  var token = '', expires = 0, generation = 0, controller, timer, ready = location.protocol !== 'file:';
  var selected = '', current = [], totals = 0, oauthLoading;
  var metrics = ['activeUsers', 'newUsers', 'engagedSessions', 'engagementRate', 'userEngagementDuration', 'eventCount'];
  var scope = 'https://www.googleapis.com/auth/analytics.readonly';
  function saved(k) { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  function message(s, bad) { $('ga-status').textContent = s; $('ga-status').className = bad ? 'err' : 'muted'; }
  function normalize(s) { return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\u0590-\u05ff]/g, ''); }
  function number(n) { var v = Number(n); return Number.isFinite(v) && v >= 0 ? v : 0; }
  function fmt(n) { return n.toLocaleString('he-IL', { maximumFractionDigits: 2 }); }
  function el(tag, text) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; return e; }
  function svg(tag, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function clear() { generation++; if (controller) controller.abort(); $('ga-content').hidden = true; $('ga-list').replaceChildren(); $('ga-detail').replaceChildren(); $('ga-map').replaceChildren(); current = []; }
  function disconnect(revoke) {
    var old = token; token = ''; expires = 0; clearTimeout(timer); clear();
    $('ga-disconnect').hidden = true; $('ga-connect').textContent = 'חיבור ל־Google Analytics';
    message('החיבור ל־Google נותק. אפשר להתחבר מחדש.');
    if (revoke && old && window.google) window.google.accounts.oauth2.revoke(old, function () {});
  }
  function loadOAuth() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
    if (oauthLoading) return oauthLoading;
    oauthLoading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
      script.onload = resolve; script.onerror = function () { script.remove(); oauthLoading = null; reject(new Error('לא ניתן לטעון את הכניסה ל־Google. בדקו חיבור או חסימת דפדפן.')); };
      document.head.append(script);
    });
    return oauthLoading;
  }
  function settings() {
    var property = $('ga-property').value.trim(), client = $('ga-client').value.trim();
    if (!/^\d+$/.test(property) || !/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(client)) {
      $('ga-settings').open = true;
      throw new Error('הזינו מזהה נכס GA4 מספרי ו־OAuth Client ID תקין בהגדרת החיבור.');
    }
    return { property: property, client: client };
  }
  $('ga-property').value = saved('mh-ga-property') || '553070001'; $('ga-client').value = saved('mh-ga-client') || '1004675395061-hjrdjkpqpvahjp3me7q025tdvb4dbr9u.apps.googleusercontent.com';
  $('ga-settings').open = !$('ga-property').value || !$('ga-client').value;
  ['ga-property', 'ga-client'].forEach(function (id) { $(id).addEventListener('change', function () { disconnect(false); }); });
  $('ga-connect').addEventListener('click', function () {
    if (!ready) { message('חיבור Google זמין בדף המנהל באתר, ולא בקובץ שנפתח מהמחשב.', true); return; }
    var config; try { config = settings(); } catch (e) { message(e.message, true); return; }
    // Load GIS on the first click, then request the popup synchronously on the next.
    if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) {
      $('ga-connect').disabled = true; message('טוען כניסה ל־Google…');
      loadOAuth().then(function () { message('מוכן. לחצו שוב על חיבור ל־Google Analytics כדי לבחור חשבון.'); })
        .catch(function (e) { message(e.message, true); }).finally(function () { $('ga-connect').disabled = false; }); return;
    }
    save('mh-ga-property', config.property); save('mh-ga-client', config.client);
    var authGeneration = generation;
    var client = window.google.accounts.oauth2.initTokenClient({
      client_id: config.client, scope: scope, include_granted_scopes: false,
      callback: function (response) {
        if (authGeneration !== generation) return;
        if (response.error || !response.access_token) { message('החיבור ל־Google לא הושלם. נסו להתחבר שוב.', true); return; }
        if (!window.google.accounts.oauth2.hasGrantedAllScopes(response, scope)) { message('נדרשת הרשאת קריאה ל־Google Analytics.', true); return; }
        token = response.access_token; expires = Date.now() + number(response.expires_in) * 1000;
        clearTimeout(timer); timer = setTimeout(function () { disconnect(false); message('הרשאת Google פגה. התחברו מחדש כדי לרענן נתונים.'); }, Math.max(0, expires - Date.now() - 5000));
        $('ga-disconnect').hidden = false; $('ga-connect').textContent = 'החלפת חשבון Google'; $('ga-settings').open = false; load();
      },
      error_callback: function () { message('חלון הכניסה נסגר או נחסם. אפשר לנסות שוב.', true); }
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
  $('ga-disconnect').addEventListener('click', function () { disconnect(true); });
  $('logout').addEventListener('click', function () { disconnect(false); });
  // Google authorizes this report independently of the visits-server admin key.
  if (ready) loadOAuth().catch(function (e) { message(e.message, true); });

  async function report(config, body, signal, accessToken) {
    var response = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/' + config.property + ':runReport', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: signal
    });
    if (!response.ok) {
      var error = new Error(response.status === 401 ? 'הרשאת Google פגה. התחברו מחדש.' : response.status === 403 ? 'אין גישה לדוח. בדקו הרשאת קריאה לנכס והפעלת Google Analytics Data API בפרויקט.' : response.status === 429 ? 'מכסת Google Analytics מוצתה כרגע. נסו שוב מאוחר יותר.' : 'שליפת דוח Analytics נכשלה (HTTP ' + response.status + '). בדקו את מזהה הנכס ונסו שוב.');
      error.status = response.status; throw error;
    }
    var data = await response.json();
    if (!Array.isArray(data.metricHeaders)) throw new Error('התקבלה תשובת Analytics לא תקינה.');
    return data;
  }
  function unpack(report) {
    return (report.rows || []).map(function (row) {
      var item = {};
      (report.dimensionHeaders || []).forEach(function (h, i) { item[h.name] = row.dimensionValues[i].value; });
      report.metricHeaders.forEach(function (h, i) { item[h.name] = number(row.metricValues[i].value); });
      return item;
    });
  }
  async function load() {
    clear();
    if (!ready || !token) return;
    if (Date.now() >= expires - 5000) { disconnect(false); message('הרשאת Google פגה. התחברו מחדש.'); return; }
    var id = generation, config;
    try { config = settings(); } catch (e) { message(e.message, true); return; }
    controller = new AbortController(); var signal = controller.signal, accessToken = token;
    var days = Number($('range').value), start = days === 1 ? 'today' : (days - 1) + 'daysAgo';
    // Apply the same exclusion to city rows and the separate unique-user total.
    var base = {
      dateRanges: [{ startDate: start, endDate: 'today' }],
      metrics: metrics.map(function (name) { return { name: name }; }),
      dimensionFilter: { notExpression: { filter: {
        fieldName: 'city',
        inListFilter: { values: ['Kafr Manda', 'Shefa-Amr'], caseSensitive: false }
      } } }
    };
    message('טוען נתוני Google Analytics לטווח שנבחר…');
    try {
      var cityBody = Object.assign({}, base, { dimensions: [{ name: 'countryId' }, { name: 'region' }, { name: 'city' }], limit: '10000', offset: '0', orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }] });
      var first = await Promise.all([report(config, cityBody, signal, accessToken), report(config, base, signal, accessToken)]);
      var rows = unpack(first[0]), count = number(first[0].rowCount), metadata = [first[0].metadata || {}, first[1].metadata || {}];
      while (rows.length < count) {
        if (rows.length >= 100000) throw new Error('הדוח גדול מדי. בחרו טווח ימים קצר יותר.');
        var next = await report(config, Object.assign({}, cityBody, { offset: String(rows.length) }), signal, accessToken);
        var chunk = unpack(next); if (!chunk.length) throw new Error('הדוח התקבל חלקית. נסו לרענן.');
        metadata.push(next.metadata || {}); rows = rows.concat(chunk);
      }
      if (id !== generation) return;
      totals = (unpack(first[1])[0] || {}).activeUsers || 0;
      current = rows.map(function (r, i) { r.id = String(i); r.point = r.countryId === 'IL' ? geo.cities[normalize(r.city || '')] : null; return r; });
      current.sort(function (a, b) { return b.activeUsers - a.activeUsers; });
      render();
      $('ga-summary').textContent = fmt(totals) + ' משתמשים פעילים בכל המדינות · ללא כפר מנדא ושפרעם · ' + $('range').selectedOptions[0].textContent + ' · נכס ' + config.property;
      var notes = [];
      if (metadata.some(function (m) { return m.subjectToThresholding; })) notes.push('Google עשויה להסתיר נתונים עקב ספי פרטיות.');
      if (metadata.some(function (m) { return m.dataLossFromOtherRow; })) notes.push('חלק מהנתונים אוחדו על ידי Google לשורת other.');
      if (metadata.some(function (m) { return m.samplingMetadatas && m.samplingMetadatas.length; })) notes.push('הדוח כולל נתונים מדגמיים.');
      var timezone = (first[0].metadata || {}).timeZone;
      if (timezone) notes.push('אזור הזמן של הדוח: ' + timezone + '.');
      $('ga-quality').textContent = notes.join(' ');
      $('ga-content').hidden = false;
      message('עודכן מ־Google Analytics בשעה ' + new Date().toLocaleTimeString('he-IL') + (current.length ? '' : ' · אין נתונים בטווח הזה.'));
    } catch (e) {
      if (id !== generation || e.name === 'AbortError') return;
      if (e.status === 401) disconnect(false);
      message(e instanceof TypeError ? 'לא ניתן להתחבר ל־Google Analytics. בדקו חיבור רשת או חסימת דפדפן.' : e.message, true);
    }
  }
  function render() {
    var map = $('ga-map'); map.replaceChildren();
    var defs = svg('defs', {}), clip = svg('clipPath', { id: 'ga-clip' }); clip.append(svg('rect', { width: 430, height: 765 })); defs.append(clip); map.append(defs);
    var layer = svg('g', { 'clip-path': 'url(#ga-clip)' });
    geo.paths.forEach(function (p) { layer.append(svg('path', { d: p.d, fill: p.code === 'ISR' ? 'var(--card)' : 'var(--line)', stroke: 'var(--faint)', 'stroke-width': 0.6, 'fill-rule': 'evenodd' })); });
    map.append(layer);
    var mapped = 0;
    current.forEach(function (r) {
      if (r.point && r.activeUsers > 0) {
        mapped++;
        var marker = svg('circle', { cx: r.point[0], cy: r.point[1], r: 3.4 * Math.sqrt(r.activeUsers), fill: 'var(--s2)', 'fill-opacity': .5, stroke: 'var(--card)', 'stroke-width': .8, 'data-city': r.id });
        marker.style.cursor = 'pointer'; var title = svg('title', {}); title.textContent = r.city + ': ' + fmt(r.activeUsers); marker.append(title);
        marker.addEventListener('click', function () { select(r.id); }); layer.append(marker);
      }
      var b = el('button'); b.type = 'button'; b.className = 'ga-city'; b.dataset.city = r.id;
      var name = (r.city === '(not set)' ? 'עיר לא מזוהה' : r.city) + (r.countryId !== 'IL' ? ' · ' + r.countryId : '') + (r.region ? ' · ' + r.region : '');
      b.append(el('span', name), el('strong', fmt(r.activeUsers))); b.addEventListener('click', function () { select(r.id); }); $('ga-list').append(b);
    });
    $('ga-unmapped').textContent = mapped + ' נקודות בישראל. ' + current.filter(function (r) { return !r.point; }).length + ' רשומות ללא מיקום ממופה בישראל מוצגות ברשימה בלבד (כולל מדינות אחרות וערים לא מזוהות).';
    if (current.length) select(current.some(function (r) { return r.id === selected; }) ? selected : current[0].id);
    else $('ga-detail').textContent = 'אין נתונים בטווח שנבחר.';
  }
  function select(id) {
    selected = id; var r = current.find(function (v) { return v.id === id; }); if (!r) return;
    $('ga-list').querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.city === id)); });
    $('ga-map').querySelectorAll('[data-city]').forEach(function (c) { c.setAttribute('fill-opacity', c.dataset.city === id ? '.95' : '.5'); c.setAttribute('stroke', c.dataset.city === id ? 'var(--ink)' : 'var(--card)'); });
    var detail = $('ga-detail'); detail.replaceChildren(el('h3', r.city === '(not set)' ? 'עיר לא מזוהה' : r.city));
    detail.append(el('strong', fmt(r.activeUsers) + ' משתמשים פעילים' + (totals ? ' · ' + fmt(r.activeUsers / totals * 100) + '% מהסך בדוח' : '')));
    detail.append(el('p', 'חדשים: ' + fmt(r.newUsers) + ' · ביקורים עם מעורבות: ' + fmt(r.engagedSessions)));
    detail.append(el('p', 'שיעור מעורבות: ' + fmt(r.engagementRate * 100) + '% · אירועים: ' + fmt(r.eventCount)));
    var seconds = r.activeUsers ? Math.round(r.userEngagementDuration / r.activeUsers) : 0;
    detail.append(el('p', 'זמן מעורבות ממוצע למשתמש: ' + Math.floor(seconds / 60) + ' דקות ו־' + seconds % 60 + ' שניות'));
    if (!r.point) detail.append(el('p', 'רשומה זו אינה ממופה בישראל.'));
  }
  function zoom(on) { $('ga-map').setAttribute('viewBox', on ? '65 20 235 465' : '0 0 430 765'); $('ga-full').setAttribute('aria-pressed', String(!on)); $('ga-zoom').setAttribute('aria-pressed', String(on)); }
  $('ga-full').addEventListener('click', function () { zoom(false); }); $('ga-zoom').addEventListener('click', function () { zoom(true); });
  $('range').addEventListener('change', load); $('reload').addEventListener('click', load);
})();
