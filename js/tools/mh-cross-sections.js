/* MahAlCad – חתכי רוחב לאורך הציר (חתכים טוריים)
 * חתך בכל מרווח תחנות (ברירת מחדל 20 מ׳ – "מרווח תחנות" של חתך האורך), לכל ציר עם חתך טיפוסי וקו אדום.
 * לכל תחנה: קו קרקע קיימת לרוחב מהמדידה (IDW בניצב לציר), תבנית החתך הטיפוסי מוצבת ברום הקו האדום,
 * שיפועי סוללה/חפירה 1:2 עד הקרקע, קו דאטום, טבלת מרחקים ורומים.
 * קנ"מ 1:200 (H=V). מסודרים בעמודות – מלמטה למעלה, משמאל לימין.
 * נוסף לגיליונות דרך MH_PROF.sheetsFor (אחרי חתכי האורך של אותו ציר).
 */
(function () {
  'use strict';
  if (!window.MH_PROF || typeof MH_PROF.sheetsFor !== 'function' || typeof mhMakeSheet !== 'function') return;

  const SCALE = 200;                 // 1:200
  const K = 1000 / SCALE;            // מ"מ למטר
  const PW = 1034 / K, PH = 801 / K; // שטח השרטוט במטרים (בקנ"מ)
  const SIDE = 2;                    // שיפוע סוללה/חפירה 1:SIDE
  const EXTRA = 12;                  // מ׳ קרקע מעבר לקצה הדיילייט
  const mm = v => v / K;             // מ"מ בגיליון → מטרים בשרטוט

  const fmtSta = s => { const km = Math.floor(s / 1000 + 1e-9); return km + '+' + (s - km * 1000).toFixed(2).padStart(6, '0'); };
  const isCurb = el => typeof TS_T !== 'undefined' && TS_T[el.type] && TS_T[el.type].lvl === 'curb';

  // תבנית החתך: נקודות [היסט, Δz] ביחס לרום הציר; היסט חיובי = ימין
  function template(sec) {
    const half = (+sec.median || 0) / 2;
    const side = sgn => {
      const pts = [[sgn * half, 0]];
      let x = sgn * half, z = 0;
      (sgn < 0 ? sec.left : sec.right || []).forEach(el => {
        const w = +el.w || 0;
        const curb = isCurb(el);
        const sl = Number.isFinite(el.slope) ? el.slope : curb ? sec.cfSide : sec.cfRoad;
        const slope = Number.isFinite(sl) ? sl : 0;   // % (חיובי = ירידה כלפי חוץ), כמו בחתך הטיפוסי
        const h = Number.isFinite(el.h) ? el.h : curb ? (sec.curbH || 0.15) - z : 0;
        if (h) { z += h; pts.push([x, z]); }
        x += sgn * w; z -= w * slope / 100;
        pts.push([x, z]);
      });
      return pts;
    };
    const L = side(-1).reverse(), R = side(1);
    return [...L, ...R.slice(half > 0 ? 0 : 1)];
  }

  // קרקע קיימת לרוחב מנקודות המדידה
  function groundCross(pts, P, n, B, zc) {
    if (!pts.length) return null;
    const near = [];
    const r2 = (B + 10) * (B + 10);
    for (const q of pts) { const dx = q.x - P.x, dy = q.y - P.y; if (dx * dx + dy * dy <= r2) near.push(q); }
    if (!near.length) return null;
    const out = [];
    for (let o = -B; o <= B + 1e-6; o += 1) {
      const x = P.x - n.x * o, y = P.y - n.y * o;   // n = נורמל שמאלי → היסט ימני חיובי
      let sw = 0, sz = 0;
      for (const q of near) {
        const d = Math.hypot(q.x - x, q.y - y);
        if (d <= 8) { const w = 1 / Math.max(d, 0.5) ** 2; sw += w; sz += w * q.z; }
      }
      if (sw > 0) out.push([o, sz / sw]);
    }
    if (out.length < 2) return null;
    // סינון קפיצות פשוט (אותו כלל אחוזי של חתך האורך)
    const pct = Number((document.getElementById('vSpikePct') || {}).value);
    if (pct > 0 && out.length >= 5) {
      const med = a => { const s = a.slice().sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
      for (let pass = 0; pass < 20; pass++) {
        const bad = new Set();
        out.forEach((p, i) => {
          const nb = out.filter((_, j) => j !== i && Math.abs(j - i) <= 3).map(q => q[1]);
          if (Math.abs(p[1] - med(nb)) * 100 > pct) bad.add(i);
        });
        if (!bad.size || out.length - bad.size < 3) break;
        for (let i = out.length - 1; i >= 0; i--) if (bad.has(i)) out.splice(i, 1);
      }
    }
    if (zc != null && Number.isFinite(zc)) {
      // התאמה לקו הקרקע של חתך האורך בציר (אם קיים) – רק כאשר אין נקודה ליד הציר
      if (!out.some(p => Math.abs(p[0]) < 1.5)) { out.push([0, zc]); out.sort((a, b) => a[0] - b[0]); }
    }
    return out;
  }
  const interp = (g, x) => {
    if (!g || !g.length || x < g[0][0] || x > g[g.length - 1][0]) return null;
    for (let i = 1; i < g.length; i++) if (x <= g[i][0]) { const t = (x - g[i - 1][0]) / ((g[i][0] - g[i - 1][0]) || 1); return g[i - 1][1] + t * (g[i][1] - g[i - 1][1]); }
    return g[g.length - 1][1];
  };

  // קו סוללה/חפירה מקצה התבנית עד הקרקע
  function daylight(edge, dir, g) {
    if (!g) return null;
    const [x0, z0] = edge;
    const gz0 = interp(g, x0);
    if (gz0 == null) return null;
    const down = gz0 < z0;                 // מילוי – יורדים
    for (let d = 0.25; d <= 60; d += 0.25) {
      const x = x0 + dir * d, z = z0 + (down ? -1 : 1) * d / SIDE;
      const gz = interp(g, x);
      if (gz == null) return [x, z];
      if (down ? z <= gz : z >= gz) return [x, gz];
    }
    return null;
  }

  // שרטוט החתך הטיפוסי המלא ממנוע ההנחיות (רכבים, אנשים, מדרכות, שכבות מבנה, שיפועים, מידות)
  function engineFor(ax) {
    const t = ax.tsSect;
    if (!t || !t.sect || !t.sect.g || typeof tsSectionOps !== 'function') return null;
    if (t._xsEng && t._xsEngG === t.sect.g) return t._xsEng;
    let ops;
    try { ops = tsSectionOps(ax); } catch (e) { return null; }
    if (!ops || !ops.length) return null;
    const D = t.sect.D || 100, f = D / 1000;
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-99999px;top:0;width:10px;height:10px;overflow:hidden';
    box.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + t.sect.w + ' ' + t.sect.h + '">' + t.sect.g + '</svg>';
    document.body.appendChild(box);
    let surf = [];
    try {
      const svg = box.querySelector('svg'), path = svg.querySelector('[data-lay="TS-SURFACE"]');
      if (path && path.getTotalLength) {
        const M = svg.getCTM().inverse().multiply(path.getCTM()), L = path.getTotalLength();
        for (let i = 0; i <= 60; i++) { const q = path.getPointAtLength(L * i / 60), r = new DOMPoint(q.x, q.y).matrixTransform(M); surf.push([r.x * f, -r.y * f]); }
      }
    } finally { box.remove(); }
    if (surf.length < 2) return null;
    const sec = ax.sec || {};
    const x0 = Math.min(...surf.map(p => p[0]));
    const axX = x0 + (+sec.median || 0) / 2 + (sec.left || []).reduce((a, e) => a + (+e.w || 0), 0);
    const near = surf.reduce((b, p) => Math.abs(p[0] - axX) < Math.abs(b[0] - axX) ? p : b, surf[0]);
    const res = {
      ops: ops.filter(o => !(o.k === 'text' && /^(חתך טיפוסי|קנה מידה)/.test(String(o.s || '')))),
      axX, axY: near[1], textK: SCALE / D
    };
    t._xsEng = res; t._xsEngG = t.sect.g;
    return res;
  }

  function sectionData(geom, ax, sta, ef, survey) {
    const f = frameAt(geom.els, sta);
    const zD = ef ? ef.design(sta) : null;
    const zE = ef ? ef.exist(sta) : null;
    const tpl = template(ax.sec);
    const halfW = Math.max(Math.abs(tpl[0][0]), Math.abs(tpl[tpl.length - 1][0]));
    const B = halfW + EXTRA + 8;
    const g = groundCross(survey, f.p, f.n, B, zE);
    const base = zD != null ? zD : zE != null ? zE : (g ? interp(g, 0) : null);
    if (base == null) return null;
    const design = tpl.map(([o, dz]) => [o, base + dz]);
    const dl = daylight(design[0], -1, g), dr = daylight(design[design.length - 1], 1, g);
    const full = [...(dl ? [dl] : []), ...design, ...(dr ? [dr] : [])];
    return { sta, zD, zE: zE != null ? zE : (g ? interp(g, 0) : null), g, design: full, hasDesign: zD != null, base, eng: engineFor(ax) };
  }

  // שרטוט חתך בודד במערכת "מטרים בשרטוט" (1 יח' = 1 מ׳ בקנ"מ 1:200)
  function drawSection(d, ox, oy, w) {
    const ops = [];
    // הצבת שרטוט המנוע: ציר המנוע → היסט 0, פני הכביש בציר → רום הקו האדום
    const E = d.eng;
    const eo = E ? E.ops.map(o => {
      const tp = p => [p[0] - E.axX, d.base + (p[1] - E.axY)];
      if (o.k === 'text') { const q = tp([o.x, o.y]); return { ...o, x: q[0], y: q[1], h: o.h * E.textK }; }
      if (o.k === 'circle') { const q = tp([o.cx, o.cy]); return { ...o, cx: q[0], cy: q[1] }; }
      if (o.k === 'solid') return { ...o, poly: o.poly.map(tp) };
      if (o.pts) return { ...o, pts: o.pts.map(tp) };
      return null;
    }).filter(Boolean) : [];
    const ez = [];
    eo.forEach(o => (o.k === 'text' ? [[o.x, o.y]] : o.k === 'circle' ? [[o.cx, o.cy - o.r], [o.cx, o.cy + o.r]] : (o.pts || o.poly)).forEach(p => ez.push(p[1])));
    const zs = [...d.design.map(p => p[1]), ...(d.g || []).map(p => p[1]), ...ez];
    const datum = Math.floor(Math.min(...zs) - 1);
    const zTop = Math.max(...zs);
    const tableH = mm(20);
    const y0 = oy + tableH;                       // קו הדאטום
    const Y = z => y0 + (z - datum);
    const X = o => ox + w / 2 + o;
    const xL = ox + mm(25), xR = ox + w - mm(4);
    const clipX = o => Math.max(xL - (ox + w / 2), Math.min(xR - (ox + w / 2), o));
    const T = (x, y, s, h, ha = 1, rot = 0, col = '#222', lay = '0-NOTE') => ops.push({ k: 'text', lay, x, y, h: mm(h), s, ha, va: 2, rot, col });
    // דאטום וטבלה
    ops.push({ k: 'poly', lay: 'HW-DIM', pts: [[xL, y0], [xR, y0]], col: '#444', lw: 0.25 });
    ops.push({ k: 'poly', lay: 'HW-DIM', pts: [[xL, oy + mm(10)], [xR, oy + mm(10)]], col: '#888', lw: 0.18 });
    ops.push({ k: 'poly', lay: 'HW-DIM', pts: [[xL, oy], [xR, oy]], col: '#888', lw: 0.18 });
    T(ox + mm(1.5), y0 + mm(1.6), 'DATUM ' + datum.toFixed(2), 1.8, 0);
    T(ox + mm(1.5), oy + mm(15), 'רום מתוכנן', 1.8, 0);
    T(ox + mm(1.5), oy + mm(5), 'רום קיים', 1.8, 0);
    // קרקע קיימת
    if (d.g) {
      const pts = d.g.filter(p => X(p[0]) >= xL && X(p[0]) <= xR).map(p => [X(p[0]), Y(p[1])]);
      if (pts.length > 1) ops.push({ k: 'poly', lay: 'HW-EW-EX', pts, col: '#8a5a2b', lw: 0.35, lt: [mm(2.5), mm(1.2)] });
    }
    // שרטוט החתך הטיפוסי המלא
    eo.forEach(o => {
      if (o.k === 'text') ops.push({ ...o, x: X(o.x), y: Y(o.y) });
      else if (o.k === 'circle') ops.push({ ...o, cx: X(o.cx), cy: Y(o.cy) });
      else if (o.k === 'solid') ops.push({ ...o, poly: o.poly.map(p => [X(p[0]), Y(p[1])]) });
      else ops.push({ ...o, pts: o.pts.map(p => [X(p[0]), Y(p[1])]) });
    });
    // קו מתוכנן
    const dp = d.design.map(p => [X(clipX(p[0])), Y(p[1])]);
    ops.push({ k: 'poly', lay: 'HW-CURB', pts: dp, col: '#c0392b', lw: 0.5 });
    // ציר
    const zc = d.zD != null ? d.zD : d.zE;
    ops.push({ k: 'poly', lay: 'HW-DIM', pts: [[X(0), y0], [X(0), Y(Math.max(zTop, zc) + 1.2)]], col: '#2c5aa0', lw: 0.18, lt: [mm(4), mm(1), mm(1), mm(1)] });
    // כותרת התחנה
    T(X(0), Y(Math.max(zTop, zc) + 1.2) + mm(4), fmtSta(d.sta), 3.2, 1, 0, '#111', 'BL-0-NOTE-13');
    const cf = d.zD != null && d.zE != null ? d.zD - d.zE : null;
    T(X(0), Y(Math.max(zTop, zc) + 1.2) + mm(0.8),
      (d.zD != null ? 'רום מתוכנן ' + d.zD.toFixed(2) : 'אין קו אדום') + (d.zE != null ? ' · רום קיים ' + d.zE.toFixed(2) : '') + (cf != null ? ' · ' + (cf >= 0 ? 'מילוי +' : 'חפירה ') + cf.toFixed(2) : ''),
      1.8, 1, 0, '#444');
    // טבלת רומים בנקודות השבירה
    let lastX = -1e9;
    d.design.forEach(p => {
      const x = X(p[0]);
      if (x < xL + mm(2) || x > xR - mm(2) || x - lastX < mm(3.2)) return;
      lastX = x;
      ops.push({ k: 'poly', lay: 'HW-DIM', pts: [[x, oy], [x, y0]], col: '#bbb', lw: 0.13 });
      T(x - mm(0.8), oy + mm(15), p[1].toFixed(2), 1.5, 1, 90, '#c0392b');
      const ge = interp(d.g, p[0]);
      if (ge != null) T(x - mm(0.8), oy + mm(5), ge.toFixed(2), 1.5, 1, 90, '#8a5a2b');
      T(x + mm(1.1), y0 - mm(2.3), (p[0] >= 0 ? '' : '-') + Math.abs(p[0]).toFixed(1), 1.2, 1, 90, '#666');
    });
    return { ops, h: Y(Math.max(zTop, zc) + 1.2) + mm(7) - oy };
  }

  function sectionSheets(ai, first) {
    const ax = S.axes[ai];
    if (!ax || !ax.sec || !(ax.pis && ax.pis.length >= 2) || ax.drawing) return [];
    const geom = withAxis(ai, () => solve());
    if (!geom || !(geom.total > 1)) return [];
    let ef = null;
    try { ef = MH_PROF.elevFor ? MH_PROF.elevFor(ai) : null; } catch (e) { ef = null; }
    const survey = (MH_PROF.survey && MH_PROF.survey()) || [];
    if (!survey.length && !(ef && (ef.ground || []).length)) return [];
    const step = Math.max(5, Number((typeof mhSheetConfig === 'function' && mhSheetConfig().profileStep)) || 20);
    const stas = [];
    for (let s = 0; s < geom.total - 0.5; s += step) stas.push(+s.toFixed(3));
    stas.push(+geom.total.toFixed(3));
    const data = stas.map(s => { try { return sectionData(geom, ax, s, ef, survey); } catch (e) { return null; } }).filter(Boolean);
    if (!data.length) return [];
    // רוחב תא אחיד לפי החתך הרחב
    const engX = d => d.eng ? d.eng.ops.flatMap(o => o.k === 'text' ? [o.x] : o.k === 'circle' ? [o.cx] : (o.pts || o.poly || []).map(p => p[0])).map(x => Math.abs(x - d.eng.axX)) : [];
    const wNeed = Math.max(...data.map(d => Math.max(...d.design.map(p => Math.abs(p[0])), ...engX(d)))) * 2 + 10 + mm(30);
    const cellW = Math.min(PW, Math.max(mm(150), wNeed));
    const cols = Math.max(1, Math.floor(PW / cellW));
    const colW = PW / cols;
    const pages = [];
    let page = [], col = 0, y = mm(4);
    data.forEach(d => {
      let r = drawSection(d, col * colW, y, colW);
      if (y + r.h > PH - mm(4)) {
        col++; y = mm(4);
        if (col >= cols) { pages.push(page); page = []; col = 0; }
        r = drawSection(d, col * colW, y, colW);
      }
      page.push(...r.ops);
      y += r.h + mm(6);
    });
    if (page.length) pages.push(page);
    const note = { k: 'text', lay: '0-NOTE', x: PW - mm(4), y: PH - mm(3), h: mm(2), s: 'חתכי רוחב 1:200 · מרווח ' + step + ' מ׳ · שיפועי סוללה/חפירה 1:' + SIDE + ' · קרקע קיימת מהמדידה', ha: 2, va: 2, col: '#555' };
    return pages.map((ops, i) => {
      const sh = mhMakeSheet([...ops, note], 'חתכי רוחב · ' + ax.name + (pages.length > 1 ? ' · ' + (i + 1) + '/' + pages.length : ''), SCALE, first + i, { x0: 0, y0: 0, x1: PW, y1: PH });
      sh.crossSections = true; sh.axisIndex = ai;
      return sh;
    });
  }

  const origFor = MH_PROF.sheetsFor;
  MH_PROF.sheetsFor = function (ai, first = 1) {
    let prof = [], err = null;
    try { prof = origFor.apply(this, arguments) || []; } catch (e) { err = e; }
    let xs = [];
    try { xs = sectionSheets(ai, first + prof.length); } catch (e) { console.error(e); }
    if (err) {
      if (!xs.length) throw err;
      xs[0].note = (S.axes[ai] ? S.axes[ai].name + ': ' : '') + (err.message || err);
    }
    return [...prof, ...xs];
  };

  // קבוצה ברשימת הגיליונות
  if (typeof mhRefreshSheet === 'function') {
    const origRefresh = mhRefreshSheet;
    window.mhRefreshSheet = mhRefreshSheet = function () {
      const r = origRefresh.apply(this, arguments);
      try {
        const box = document.getElementById('mhSheetIndex');
        if (box && window.MH && MH.sheets) {
          const items = MH.sheets.map((s, i) => ({ s, i })).filter(o => /^חתכי רוחב/.test(o.s.title));
          if (items.length && !box.querySelector('[data-xs-group]')) {
            const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
            box.insertAdjacentHTML('beforeend', '<small data-xs-group style="opacity:.75">חתכי רוחב · cross sections</small>' + items.map(o =>
              '<button type="button" data-sheet="' + o.i + '" style="display:block;width:100%;text-align:start;background:#232a31;border:1px solid #39424b;border-radius:4px;color:#cfe3f7;margin:4px 0;padding:6px 8px">' + esc(o.s.title) + ' · 1:' + o.s.scale + '</button>').join(''));
          }
        }
      } catch (e) { console.error(e); }
      return r;
    };
  }
})();
