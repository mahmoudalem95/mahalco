/* ======================================================================
   מרכיב הפלט: מכל מה שנאסף בארבעת השלבים בונה קובץ CAD אחד —
   מודל במטרים 1:1 + לשונית נייר לכל גיליון A0, עם מסגרת המשרד.
   ====================================================================== */
const A0 = {w:1189, h:841};
const ESC = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const N3 = v => (Math.round(v*1000)/1000);

/* ---------- טקסט וצורות על הנייר ---------- */
function T(x, y, s, size, o){
  o = o || {};
  if(s === '' || s == null) return '';
  return `<text x="${N3(x)}" y="${N3(y)}" font-size="${size}" text-anchor="${o.anchor||'middle'}"`
       + ` font-weight="${o.weight||400}" fill="${o.color||'#14171a'}" data-lay="${o.lay||'SH-TEXT'}"`
       + (o.rot ? ` transform="rotate(${o.rot} ${N3(x)} ${N3(y)})"` : '')
       + ` style="font-family:Heebo,Arial,sans-serif">${ESC(s)}</text>`;
}
function R(x, y, w, h, o){
  o = o || {};
  return `<rect x="${N3(x)}" y="${N3(y)}" width="${N3(w)}" height="${N3(h)}" fill="${o.fill||'none'}"`
       + ` stroke="${o.stroke||'#14171a'}" stroke-width="${o.sw||0.35}" data-lay="${o.lay||'SH-FRAME'}"/>`;
}
function LN(x1, y1, x2, y2, o){
  o = o || {};
  return `<line x1="${N3(x1)}" y1="${N3(y1)}" x2="${N3(x2)}" y2="${N3(y2)}" stroke="${o.stroke||'#14171a'}"`
       + ` stroke-width="${o.sw||0.25}"${o.dash?` stroke-dasharray="${o.dash}"`:''} data-lay="${o.lay||'SH-GRID'}"/>`;
}

/* ---------- מסגרת וכרטיס כותרת מובנים ---------- */
const PAD = {l:20, r:10, t:10, b:10, tbW:180, tbH:62};
function sheetArea(){
  return {x: PAD.l + 5, y: PAD.t + 8,
          w: A0.w - PAD.l - PAD.r - 10,
          h: A0.h - PAD.t - PAD.b - PAD.tbH - 22};
}
function builtinFrame(meta){
  const tbX = A0.w - PAD.r - PAD.tbW, tbY = A0.h - PAD.b - PAD.tbH;
  const cell = (x,y,w,h,lab,val,big)=> R(x,y,w,h,{lay:'SH-TITLE', sw:0.35})
    + T(x+w-2, y+4, lab, 2.3, {anchor:'end', color:'#585f66', lay:'SH-TITLE'})
    + T(x+w-2, y+h-3, val, big?5:3.4, {anchor:'end', weight:big?700:400, lay:'SH-TITLE'});
  let s = R(PAD.l, PAD.t, A0.w-PAD.l-PAD.r, A0.h-PAD.t-PAD.b, {lay:'SH-FRAME', sw:0.7});
  s += R(tbX, tbY, PAD.tbW, PAD.tbH, {lay:'SH-TITLE', sw:0.6, fill:'#ffffff'});
  s += cell(tbX, tbY, PAD.tbW, 16, 'משרד', meta.office || 'MAHALCO – הנדסה אזרחית ותחבורה', true);
  s += cell(tbX, tbY+16, PAD.tbW, 14, 'פרויקט', meta.proj || '—');
  s += cell(tbX, tbY+30, PAD.tbW, 14, 'תוכן הגיליון', meta.title || '—');
  s += cell(tbX+120, tbY+44, 60, 18, 'קנה מידה', meta.scale || '—', true);
  s += cell(tbX+80, tbY+44, 40, 18, 'גיליון', meta.dwg || '—');
  s += cell(tbX+40, tbY+44, 40, 18, 'תאריך', meta.date || '');
  s += cell(tbX, tbY+44, 40, 18, 'שרטט', meta.drawn || '—');
  return s;
}
/* מסגרת המשתמש: אותה SVG בכל גיליון, עם החלפת שדות {PROJ} וכד׳ */
function userFrame(frameSVG, meta){
  const map = {PROJ:meta.proj, TITLE:meta.title, SCALE:meta.scale, SHEET:meta.dwg,
               DATE:meta.date, DRAWN:meta.drawn, OFFICE:meta.office};
  return frameSVG.replace(/\{(PROJ|TITLE|SCALE|SHEET|DATE|DRAWN|OFFICE)\}/g,
                          (m, k) => ESC(map[k] == null ? '' : map[k]));
}
function wrapSheet(body, meta, frameSVG){
  const frame = frameSVG ? userFrame(frameSVG, meta) : builtinFrame(meta);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${A0.w}mm" height="${A0.h}mm" `
       + `viewBox="0 0 ${A0.w} ${A0.h}" style="direction:ltr">`
       + `<rect width="${A0.w}" height="${A0.h}" fill="#ffffff" data-lay="none"/>`
       + frame + body + '</svg>';
}
/* סרגל קנה מידה */
function scaleBar(x, y, D, unitM){
  unitM = unitM || 10;
  const k = 1000/D * unitM / 5;                 /* מ״מ לכל מקטע (5 מקטעים) */
  let s = '';
  for(let i=0;i<5;i++) s += R(x+i*k, y, k, 2, {fill: i%2 ? '#ffffff' : '#14171a', lay:'SH-FRAME', sw:0.2});
  s += T(x, y-1.5, '0', 2.5, {lay:'SH-FRAME'});
  s += T(x+5*k, y-1.5, unitM + ' מ׳', 2.5, {lay:'SH-FRAME'});
  s += T(x+2.5*k, y+6, `קנה מידה 1:${D}`, 2.5, {color:'#585f66', lay:'SH-FRAME'});
  return s;
}

