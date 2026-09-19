/* ======================================================================
   קריאת מדידה וקריאת מסגרת שרטוט מקובצי DXF/DWG, ומענן נקודות טקסטואלי.
   DWG נשלח לשירות ההמרה (/dwg2dxf) וחוזר כ-DXF, ומשם הכול זהה.
   ====================================================================== */

/* ---- קורא זוגות קוד/ערך של DXF ---- */
function dxfPairs(text){
  const L = text.split(/\r\n|\r|\n/);
  const out = [];
  for(let i=0; i+1 < L.length; i += 2){
    const c = parseInt(L[i].trim(), 10);
    if(isNaN(c)) continue;
    out.push([c, L[i+1]]);
  }
  return out;
}

/* ---- פירוק ל"ישויות": כל ישות היא מפה של קוד → מערך ערכים ---- */
function dxfEntities(text, sections){
  sections = sections || ['ENTITIES', 'BLOCKS'];
  const P = dxfPairs(text);
  const ents = [];
  let inSec = false, cur = null;
  for(let i = 0; i < P.length; i++){
    const [c, v] = P[i];
    if(c === 0 && v === 'SECTION'){
      const nm = (P[i+1] && P[i+1][0] === 2) ? P[i+1][1].trim() : '';
      inSec = sections.indexOf(nm) >= 0;
      continue;
    }
    if(c === 0 && v === 'ENDSEC'){ if(cur) ents.push(cur); cur = null; inSec = false; continue; }
    if(!inSec) continue;
    if(c === 0){
      if(cur) ents.push(cur);
      cur = {type: v.trim(), g: {}};
      continue;
    }
    if(!cur) continue;
    (cur.g[c] = cur.g[c] || []).push(v);
  }
  if(cur) ents.push(cur);
  return ents;
}

const gNum = (e, c, i) => { const a = e.g[c]; return a && a[i||0] !== undefined ? parseFloat(a[i||0]) : undefined; };
const gStr = (e, c, i) => { const a = e.g[c]; return a && a[i||0] !== undefined ? String(a[i||0]).trim() : ''; };

/* ---- נקודות מדידה מתוך DXF ----
   נאסף כל מה שנושא גובה: POINT, VERTEX, 3DFACE, קודקודי פוליליין עם גובה,
   וכן כיתובי גובה (TEXT/MTEXT/ATTRIB שערכם מספר) – כפי שמקובל במדידות. */
function surveyFromDXF(text, opt){
  opt = opt || {};
  const ents = dxfEntities(text, ['ENTITIES']);
  const pts = [], layers = {};
  const add = (x, y, z, lay)=>{
    if(!isFinite(x) || !isFinite(y) || !isFinite(z)) return;
    pts.push({x, y, z});
    layers[lay || '0'] = (layers[lay || '0'] || 0) + 1;
  };
  ents.forEach(e=>{
    const lay = gStr(e, 8) || '0';
    switch(e.type){
      case 'POINT':
      case 'VERTEX':
        add(gNum(e,10), gNum(e,20), gNum(e,30) || 0, lay); break;
      case 'LWPOLYLINE': {
        const el = gNum(e,38) || 0, xs = e.g[10] || [], ys = e.g[20] || [];
        if(el) for(let i=0;i<xs.length;i++) add(parseFloat(xs[i]), parseFloat(ys[i]), el, lay);
        break;
      }
      case '3DFACE': {
        for(const c of [[10,20,30],[11,21,31],[12,22,32],[13,23,33]])
          add(gNum(e,c[0]), gNum(e,c[1]), gNum(e,c[2]), lay);
        break;
      }
      case 'INSERT':
        if(gNum(e,30)) add(gNum(e,10), gNum(e,20), gNum(e,30), lay);
        break;
      case 'TEXT': case 'MTEXT': case 'ATTRIB': {
        const raw = gStr(e,1).replace(/\\[A-Za-z][^;]*;/g, '').replace(/[{}]/g, '').trim();
        const v = parseFloat(raw.replace(',', '.'));
        const x = gNum(e,10), y = gNum(e,20), z0 = gNum(e,30) || 0;
        if(z0) { add(x, y, z0, lay); break; }
        /* כיתוב גובה: מספר סביר בלבד, כדי לא לאסוף מספרי תחנה או פיקטים */
        if(isFinite(v) && Math.abs(v) < 4000 && /^[-+]?\d+(\.\d+)?$/.test(raw)) add(x, y, v, lay);
        break;
      }
    }
  });
  return {pts, layers};
}

