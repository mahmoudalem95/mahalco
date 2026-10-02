/* MahAlCad – גיליונות תנוחה לאורך הציר
 * 1. גיליונות "תכנית" מסודרים ברצועות לאורך הציר, מסובבים בכיוון הציר (סטציות עולות משמאל לימין),
 *    עם חפיפה (התלכדות) של 50 מ׳ בין גיליון לגיליון וקו התאמה באמצע החפיפה.
 * 2. חץ צפון בכל גיליון תנוחה / משולשי ראות, מסובב לפי כיוון הגיליון.
 * 3. שכבת הצומת המתוכנן מתחת למשולשי הראות בשלב 4 (mhSdUnderlay).
 * נטען אחרי 96051e7c2d.js ועוטף את mhPagedSheets / mhSheetPhoto / mhCoordBands בלי לשנות אותם.
 */
(function () {
  'use strict';
  if (typeof mhPagedSheets !== 'function' || typeof mhMakeSheet !== 'function') return;

  const OVERLAP = 50;               // מ׳ חפיפה בין גיליונות
  const VW = 1034, VH = 801;        // חלון התכנית בגיליון (מ"מ)
  const origPaged = mhPagedSheets;
  const origPhoto = mhSheetPhoto;
  const origBands = mhCoordBands;

  // ---------- גאומטריה ----------
  const rot = (p, c, a) => {        // סיבוב נקודה [x,y] סביב c בזווית a (רדיאנים, נגד כיוון השעון)
    const ca = Math.cos(a), sa = Math.sin(a), dx = p[0] - c[0], dy = p[1] - c[1];
    return [c[0] + dx * ca - dy * sa, c[1] + dx * sa + dy * ca];
  };
  function rotateOps(ops, c, a) {
    const deg = a * 180 / Math.PI;
    return ops.map(o => {
      if (o.k === 'text') {
        const q = rot([o.x, o.y], c, a);
        let r = (o.rot || 0) + deg, ha = o.ha;
        while (r > 180) r -= 360;
        while (r <= -180) r += 360;
        if (r > 90.5 || r < -90.5) {          // שומרים על כיתוב קריא (לא הפוך)
          r += r > 0 ? -180 : 180;
          ha = ha === 2 ? 0 : (ha || 0) === 0 ? 2 : ha;
        }
        return { ...o, x: q[0], y: q[1], rot: r, ha };
      }
      if (o.k === 'circle') { const q = rot([o.cx, o.cy], c, a); return { ...o, cx: q[0], cy: q[1] }; }
      if (o.k === 'solid') return { ...o, poly: o.poly.map(p => rot(p, c, a)) };
      if (o.pts) return { ...o, pts: o.pts.map(p => rot(p, c, a)) };
      return o;
    });
  }

  function axisGeoms() {
    if (typeof S === 'undefined' || !Array.isArray(S.axes) || typeof withAxis !== 'function' || typeof frameAt !== 'function') return [];
    const out = [];
    S.axes.forEach((ax, i) => {
      try {
        if (!(ax && ax.pis && ax.pis.length >= 2 && !ax.drawing)) return;
        const g = withAxis(i, () => solve());
        if (!g || !(g.total > 1)) return;
        const at = s => { const f = frameAt(g.els, Math.max(0, Math.min(g.total, s))); return [f.p.x, f.p.y]; };
        out.push({ i, name: ax.name, total: g.total, at });
      } catch (e) { /* ציר לא תקין – מדלגים */ }
    });
    out.sort((a, b) => b.total - a.total);   // הציר הארוך ראשון
    return out;
  }

  // מקטעי רצועה לאורך ציר: [s0,s1] עם חפיפה, כך שכל הציר בתוך החלון כולל שוליים לרוחב הדרך
  function stripsFor(ax, W, H, s0, sEnd) {
    const res = [];
    const marginV = Math.min(H * 0.22, 80);  // שוליים לרוחב החתך והצמתים
    const ov = Math.min(OVERLAP, W * 0.25);
    let s = s0, guard = 0;
    while (s < sEnd - 1e-6 && guard++ < 500) {
      let len = Math.min(W - 2 * Math.min(10, W * 0.02), sEnd - s);
      let fit = null;
      for (let k = 0; k < 40; k++) {
        const s1 = s + len;
        const P0 = ax.at(s), P1 = ax.at(s1);
        const th = Math.atan2(P1[1] - P0[1], P1[0] - P0[0]);
        const n = Math.max(8, Math.ceil(len / 5));
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
        for (let j = 0; j <= n; j++) {
          const p = ax.at(s + len * j / n), q = rot(p, P0, -th);
          u0 = Math.min(u0, q[0]); u1 = Math.max(u1, q[0]);
          v0 = Math.min(v0, q[1]); v1 = Math.max(v1, q[1]);
        }
        if ((u1 - u0 <= W - 4 && v1 - v0 <= H - 2 * marginV) || len <= ov * 1.5 + 5) {
          const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
          fit = { s0: s, s1, th, c: rot([cu, cv], P0, th) };
          break;
        }
        len *= 0.88;
      }
      if (!fit) break;
      res.push(fit);
      if (fit.s1 >= sEnd - 1e-6) break;
      s = Math.max(s + 5, fit.s1 - ov);
    }
    return res;
  }

  function inWindow(p, w, W, H) {
    const q = rot(p, w.c, -w.th);
    return Math.abs(q[0] - w.c[0]) <= W / 2 - 2 && Math.abs(q[1] - w.c[1]) <= H / 2 - 2;
  }

  function planWindows(scale) {
    const k = 1000 / scale, W = VW / k, H = VH / k;
    const wins = [];
    axisGeoms().forEach(ax => {
      // תחומי סטציות שעדיין לא מכוסים בגיליון קיים
      const step = Math.max(2, Math.min(10, ax.total / 200));
      const runs = [];
      let cur = null;
      for (let s = 0; s <= ax.total + 1e-6; s += step) {
        const st = Math.min(s, ax.total);
        const covered = wins.some(w => inWindow(ax.at(st), w, W, H));
        if (!covered) { if (!cur) cur = [st, st]; cur[1] = st; }
        else if (cur) { runs.push(cur); cur = null; }
        if (st >= ax.total) break;
      }
      if (cur) runs.push(cur);
      runs.forEach(([a, b]) => {
        const a0 = Math.max(0, a - step), b0 = Math.min(ax.total, b + step);
        stripsFor(ax, W, H, a0, b0 < a0 + 1 ? Math.min(ax.total, a0 + 1) : b0).forEach(w => wins.push({ ...w, ax }));
      });
    });
    return { wins, W, H, k };
  }

  // ---------- אלמנטים בגיליון (מ"מ) ----------
  function northArrow(theta, cx = 1118, cy = 770) {
    // theta = זווית הסיבוב שהופעלה על העולם; הצפון בגיליון = (0,1) מסובב ב-theta
    const L = 22, w = 6;
    const R = p => rot([cx + p[0], cy + p[1]], [cx, cy], theta);
    const tip = R([0, L / 2]), tail = R([0, -L / 2]), l = R([-w, -L / 2 - 2]), r = R([w, -L / 2 - 2]), mid = R([0, -L / 2 + 5]);
    const lab = R([0, L / 2 + 6]);
    return [
      { k: 'circle', lay: 'BL-0-FRM-CYN', cx, cy, r: L * 0.72, col: '#202020', lw: 0.25 },
      { k: 'solid', lay: 'BL-0-FRM-CYN', poly: [tip, mid, r], col: '#202020' },
      { k: 'poly', lay: 'BL-0-FRM-CYN', pts: [tip, l, mid, r, tip], col: '#202020', lw: 0.35 },
      { k: 'poly', lay: 'BL-0-FRM-CYN', pts: [tail, mid], col: '#202020', lw: 0.25 },
      { k: 'text', lay: 'BL-0-NOTE-13', x: lab[0], y: lab[1], h: 4, s: 'N', ha: 1, va: 2, col: '#202020', rot: theta * 180 / Math.PI }
    ];
  }

  // רשת קואורדינטות ITM כצלבים בתוך החלון (מתאים לגיליון מסובב)
  function gridCrosses(win, k, ox, oy, theta) {
    const ops = [];
    const gs = S.geoShift || { dx: 0, dy: 0 };
    const iv = [50, 100, 200, 250, 500, 1000, 2000].find(v => v * k >= 160) || 2000;
    const c = win.c0;  // מרכז הסיבוב בעולם
    const corners = [[115, 15], [1159, 15], [1159, 826], [115, 826]].map(([X, Y]) => rot([(X - ox) / k, (Y - oy) / k], c, -theta));
    const ex = corners.map(p => p[0] + gs.dx), ny = corners.map(p => p[1] + gs.dy);
    const fmt = v => String(Math.round(v));
    for (let E = Math.ceil(Math.min(...ex) / iv) * iv; E <= Math.max(...ex); E += iv) {
      for (let N = Math.ceil(Math.min(...ny) / iv) * iv; N <= Math.max(...ny); N += iv) {
        const q = rot([E - gs.dx, N - gs.dy], c, theta);
        const X = q[0] * k + ox, Y = q[1] * k + oy;
        if (X < 135 || X > 1139 || Y < 35 || Y > 806) continue;
        const d = 3;
        ops.push({ k: 'poly', lay: 'BL-0-FRM-CYN', pts: [[X - d, Y], [X + d, Y]], col: '#404040', lw: 0.18 });
        ops.push({ k: 'poly', lay: 'BL-0-FRM-CYN', pts: [[X, Y - d], [X, Y + d]], col: '#404040', lw: 0.18 });
        ops.push({ k: 'text', lay: 'BL-0-NOTE-13', x: X + 1.2, y: Y + 1.2, h: 1.6, s: 'E ' + fmt(E), ha: 0, col: '#404040', rot: 0 });
        ops.push({ k: 'text', lay: 'BL-0-NOTE-13', x: X + 1.2, y: Y - 2.6, h: 1.6, s: 'N ' + fmt(N), ha: 0, col: '#404040', rot: 0 });
      }
    }
    return ops;
  }

  // תמונת רקע לגיליון מסובב: מחשבים אריחים לחלון "מדומה" לא מסובב ומרכיבים את מטריצת הסיבוב
  function rotatedPhoto(theta, c0, k, ox, oy) {
    const corners = [[115, 15], [1159, 15], [1159, 826], [115, 826]].map(([X, Y]) => rot([(X - ox) / k, (Y - oy) / k], c0, -theta));
    const ax0 = Math.min(...corners.map(p => p[0])), ax1 = Math.max(...corners.map(p => p[0]));
    const ay0 = Math.min(...corners.map(p => p[1])), ay1 = Math.max(...corners.map(p => p[1]));
    const kv = Math.min(k, 1044 / (ax1 - ax0), 811 / (ay1 - ay0)) * 0.999;
    const oxv = 115 - ax0 * kv, oyv = 15 - ay0 * kv;
    const tiles = origPhoto({ x0: ax0, y0: ay0, x1: ax1, y1: ay1 }, kv, oxv, oyv) || [];
    // G: מערכת SVG מדומה (לא מסובבת) → SVG של הגיליון המסובב
    //   x = (Xv-oxv)/kv ; y = (841-oyv-Yv)/kv ; q = c0 + R(theta)(p-c0) ; Xr = q.x*k+ox ; Yr = 841-(q.y*k+oy)
    const ca = Math.cos(theta), sa = Math.sin(theta);
    const px = -oxv / kv - c0[0], py = (841 - oyv) / kv - c0[1];
    const g = {
      a: k * ca / kv, b: -k * sa / kv, c: k * sa / kv, d: k * ca / kv,
      e: (c0[0] + ca * px - sa * py) * k + ox,
      f: 841 - ((c0[1] + sa * px + ca * py) * k + oy)
    };
    return tiles.map(t => {
      if (!t.matrix) return t;
      const [ma, mb, mc, md, me, mf] = t.matrix;
      return {
        ...t,
        matrix: [
          g.a * ma + g.c * mb, g.b * ma + g.d * mb,
          g.a * mc + g.c * md, g.b * mc + g.d * md,
          g.a * me + g.c * mf + g.e, g.b * me + g.d * mf + g.f
        ]
      };
    });
  }

  function matchLine(ax, s, theta, label) {
    // קו התאמה בניצב לציר בסטציה s (קואורדינטות עולם, לפני סיבוב)
    const p = ax.at(s), p2 = ax.at(Math.min(ax.total, s + 1)), p1 = ax.at(Math.max(0, s - 1));
    const t = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const n = [-Math.sin(t), Math.cos(t)], half = 45;
    const a = [p[0] + n[0] * half, p[1] + n[1] * half], b = [p[0] - n[0] * half, p[1] - n[1] * half];
    return [
      { k: 'poly', lay: 'HW-DIM', pts: [a, b], col: '#c0392b', lw: 0.5, lt: [6, 2, 1, 2] },
      { k: 'text', lay: 'HW-DIM', x: a[0] + n[0] * 3, y: a[1] + n[1] * 3, h: 2.4 * 1, s: label, ha: 1, va: 2, col: '#c0392b', rot: t * 180 / Math.PI }
    ];
  }

  // ---------- עטיפת הגיליונות ----------
  function sheetWithRotation(ops, title, scale, num, win, theta, c0, extraWorld) {
    const k = 1000 / scale, W = VW / k, H = VH / k;
    const rotated = rotateOps([...ops, ...extraWorld], c0, theta);
    const bounds = { x0: c0[0] - W / 2, x1: c0[0] + W / 2, y0: c0[1] - H / 2, y1: c0[1] + H / 2 };
    const ox = 120 - bounds.x0 * k, oy = 20 - bounds.y0 * k;
    const cfg = { theta, c0, k, ox, oy };
    window.mhSheetPhoto = (b, kk, x, y) => (theta ? rotatedPhoto(theta, c0, kk, x, y) : origPhoto(b, kk, x, y));
    window.mhCoordBands = (b, kk, x, y) => (theta ? gridCrosses({ c0 }, kk, x, y, theta) : origBands(b, kk, x, y));
    try {
      const sh = mhMakeSheet(rotated, title, scale, num, bounds);
      sh.ops.push(...northArrow(theta));
      sh.rotation = theta; sh.window = cfg;
      return sh;
    } finally {
      window.mhSheetPhoto = origPhoto;
      window.mhCoordBands = origBands;
    }
  }

  window.mhPagedSheets = mhPagedSheets = function (ops, title, scale, first = 1, opt = {}) {
    const isPlan = /^תכנית/.test(String(title));
    if (!isPlan) {
      // משולשי ראות וכו׳ – הפריסה הקיימת + חץ צפון בגיליונות תנוחה
      const out = origPaged(ops, title, scale, first, opt);
      if (/^משולשי ראות/.test(String(title))) out.forEach(sh => sh.ops.push(...northArrow(0)));
      return out;
    }
    let plan;
    try { plan = planWindows(scale); } catch (e) { console.error(e); plan = null; }
    if (!plan || !plan.wins.length) {
      const out = origPaged(ops, title, scale, first, opt);
      out.forEach(sh => sh.ops.push(...northArrow(0)));
      return out;
    }
    const { wins } = plan;
    const total = wins.length;
    return wins.map((w, i) => {
      const theta = -w.th;                       // מסובבים את העולם כך שכיוון הציר יהיה ימינה
      const name = total > 1 ? title + ' · ' + (i + 1) + '/' + total : title;
      const extra = [];
      const prev = wins[i - 1], next = wins[i + 1];
      if (next && next.ax === w.ax && next.s0 < w.s1) {
        const m = (next.s0 + w.s1) / 2;
        extra.push(...matchLine(w.ax, m, 0, 'קו התאמה · המשך בגיליון ' + (first + i + 1)));
      }
      if (prev && prev.ax === w.ax && w.s0 < prev.s1) {
        const m = (w.s0 + prev.s1) / 2;
        extra.push(...matchLine(w.ax, m, 0, 'קו התאמה · המשך מגיליון ' + (first + i - 1)));
      }
      return sheetWithRotation(ops, name, scale, first + i, w, theta, w.c, extra);
    });
  };

  // ---------- שלב 4: הצומת המתוכנן מתחת למשולשי הראות ----------
  let ulKey = null, ulOps = [];
  function underlayOps() {
    let key;
    try {
      key = JSON.stringify([S.axes.map(a => [a.pis, a.sec, a.drawing]), S.jctCfg, S.armCfg, S.cornerCfg, (S.junctions || []).length, S.geoShift]);
    } catch (e) { key = Math.random(); }
    if (key !== ulKey) {
      ulKey = key;
      try {
        ulOps = (typeof mhPlanOps === 'function' ? mhPlanOps() : [])
          .filter(o => o.k !== 'text' && o.k !== 'img' && o.lay !== 'HW-EW-EX' && o.lay !== '0-XREF');
      } catch (e) { console.error(e); ulOps = []; }
    }
    return ulOps;
  }
  window.mhSdUnderlay = function (ctx, toScreen, scale, dark) {
    if (typeof S === 'undefined' || !(S.junctions || []).length) return;
    const ops = underlayOps();
    if (!ops.length) return;
    const gs = S.geoShift || { dx: 0, dy: 0 };
    const P = p => toScreen({ x: p[0] + gs.dx, y: p[1] + gs.dy });
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ink = dark ? 'rgba(235,240,250,.85)' : 'rgba(25,30,40,.85)';
    for (const o of ops) {
      const pts = o.k === 'solid' ? o.poly : o.pts;
      if (o.k === 'circle') {
        const c = P([o.cx, o.cy]);
        ctx.beginPath(); ctx.arc(c.x, c.y, o.r * scale, 0, Math.PI * 2);
        ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.stroke();
        continue;
      }
      if (!pts || pts.length < 2) continue;
      ctx.beginPath();
      pts.forEach((p, j) => { const q = P(p); j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
      if (o.k === 'solid') {
        ctx.closePath();
        ctx.fillStyle = dark ? 'rgba(120,130,150,.28)' : 'rgba(90,100,120,.22)';
        ctx.fill();
      } else {
        if (o.closed) ctx.closePath();
        ctx.setLineDash(o.lt && o.lt.length ? o.lt.map(v => Math.max(2, v * scale)) : []);
        ctx.strokeStyle = ink; ctx.lineWidth = /MARK|ALGN|AXIS/.test(o.lay || '') ? 0.8 : 1.2;
        ctx.stroke();
      }
    }
    ctx.restore();
  };
})();