/* ======================================================================
   חיתוך פעולות CAD למלבן הגיליון
   ====================================================================== */
function clipSeg(p, q, r){
  let t0 = 0, t1 = 1;
  const dx = q[0]-p[0], dy = q[1]-p[1];
  const P = [-dx, dx, -dy, dy], Q = [p[0]-r.x0, r.x1-p[0], p[1]-r.y0, r.y1-p[1]];
  for(let i=0;i<4;i++){
    if(Math.abs(P[i]) < 1e-12){ if(Q[i] < 0) return null; continue; }
    const t = Q[i]/P[i];
    if(P[i] < 0){ if(t > t1) return null; if(t > t0) t0 = t; }
    else { if(t < t0) return null; if(t < t1) t1 = t; }
  }
  return [[p[0]+t0*dx, p[1]+t0*dy], [p[0]+t1*dx, p[1]+t1*dy]];
}
function clipPolyline(pts, closed, r){
  const src = closed ? pts.concat([pts[0]]) : pts;
  const runs = []; let cur = null;
  for(let i=0;i<src.length-1;i++){
    const c = clipSeg(src[i], src[i+1], r);
    if(!c){ cur = null; continue; }
    if(cur && Math.hypot(cur[cur.length-1][0]-c[0][0], cur[cur.length-1][1]-c[0][1]) < 1e-9) cur.push(c[1]);
    else { cur = [c[0], c[1]]; runs.push(cur); }
  }
  return runs;
}
function clipPoly(poly, r){                      /* Sutherland–Hodgman */
  let out = poly.slice();
  const edges = [
    {in:p=>p[0]>=r.x0, I:(a,b)=>ix(a,b,0,r.x0)}, {in:p=>p[0]<=r.x1, I:(a,b)=>ix(a,b,0,r.x1)},
    {in:p=>p[1]>=r.y0, I:(a,b)=>ix(a,b,1,r.y0)}, {in:p=>p[1]<=r.y1, I:(a,b)=>ix(a,b,1,r.y1)}];
  function ix(a, b, ax, v){
    const t = (v - a[ax]) / ((b[ax] - a[ax]) || 1e-12);
    return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t];
  }
  edges.forEach(E=>{
    const src = out; out = [];
    for(let i=0;i<src.length;i++){
      const a = src[i], b = src[(i+1)%src.length];
      const ia = E.in(a), ib = E.in(b);
      if(ia) out.push(a);
      if(ia !== ib) out.push(E.I(a, b));
    }
  });
  return out.length >= 3 ? out : null;
}
function clipOps(ops, r){
  const out = [];
  ops.forEach(o=>{
    if(o.k === 'text'){ if(o.x>=r.x0 && o.x<=r.x1 && o.y>=r.y0 && o.y<=r.y1) out.push(o); return; }
    if(o.k === 'circle'){ if(o.cx>=r.x0 && o.cx<=r.x1 && o.cy>=r.y0 && o.cy<=r.y1) out.push(o); return; }
    if(o.k === 'solid'){ const p = clipPoly(o.poly, r); if(p) out.push(Object.assign({}, o, {poly:p})); return; }
    if(o.k === 'poly'){
      clipPolyline(o.pts, o.closed, r).forEach(run=>{
        if(run.length > 1) out.push(Object.assign({}, o, {pts:run, closed:false}));
      });
    }
  });
  return out;
}
function opsBox(ops){
  const b = {x0:1e18, y0:1e18, x1:-1e18, y1:-1e18};
  const see = (x,y)=>{ if(!isFinite(x)) return;
    if(x<b.x0)b.x0=x; if(y<b.y0)b.y0=y; if(x>b.x1)b.x1=x; if(y>b.y1)b.y1=y; };
  ops.forEach(o=>{
    if(o.k === 'text') see(o.x, o.y);
    else if(o.k === 'circle'){ see(o.cx-o.r, o.cy-o.r); see(o.cx+o.r, o.cy+o.r); }
    else (o.pts || o.poly || []).forEach(p=>see(p[0], p[1]));
  });
  return b;
}
/* העתקת פעולות ממטרים אל מ״מ על הנייר */
function opsToPaper(ops, k, ox, oy, x0, y0){
  const M = (x, y) => [ox + (x - x0)*k, oy + (y - y0)*k];
  return ops.map(o=>{
    if(o.k === 'text'){ const p = M(o.x, o.y); return Object.assign({}, o, {x:p[0], y:p[1], h:o.h*k}); }
    if(o.k === 'circle'){ const p = M(o.cx, o.cy); return Object.assign({}, o, {cx:p[0], cy:p[1], r:o.r*k}); }
    if(o.k === 'solid') return Object.assign({}, o, {poly:o.poly.map(p=>M(p[0], p[1]))});
    return Object.assign({}, o, {pts:o.pts.map(p=>M(p[0], p[1])), lt:o.lt ? o.lt.map(v=>v*k) : null});
  });
}