/* ---- ענן נקודות טקסטואלי: CSV / TXT / דוח מדידה ---- */
function surveyFromText(text, order){
  const pts = [];
  text.split(/\r\n|\r|\n/).forEach(line=>{
    const nums = (line.match(/-?\d+\.?\d*/g) || []).map(Number);
    if(nums.length < 3) return;
    const b = nums.length >= 4 ? nums.slice(1, 4) : nums.slice(0, 3);
    const [a, c, d] = b;
    const p = (order === 'yxz') ? {x:c, y:a, z:d} : {x:a, y:c, z:d};
    if(isFinite(p.x) && isFinite(p.y) && isFinite(p.z)) pts.push(p);
  });
  return {pts, layers:{'טקסט': pts.length}};
}

/* ---- המרת DWG ל-DXF דרך שירות ההמרה ---- */
async function dwgToDxf(buf, svc){
  const url = (svc || '').replace(/\/dxf2dwg\/?$/, '') .replace(/\/$/, '') + '/dwg2dxf';
  const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/octet-stream'}, body:buf});
  if(!r.ok) throw new Error('שירות ההמרה החזיר שגיאה ' + r.status);
  return await r.text();
}

/* ======================================================================
   מסגרת השרטוט של המשרד: DXF/DWG → SVG במ״מ, עם שמירת שמות השכבות,
   כך שהיא נכנסת לכל גיליון בדיוק כפי שהמשתמש שרטט אותה.
   ====================================================================== */
const ACI = {1:'#ff0000',2:'#ffff00',3:'#00ff00',4:'#00ffff',5:'#0000ff',6:'#ff00ff',
             7:'#000000',8:'#808080',9:'#c0c0c0',250:'#333333',251:'#5b5b5b',252:'#848484',
             253:'#adadad',254:'#d6d6d6',255:'#ffffff'};
function aciHex(n){ return ACI[n] || '#000000'; }