/* ======================================================================
   גיליונות התכנית: פריסת התכנית על גיליונות A0 בקנה 1:D
   ====================================================================== */
function planSheets(ops, D, meta, frameSVG){
  const A = sheetArea(), k = 1000/D;             /* מ״מ לכל מטר */
  const b = opsBox(ops);
  if(!isFinite(b.x0)) return [];
  const Wm = A.w / k, Hm = A.h / k;              /* מטרים שנכנסים בגיליון */
  const nx = Math.max(1, Math.ceil((b.x1 - b.x0) / Wm - 1e-9));
  const ny = Math.max(1, Math.ceil((b.y1 - b.y0) / Hm - 1e-9));
  const sheets = [];
  for(let j = ny-1; j >= 0; j--){
    for(let i = 0; i < nx; i++){
      const x0 = b.x0 + i*Wm, y0 = b.y0 + j*Hm;
      const rect = {x0: x0 - 0.001, y0: y0 - 0.001, x1: x0 + Wm + 0.001, y1: y0 + Hm + 0.001};
      const part = clipOps(ops, rect);
      if(!part.length) continue;
      /* SVG: ציר Y יורד, לכן נקודת הייחוס היא הפינה העליונה */
      const paper = opsToPaper(part, k, A.x, A.y + A.h, x0, y0)
                    .map(o=>flipY(o, A.y + A.h, A.y + A.h));
      const idx = sheets.length + 1;
      const m = Object.assign({}, meta, {
        title: 'תכנית – ' + (meta.projTitle || 'פריסת צירים') + (nx*ny > 1 ? ` (גיליון ${idx} מתוך ${nx*ny})` : ''),
        scale: '1:' + D, dwg: 'P-' + String(idx).padStart(2, '0')});
      sheets.push({name: 'תכנית ' + idx, ops: paper,
                   svg: wrapSheet(scaleBar(PAD.l+10, A0.h-PAD.b-12, D, 10)
                        + T(A.x + A.w/2, A.y - 2, `תכנית – קנה מידה 1:${D}`, 5, {weight:700, lay:'SH-TEXT'}),
                        m, frameSVG)});
    }
  }
  return sheets;
}
/* היפוך ציר Y: בפעולות ה-CAD Y עולה, בגיליון ה-SVG Y יורד */
function flipY(o, y0){
  const F = p => [p[0], 2*y0 - p[1]];
  if(o.k === 'text') return Object.assign({}, o, {y: 2*y0 - o.y, rot: -(o.rot||0)});
  if(o.k === 'circle') return Object.assign({}, o, {cy: 2*y0 - o.cy});
  if(o.k === 'solid') return Object.assign({}, o, {poly:o.poly.map(F)});
  return Object.assign({}, o, {pts:o.pts.map(F)});
}

/* ======================================================================
   חתכי רוחב כל X מטר – מהתבנית של הכלי "חתך טיפוסי"
   ====================================================================== */
function stationLabel(s){
  const km = Math.floor(s/1000), m = s - km*1000;
  return km + '+' + (m < 100 ? (m < 10 ? '00' : '0') : '') + (Math.round(m*100)/100);
}
function crossSheets(block, rows, D, meta, frameSVG, headTitle){
  const A = sheetArea();
  const bw = block.w, bh = block.h + 14;         /* מקום לכותרת ולנתונים */
  const cols = Math.max(1, Math.floor(A.w / (bw + 10)));
  const rowsPer = Math.max(1, Math.floor((A.h - 8) / (bh + 8)));
  const per = cols * rowsPer;
  const sheets = [];
  for(let p = 0; p*per < rows.length; p++){
    const part = rows.slice(p*per, (p+1)*per);
    let body = T(A.x + A.w/2, A.y - 2, headTitle + ` – קנה מידה 1:${D}`, 5, {weight:700, lay:'SH-TEXT'});
    part.forEach((r, i)=>{
      const c = i % cols, rr = Math.floor(i / cols);
      const x = A.x + c*(bw + 10) + (A.w - cols*(bw+10) + 10)/2;
      const y = A.y + 6 + rr*(bh + 8);
      body += `<g transform="translate(${N3(x)} ${N3(y)})">${block.g}</g>`;
      body += T(x + bw/2, y + block.h + 5, 'חתך ' + stationLabel(r.sta), 3.6, {weight:700, lay:'SH-TEXT'});
      const info = [];
      if(r.design != null) info.push('גובה מתוכנן ' + r.design.toFixed(2));
      if(r.ground != null) info.push('גובה קרקע ' + r.ground.toFixed(2));
      if(r.design != null && r.ground != null){
        const d = r.design - r.ground;
        info.push((d >= 0 ? 'מילוי ' : 'חפירה ') + Math.abs(d).toFixed(2));
      }
      body += T(x + bw/2, y + block.h + 10, info.join(' · '), 2.8, {color:'#585f66', lay:'SH-TEXT'});
      body += R(x - 3, y - 3, bw + 6, bh + 3, {lay:'SH-GRID', sw:0.15, stroke:'#9aa3ad'});
    });
    body += scaleBar(PAD.l+10, A0.h-PAD.b-12, D, 5);
    const idx = sheets.length + 1;
    const m = Object.assign({}, meta, {
      title: headTitle + ` · ${stationLabel(part[0].sta)} – ${stationLabel(part[part.length-1].sta)}`,
      scale: '1:' + D, dwg: 'X-' + String(idx).padStart(2, '0')});
    sheets.push({name: headTitle + ' ' + idx, svg: wrapSheet(body, m, frameSVG)});
  }
  return sheets;
}

/* ======================================================================
   חתך אורך: קרקע קיימת + קו אדום מתוכנן, עם הגזמה אנכית
   ====================================================================== */