function frameFromDXF(text, sheet){
  const W = (sheet && sheet.w) || 1189, H = (sheet && sheet.h) || 841;
  const ents = dxfEntities(text, ['ENTITIES']);
  const raw = [];
  const box = {x0:1e18, y0:1e18, x1:-1e18, y1:-1e18};
  const see = (x, y)=>{ if(!isFinite(x)||!isFinite(y)) return;
    if(x<box.x0)box.x0=x; if(y<box.y0)box.y0=y; if(x>box.x1)box.x1=x; if(y>box.y1)box.y1=y; };

  ents.forEach(e=>{
    const lay = (gStr(e,8) || '0').replace(/[^\w֐-׿.\-]/g, '_');
    const col = e.g[62] ? aciHex(parseInt(e.g[62][0], 10)) : '#000000';
    switch(e.type){
      case 'LINE': {
        const p = [gNum(e,10), gNum(e,20), gNum(e,11), gNum(e,21)];
        if(p.some(v=>!isFinite(v))) return;
        see(p[0],p[1]); see(p[2],p[3]);
        raw.push({k:'line', p, lay, col});
        break;
      }
      case 'LWPOLYLINE': case 'POLYLINE': {
        const xs = e.g[10] || [], ys = e.g[20] || [], pts = [];
        for(let i=0;i<Math.min(xs.length, ys.length);i++){
          const x = parseFloat(xs[i]), y = parseFloat(ys[i]);
          if(!isFinite(x)||!isFinite(y)) continue;
          pts.push([x, y]); see(x, y);
        }
        if(pts.length > 1) raw.push({k:'poly', pts, closed: ((parseInt(gStr(e,70),10)||0) & 1) === 1, lay, col});
        break;
      }
      case 'CIRCLE': {
        const x = gNum(e,10), y = gNum(e,20), r = gNum(e,40);
        if(!isFinite(x)||!isFinite(r)) return;
        see(x-r,y-r); see(x+r,y+r);
        raw.push({k:'circle', x, y, r, lay, col});
        break;
      }
      case 'ARC': {
        const x = gNum(e,10), y = gNum(e,20), r = gNum(e,40);
        const a0 = (gNum(e,50)||0) * Math.PI/180, a1 = (gNum(e,51)||0) * Math.PI/180;
        if(!isFinite(x)||!isFinite(r)) return;
        let da = a1 - a0; while(da <= 0) da += 2*Math.PI;
        const n = Math.max(6, Math.ceil(da/0.15)), pts = [];
        for(let i=0;i<=n;i++){ const a = a0 + da*i/n;
          const px = x + r*Math.cos(a), py = y + r*Math.sin(a); pts.push([px, py]); see(px, py); }
        raw.push({k:'poly', pts, closed:false, lay, col});
        break;
      }
      case 'SOLID': {
        const q = [[gNum(e,10),gNum(e,20)],[gNum(e,11),gNum(e,21)],[gNum(e,13),gNum(e,23)],[gNum(e,12),gNum(e,22)]]
                  .filter(p=>isFinite(p[0])&&isFinite(p[1]));
        q.forEach(p=>see(p[0],p[1]));
        if(q.length>=3) raw.push({k:'poly', pts:q, closed:true, lay, col});
        break;
      }
      case 'TEXT': case 'MTEXT': {
        const s = gStr(e,1).replace(/\\[A-Za-z][^;]*;/g,'').replace(/[{}]/g,'').trim();
        const x = gNum(e,10), y = gNum(e,20), h = gNum(e,40) || 2.5;
        if(!s || !isFinite(x)) return;
        const j = parseInt(gStr(e,72),10) || 0;
        see(x, y); see(x + s.length*h*0.7, y + h);
        raw.push({k:'text', x, y, h, s, anchor: j===1?'middle':j===2?'end':'start', lay, col,
                  rot: gNum(e,50) || 0});
        break;
      }
    }
  });
  if(!raw.length) throw new Error('לא נמצאו ישויות בקובץ המסגרת');

  /* התאמה לגיליון: שומר יחס, ממורכז */
  const bw = box.x1 - box.x0 || 1, bh = box.y1 - box.y0 || 1;
  const k = Math.min(W / bw, H / bh);
  const ox = (W - bw*k) / 2, oy = (H - bh*k) / 2;
  const X = x => ox + (x - box.x0) * k;
  const Y = y => H - (oy + (y - box.y0) * k);           /* SVG: ציר Y יורד */
  const n = v => (Math.round(v*1000)/1000);
  const escX = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const A = o => ` data-lay="FRAME-${o.lay}" stroke="${o.col}"`;

  let svg = '';
  raw.forEach(o=>{
    if(o.k === 'line')
      svg += `<line x1="${n(X(o.p[0]))}" y1="${n(Y(o.p[1]))}" x2="${n(X(o.p[2]))}" y2="${n(Y(o.p[3]))}"${A(o)} stroke-width="0.35" fill="none"/>`;
    else if(o.k === 'poly'){
      const d = o.pts.map((p,i)=>(i?'L':'M') + n(X(p[0])) + ' ' + n(Y(p[1]))).join(' ') + (o.closed ? ' Z' : '');
      svg += `<path d="${d}"${A(o)} stroke-width="0.35" fill="none"/>`;
    } else if(o.k === 'circle')
      svg += `<circle cx="${n(X(o.x))}" cy="${n(Y(o.y))}" r="${n(o.r*k)}"${A(o)} stroke-width="0.35" fill="none"/>`;
    else if(o.k === 'text')
      svg += `<text x="${n(X(o.x))}" y="${n(Y(o.y))}" font-size="${n(o.h*k)}" text-anchor="${o.anchor}" fill="${o.col}" data-lay="FRAME-${o.lay}" style="font-family:Arial">${escX(o.s)}</text>`;
  });
  return {svg, entities: raw.length,
          layers: Array.from(new Set(raw.map(o=>'FRAME-' + o.lay)))};
}