function designElev(x, data){
  if(!data || !data.segs) return null;
  const {segs, curves} = data;
  for(const seg of segs){
    if(x >= seg.s1 && x <= seg.s2){
      let e = seg.e1 + seg.grade/100*(x - seg.s1);
      for(const c of (curves||[])){
        if(x >= c.st - c.L/2 && x <= c.st + c.L/2){
          const g1 = c.gIn/100, g2 = c.gOut/100, xC = x - (c.st - c.L/2), y0 = c.el - g1*(c.L/2);
          e = y0 + g1*xC + (g2-g1)/(2*c.L)*xC*xC;
        }
      }
      return e;
    }
  }
  return null;
}
function groundElev(x, ground){
  if(!ground || !ground.length) return null;
  if(x <= ground[0][0]) return ground[0][1];
  if(x >= ground[ground.length-1][0]) return ground[ground.length-1][1];
  for(let i=0;i<ground.length-1;i++){
    const [a, za] = ground[i], [b, zb] = ground[i+1];
    if(x >= a && x <= b) return za + (zb - za) * (x - a) / ((b - a) || 1);
  }
  return null;
}
function profileSheets(vert, Dh, VE, meta, frameSVG){
  const ground = vert.ground || [], data = vert.data;
  const pvi = (data && data.pvi) || vert.pvi || [];
  if(!ground.length && !pvi.length) return [];
  const A = sheetArea();
  const bandH = 26;                               /* פס הנתונים מתחת לגרף */
  const gh = A.h - bandH - 10;                    /* גובה הגרף במ״מ */
  const k = 1000/Dh;                              /* מ״מ למטר אופקי */
  const kv = k * VE;                              /* מ״מ למטר אנכי */
  const sta0 = Math.min(ground.length?ground[0][0]:pvi[0][0], pvi.length?pvi[0][0]:1e18);
  const staN = Math.max(ground.length?ground[ground.length-1][0]:0, pvi.length?pvi[pvi.length-1][0]:0);
  const perSheet = A.w / k;                       /* מטרים לגיליון */
  const zs = ground.map(p=>p[1]).concat(pvi.map(p=>p[1]));
  const zmin = Math.floor(Math.min.apply(null, zs) - 2), zmax = Math.ceil(Math.max.apply(null, zs) + 2);
  const sheets = [];
  for(let s = sta0, idx = 1; s < staN - 1e-6; s += perSheet, idx++){
    const sEnd = Math.min(s + perSheet, staN);
    /* בסיס הגרף: מתחת לגובה המינימלי, עם התאמה לגובה הזמין */
    let base = zmin;
    if((zmax - zmin) * kv > gh) base = zmax - gh/kv;
    const X = x => A.x + (x - s)*k;
    const Y = z => A.y + gh - (z - base)*kv;
    let body = T(A.x + A.w/2, A.y - 2,
                 `חתך אורך – אופקי 1:${Dh} · אנכי 1:${Math.round(Dh/VE)} (הגזמה ×${VE})`,
                 5, {weight:700, lay:'SH-TEXT'});
    /* רשת */
    const gs = Dh >= 1000 ? 100 : Dh >= 500 ? 50 : 20;
    for(let x = Math.ceil(s/gs)*gs; x <= sEnd + 1e-6; x += gs){
      body += LN(X(x), A.y, X(x), A.y + gh, {lay:'VA-GRID', sw:0.12, stroke:'#c8ced6'});
      body += T(X(x), A.y + gh + 4, stationLabel(x), 2.4, {lay:'VA-TEXT', rot:-90});
    }
    const dz = (zmax - base) > 20 ? 5 : (zmax - base) > 8 ? 2 : 1;
    for(let z = Math.ceil(base/dz)*dz; z <= zmax + 1e-6; z += dz){
      const yy = Y(z); if(yy < A.y - 1e-6) continue;
      body += LN(A.x, yy, A.x + (sEnd - s)*k, yy, {lay:'VA-GRID', sw:0.12, stroke:'#c8ced6'});
      body += T(A.x - 2, yy + 1, z.toFixed(0), 2.4, {anchor:'end', lay:'VA-TEXT'});
    }
    body += R(A.x, A.y, (sEnd - s)*k, gh, {lay:'VA-GRID', sw:0.3});
    /* קו קרקע */
    const gpts = ground.filter(p=>p[0] >= s - 1e-6 && p[0] <= sEnd + 1e-6);
    if(gpts.length > 1)
      body += `<path d="${gpts.map((p,i)=>(i?'L':'M')+N3(X(p[0]))+' '+N3(Y(p[1]))).join(' ')}" fill="none" stroke="#7a6a52" stroke-width="0.5" data-lay="VA-GROUND"/>`;
    /* קו אדום מתוכנן */
    if(data){
      const dpts = [];
      for(let x = s; x <= sEnd + 1e-6; x += Math.max(1, (sEnd - s)/400)){
        const e = designElev(x, data); if(e != null) dpts.push([x, e]);
      }
      if(dpts.length > 1)
        body += `<path d="${dpts.map((p,i)=>(i?'L':'M')+N3(X(p[0]))+' '+N3(Y(p[1]))).join(' ')}" fill="none" stroke="#c0392b" stroke-width="0.7" data-lay="VA-DESIGN"/>`;
      (data.curves||[]).forEach(c=>{
        if(c.st < s || c.st > sEnd) return;
        body += LN(X(c.st), A.y, X(c.st), A.y + gh, {lay:'VA-PVI', sw:0.25, stroke:'#c0392b', dash:'2 1.5'});
        body += T(X(c.st), A.y + 5, `${c.crest?'קמור':'קעור'} L=${c.L.toFixed(0)} A=${c.A.toFixed(2)}%`,
                  2.6, {color:'#c0392b', lay:'VA-TEXT'});
      });
    }
    /* פס נתונים: תחנה, גובה קרקע, גובה מתוכנן */
    const by = A.y + gh + 8, rowH = (bandH - 8)/3;
    ['תחנה', 'קרקע', 'מתוכנן'].forEach((lab, i)=>{
      body += R(A.x - 26, by + i*rowH, 26, rowH, {lay:'VA-TEXT', sw:0.2});
      body += T(A.x - 2, by + i*rowH + rowH - 1.4, lab, 2.4, {anchor:'end', lay:'VA-TEXT'});
      body += R(A.x, by + i*rowH, (sEnd - s)*k, rowH, {lay:'VA-TEXT', sw:0.2});
    });
    for(let x = Math.ceil(s/gs)*gs; x <= sEnd + 1e-6; x += gs){
      const g = groundElev(x, ground), d = data ? designElev(x, data) : null;
      body += T(X(x), by + rowH - 1.4, stationLabel(x), 2.2, {lay:'VA-TEXT', rot:-90});
      body += T(X(x), by + 2*rowH - 1.4, g == null ? '' : g.toFixed(2), 2.2, {lay:'VA-TEXT', rot:-90});
      body += T(X(x), by + 3*rowH - 1.4, d == null ? '' : d.toFixed(2), 2.2, {lay:'VA-TEXT', rot:-90});
    }
    body += scaleBar(PAD.l+10, A0.h-PAD.b-12, Dh, Dh >= 1000 ? 50 : 20);
    const m = Object.assign({}, meta, {
      title: `חתך אורך ${stationLabel(s)} – ${stationLabel(sEnd)}`,
      scale: `1:${Dh} / 1:${Math.round(Dh/VE)}`, dwg: 'V-' + String(idx).padStart(2, '0')});
    sheets.push({name: 'חתך אורך ' + idx, svg: wrapSheet(body, m, frameSVG)});
  }
  return sheets;
}

/* ======================================================================
   גיליון חתכים זמניים – גושים מוכנים מהכלי "חתך זמני"
   ====================================================================== */
function tempSheets(blocks, D, meta, frameSVG){
  if(!blocks || !blocks.length) return [];
  const A = sheetArea();
  const totalH = blocks.reduce((a,b)=>a + b.h + 14, 0);
  let y = A.y + Math.max(0, (A.h - totalH)/2), body = '';
  body += T(A.x + A.w/2, A.y - 2, `הסדרי תנועה זמניים – קנה מידה 1:${D}`, 5, {weight:700, lay:'SH-TEXT'});
  blocks.forEach(b=>{
    const x = A.x + Math.max(0, (A.w - b.w)/2);
    body += T(x + b.w/2, y - 2, b.title || '', 4, {weight:700, lay:'SH-TEXT'});
    body += `<g transform="translate(${N3(x)} ${N3(y)})">${b.g}</g>`;
    y += b.h + 14;
  });
  body += scaleBar(PAD.l+10, A0.h-PAD.b-12, D, 5);
  const m = Object.assign({}, meta, {title:'חתכים זמניים', scale:'1:'+D, dwg:'T-01'});
  return [{name:'חתכים זמניים', svg: wrapSheet(body, m, frameSVG)}];
}
