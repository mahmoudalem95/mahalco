/* ======================================================================
   דף הניהול: מצב הפרויקט, הגשר אל ארבעת הכלים, וארבעת השלבים.
   ====================================================================== */
const $ = id => document.getElementById(id);
const DWG_SERVICE = 'https://mahalco-dwg.onrender.com/dxf2dwg';

let toastT = null;
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('on'), 2600);
}
function logTo(id, msg){
  const el = $(id); el.hidden = false;
  el.textContent += (el.textContent ? '\n' : '') + msg;
  el.scrollTop = el.scrollHeight;
}
function todayStr(){ return new Date().toLocaleDateString('he-IL'); }

/* ---------- מצב הפרויקט ---------- */
const P = {
  v: 1, name: '',
  survey: {pts: [], layers: {}, img: null},     /* img: {src, A..F, geo} */
  align:  null,                                  /* {state, axes, junctions} */
  vert:   null,                                  /* {ground, pvi, data, ...} */
  frame:  null,                                  /* {svg, name} */
  meta:   {office:'MAHALCO – הנדסה אזרחית ותחבורה', proj:'', drawn:'', date: todayStr()},
  out:    {planD:500, step:20, xD:50, vD:1000, ve:10, temp:'no'}
};
const KEY = 'mahalco-project';
function persist(){
  try{
    const slim = JSON.parse(JSON.stringify(P));
    if(slim.survey.pts.length > 40000) slim.survey.pts = slim.survey.pts.slice(0, 40000);
    localStorage.setItem(KEY, JSON.stringify(slim));
  }catch(e){}
}
function restore(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if(s && s.v) Object.assign(P, s);
  }catch(e){}
}

/* ---------- הגשר אל הכלים ---------- */
const FRAMES = {alignment: 'fAlign', vertical: 'fVert'};
const ready = {};
let rid = 0; const waiting = {};
window.addEventListener('message', ev=>{
  const m = ev.data;
  if(!m || m.ns !== 'mahalco') return;
  if(m.t === 'ready'){ ready[m.tool] = true; return; }
  if(m.t === 'reply' && waiting[m.rid]){ waiting[m.rid](m); delete waiting[m.rid]; }
});
function frameWin(tool){
  const id = FRAMES[tool];
  if(id) return $(id).contentWindow;
  return hidden(tool).contentWindow;
}
/* חתך טיפוסי וחתך זמני נטענים ברקע – הם משמשים כתבנית בלבד */
const HIDDEN = {typical: 'typical-section-8.html', temporary: 'temporary-section-5.html'};
function hidden(tool){
  let f = document.getElementById('hid-' + tool);
  if(!f){
    f = document.createElement('iframe');
    f.id = 'hid-' + tool; f.src = HIDDEN[tool];
    f.style.cssText = 'position:fixed;inset-inline-start:-4000px;top:0;width:1400px;height:900px;border:0';
    document.body.appendChild(f);
  }
  return f;
}
function call(tool, t, extra, ms){
  return new Promise((res, rej)=>{
    const id = ++rid;
    waiting[id] = m => m.ok ? res(m.data) : rej(new Error(m.err || 'שגיאה בכלי ' + tool));
    try{ frameWin(tool).postMessage(Object.assign({ns:'mahalco', t, rid:id}, extra||{}), '*'); }
    catch(e){ delete waiting[id]; rej(e); return; }
    setTimeout(()=>{ if(waiting[id]){ delete waiting[id]; rej(new Error('הכלי ' + tool + ' לא הגיב')); } }, ms || 20000);
  });
}
async function waitReady(tool, ms){
  hidden(tool) && 0;
  if(FRAMES[tool]) $(FRAMES[tool]);
  else hidden(tool);
  const t0 = Date.now();
  while(!ready[tool]){
    if(Date.now() - t0 > (ms || 25000)) throw new Error('הכלי ' + tool + ' לא נטען');
    await new Promise(r=>setTimeout(r, 150));
  }
}

/* ---------- ניווט בין השלבים ---------- */
document.querySelectorAll('.rail button').forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll('.rail button').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.step').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    $('s' + b.dataset.step).classList.add('on');
  };
});
function markDone(step, done){
  const b = document.querySelector('.rail button[data-step="' + step + '"]');
  if(b) b.classList.toggle('done', !!done);
}
function refreshTags(){
  const n = P.survey.pts.length;
  $('surveyTag').textContent = n ? n.toLocaleString('he-IL') + ' נקודות מדידה' : 'אין מדידה';
  $('surveyTag').className = 'tag' + (n ? ' ok' : '');
  markDone(1, n > 0 || !!P.survey.img);
  const ax = P.align && P.align.axes ? P.align.axes.length : 0;
  $('axTag').textContent = ax ? ax + ' צירים · ' + Math.round(P.align.axes.reduce((a,b)=>a+(b.length||0),0)) + ' מ׳' : 'אין צירים';
  $('axTag').className = 'tag' + (ax ? ' ok' : '');
  markDone(2, ax > 0);
  const vd = P.vert && P.vert.data;
  $('vaTag').textContent = vd ? (P.vert.data.pvi.length + ' נקודות שבירה אנכיות') : 'אין ציר אנכי';
  $('vaTag').className = 'tag' + (vd ? ' ok' : '');
  markDone(3, !!vd);
  $('frameTag').textContent = P.frame ? ('מסגרת: ' + P.frame.name) : 'מסגרת מובנית';
  $('frameTag').className = 'tag' + (P.frame ? ' ok' : '');
}

/* ======================================================================
   שלב 1 – מדידה
   ====================================================================== */
$('bSurvey').onclick = ()=>$('fSurvey').click();
$('fSurvey').onchange = async e=>{
  const f = e.target.files[0]; e.target.value = '';
  if(!f) return;
  $('sLog').textContent = ''; $('sLog').hidden = true;
  const ext = (f.name.split('.').pop() || '').toLowerCase();
  try{
    if(/^image\//.test(f.type)){
      const src = await fileData(f);
      P.survey.img = {src, A:1, B:0, C:0, D:0, E:-1, F:0, geo:false, name:f.name};
      photoLoad(src);
      logTo('sLog', 'נטען תצלום: ' + f.name + ' — כיילו אותו בשתי נקודות וסמנו גבהים.');
      toast('התצלום נטען – עברו לכיול');
    } else if(ext === 'dwg'){
      logTo('sLog', 'ממיר DWG ל-DXF בשירות ההמרה…');
      const txt = await dwgToDxf(await f.arrayBuffer(), svcUrl());
      takeSurvey(surveyFromDXF(txt), f.name);
    } else if(ext === 'dxf'){
      takeSurvey(surveyFromDXF(await f.text()), f.name);
    } else {
      takeSurvey(surveyFromText(await f.text(), $('colOrder').value), f.name);
    }
  }catch(err){
    logTo('sLog', 'שגיאה: ' + (err.message || err));
    toast('קריאת הקובץ נכשלה');
  }
};
function fileData(f){
  return new Promise((res, rej)=>{ const r = new FileReader();
    r.onload = ()=>res(r.result); r.onerror = ()=>rej(new Error('קריאת הקובץ נכשלה')); r.readAsDataURL(f); });
}
function svcUrl(){ return ($('oSvc').value || '').trim() || DWG_SERVICE; }

function takeSurvey(res, name){
  if(!res.pts.length){ logTo('sLog', 'לא נמצאו נקודות עם גובה בקובץ ' + name); toast('לא נמצאו נקודות'); return; }
  P.survey.pts = res.pts; P.survey.layers = res.layers;
  logTo('sLog', name + ': נקראו ' + res.pts.length + ' נקודות');
  const zs = res.pts.map(p=>p.z);
  logTo('sLog', 'טווח גבהים ' + Math.min.apply(null, zs).toFixed(2) + ' – ' + Math.max.apply(null, zs).toFixed(2) + ' מ׳');
  renderLayers();
  drawSurvey();
  refreshTags(); persist();
  toast(res.pts.length + ' נקודות מדידה נטענו');
}
function renderLayers(){
  const row = $('layRow'); row.innerHTML = '';
  const L = P.survey.layers || {};
  Object.keys(L).sort((a,b)=>L[b]-L[a]).slice(0, 14).forEach(k=>{
    const s = document.createElement('span'); s.className = 'tag';
    s.textContent = k + ' · ' + L[k]; row.appendChild(s);
  });
}
function surveyBox(pts){
  const b = {x0:1e18, y0:1e18, x1:-1e18, y1:-1e18, z0:1e18, z1:-1e18};
  pts.forEach(p=>{ if(p.x<b.x0)b.x0=p.x; if(p.y<b.y0)b.y0=p.y; if(p.x>b.x1)b.x1=p.x; if(p.y>b.y1)b.y1=p.y;
                   if(p.z<b.z0)b.z0=p.z; if(p.z>b.z1)b.z1=p.z; });
  return b;
}
function drawSurvey(){
  const cv = $('surveyCv'), c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  const pts = P.survey.pts;
  if(!pts.length){
    c.fillStyle = '#8b96ad'; c.font = '14px Heebo,Arial'; c.textAlign = 'center';
    c.fillText('כאן תוצג המדידה אחרי הטעינה', cv.width/2, cv.height/2);
    return;
  }
  const b = surveyBox(pts), pad = 22;
  const k = Math.min((cv.width-2*pad)/Math.max(1, b.x1-b.x0), (cv.height-2*pad)/Math.max(1, b.y1-b.y0));
  const X = x => pad + (x-b.x0)*k, Y = y => cv.height - pad - (y-b.y0)*k;
  const span = Math.max(0.001, b.z1-b.z0);
  pts.forEach(p=>{
    const t = (p.z - b.z0)/span;                       /* כחול נמוך → חום גבוה */
    c.fillStyle = `rgb(${Math.round(60+150*t)},${Math.round(130-40*t)},${Math.round(200-150*t)})`;
    c.fillRect(X(p.x)-1.2, Y(p.y)-1.2, 2.4, 2.4);
  });
  /* צירים מהשלב הבא, אם כבר קיימים */
  if(P.align && P.align.axes){
    c.strokeStyle = '#ff9f43'; c.lineWidth = 2;
    P.align.axes.forEach(a=>{
      if(!a.pis || a.pis.length < 2) return;
      c.beginPath(); a.pis.forEach((p,i)=> i ? c.lineTo(X(p.x), Y(p.y)) : c.moveTo(X(p.x), Y(p.y)));
      c.stroke();
    });
  }
  c.fillStyle = '#585f66'; c.font = '12px Heebo,Arial'; c.textAlign = 'start';
  c.fillText(`${pts.length} נק׳ · גובה ${b.z0.toFixed(2)}–${b.z1.toFixed(2)} מ׳ · שטח ${Math.round(b.x1-b.x0)}×${Math.round(b.y1-b.y0)} מ׳`, 10, 16);
}

/* ---------- תצלום: כיול וסימון גבהים ---------- */
const PH = {img:null, mode:'cal', cal:[], lev:[], k:1, ox:0, oy:0};
function photoLoad(src){
  $('photoCard').hidden = false;
  const im = new Image();
  im.onload = ()=>{ PH.img = im; PH.cal = []; PH.lev = []; photoDraw(); };
  im.src = src;
}
function photoDraw(){
  const cv = $('photoCv'), c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  if(!PH.img) return;
  const k = Math.min(cv.width/PH.img.width, cv.height/PH.img.height);
  PH.k = k; PH.ox = (cv.width - PH.img.width*k)/2; PH.oy = (cv.height - PH.img.height*k)/2;
  c.drawImage(PH.img, PH.ox, PH.oy, PH.img.width*k, PH.img.height*k);
  const dot = (p, col, txt)=>{
    const x = PH.ox + p.px*k, y = PH.oy + p.py*k;
    c.beginPath(); c.arc(x, y, 5, 0, 7); c.fillStyle = col; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#14171a'; c.font = 'bold 12px Heebo,Arial'; c.textAlign = 'center';
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeText(txt, x, y-9); c.fillText(txt, x, y-9);
  };
  PH.cal.forEach((p,i)=>dot(p, '#2f6fed', 'כיול ' + (i+1)));
  PH.lev.forEach(p=>dot(p, '#c0392b', p.z.toFixed(2)));
  $('calTag').textContent = PH.cal.length >= 2 ? ('מכויל · ' + PH.lev.length + ' גבהים') : ('כיול: ' + PH.cal.length + '/2');
  $('calTag').className = 'tag' + (PH.cal.length >= 2 ? ' ok' : ' warn');
}
$('mCal').onclick = ()=>{ PH.mode = 'cal'; $('mCal').classList.add('pri'); $('mLev').classList.remove('pri'); };
$('mLev').onclick = ()=>{ PH.mode = 'lev'; $('mLev').classList.add('pri'); $('mCal').classList.remove('pri'); };
$('mClr').onclick = ()=>{ PH.cal = []; PH.lev = []; photoDraw(); };
$('photoCv').addEventListener('click', e=>{
  if(!PH.img) return;
  const r = e.target.getBoundingClientRect();
  const px = ((e.clientX - r.left) * e.target.width / r.width - PH.ox) / PH.k;
  const py = ((e.clientY - r.top) * e.target.height / r.height - PH.oy) / PH.k;
  if(px < 0 || py < 0 || px > PH.img.width || py > PH.img.height) return;
  if(PH.mode === 'cal'){
    const v = prompt('קואורדינטות הנקודה (E,N) — למשל 200123.5,745678.2');
    if(!v) return;
    const n = v.split(/[,\s]+/).map(Number);
    if(n.length < 2 || n.some(isNaN)) { toast('קלט לא תקין'); return; }
    PH.cal.push({px, py, x:n[0], y:n[1]});
    if(PH.cal.length >= 2) photoCalibrate();
  } else {
    const v = prompt('גובה הנקודה (מ׳)');
    const z = Number(v);
    if(v === null || isNaN(z)) return;
    PH.lev.push({px, py, z});
    photoCommit();
  }
  photoDraw();
});
/* שתי נקודות → הזזה, סיבוב ושינוי קנה מידה אחידים */
function photoCalibrate(){
  const [a, b] = PH.cal.slice(-2);
  const dpx = b.px - a.px, dpy = b.py - a.py;
  const dwx = b.x - a.x,  dwy = b.y - a.y;
  const lp = Math.hypot(dpx, dpy), lw = Math.hypot(dwx, dwy);
  if(lp < 1 || lw < 1e-6){ toast('בחרו שתי נקודות רחוקות זו מזו'); return; }
  const s = lw/lp, ang = Math.atan2(dwy, dwx) - Math.atan2(-dpy, dpx);
  const co = Math.cos(ang)*s, si = Math.sin(ang)*s;
  /* world = M·pixel + t   (ציר Y של התמונה יורד) */
  const A = co, B = si, D = si, E = -co;
  const C = a.x - (A*a.px + B*a.py), F = a.y - (D*a.px + E*a.py);
  P.survey.img = Object.assign(P.survey.img || {}, {A, B, C, D, E, F, geo:true});
  photoCommit();
  toast('התצלום כויל');
}
function photoCommit(){
  const g = P.survey.img;
  if(!g || !g.geo) return;
  P.survey.pts = PH.lev.map(p=>({x: g.A*p.px + g.B*p.py + g.C, y: g.D*p.px + g.E*p.py + g.F, z: p.z}));
  P.survey.layers = {'מהתצלום': P.survey.pts.length};
  renderLayers(); drawSurvey(); refreshTags(); persist();
}

/* ---------- רקע לשלב 2: המדידה כתמונה מכוילת ---------- */
function surveyRaster(){
  if(P.survey.img && P.survey.img.geo) return P.survey.img;      /* תצלום מכויל */
  const pts = P.survey.pts;
  if(!pts.length) return null;
  const b = surveyBox(pts);
  const W = 2000, k = W / Math.max(1, b.x1 - b.x0);
  const H = Math.max(200, Math.min(2000, Math.round((b.y1 - b.y0) * k)));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
  const span = Math.max(0.001, b.z1 - b.z0);
  pts.forEach(p=>{
    const t = (p.z - b.z0)/span;
    c.fillStyle = `rgb(${Math.round(60+150*t)},${Math.round(130-40*t)},${Math.round(200-150*t)})`;
    c.fillRect((p.x-b.x0)*k - 1.5, H - (p.y-b.y0)*k - 1.5, 3, 3);
  });
  return {src: cv.toDataURL('image/png'), A: 1/k, B: 0, C: b.x0, D: 0, E: -1/k, F: b.y0 + H/k, geo: true, op: 0.8};
}
$('bToAxes').onclick = ()=>{
  document.querySelector('.rail button[data-step="2"]').click();
  setTimeout(()=>$('bPushBg').click(), 300);
};

/* ======================================================================
   שלב 2 – צירים
   ====================================================================== */
$('bPushBg').onclick = async ()=>{
  const bg = surveyRaster();
  if(!bg){ toast('אין מדידה לטעינה'); return; }
  try{ await waitReady('alignment'); await call('alignment', 'push', {data:{bg}}); toast('המדידה נטענה כרקע'); }
  catch(e){ toast(e.message); }
};
$('bPullAx').onclick = async ()=>{
  try{
    await waitReady('alignment');
    P.align = await call('alignment', 'pull');
    refreshTags(); drawSurvey(); persist();
    toast((P.align.axes || []).length + ' צירים נשמרו בפרויקט');
  }catch(e){ toast(e.message); }
};

/* ======================================================================
   שלב 3 – ציר אנכי
   ====================================================================== */
$('bPushVA').onclick = async ()=>{
  if(!P.align || !P.align.axes || !P.align.axes.length){ toast('שמרו קודם צירים בשלב 2'); return; }
  try{
    await waitReady('vertical');
    await call('vertical', 'push', {data:{axes: P.align.axes.map(a=>({name:a.name, pis:a.pis})),
                                          survey: P.survey.pts}});
    toast('הצירים והמדידה הועברו');
  }catch(e){ toast(e.message); }
};
$('bPullVA').onclick = async ()=>{
  try{
    await waitReady('vertical');
    P.vert = await call('vertical', 'pull');
    refreshTags(); persist();
    toast(P.vert.data ? 'הציר האנכי נשמר' : 'עדיין אין תכנון אנכי תקף');
  }catch(e){ toast(e.message); }
};

/* ======================================================================
   שלב 4 – מסגרת, מטא-דאטה ושמירה
   ====================================================================== */
$('bFrame').onclick = ()=>$('fFrame').click();
$('fFrame').onchange = async e=>{
  const f = e.target.files[0]; e.target.value = '';
  if(!f) return;
  try{
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    const txt = ext === 'dwg' ? await dwgToDxf(await f.arrayBuffer(), svcUrl()) : await f.text();
    const fr = frameFromDXF(txt, {w:1189, h:841});
    P.frame = {svg: fr.svg, name: f.name, entities: fr.entities};
    refreshTags(); persist();
    toast('המסגרת נקלטה · ' + fr.entities + ' ישויות');
  }catch(err){ toast('קריאת המסגרת נכשלה: ' + (err.message || err)); }
};
$('bFrameClr').onclick = ()=>{ P.frame = null; refreshTags(); persist(); toast('חוזרים למסגרת המובנית'); };

['oPlanD','oStep','oXD','oVD','oVE','oTemp'].forEach(id=>{
  $(id).onchange = ()=>{ P.out = {planD:+$('oPlanD').value, step:+$('oStep').value, xD:+$('oXD').value,
                                  vD:+$('oVD').value, ve:+$('oVE').value, temp:$('oTemp').value}; persist(); };
});
['mOffice','mProj','mDrawn','mDate'].forEach(id=>{
  $(id).onchange = ()=>{ P.meta = {office:$('mOffice').value, proj:$('mProj').value,
                                   drawn:$('mDrawn').value, date:$('mDate').value}; persist(); };
});
$('pname').onchange = ()=>{ P.name = $('pname').value; if(!P.meta.proj){ P.meta.proj = P.name; $('mProj').value = P.name; } persist(); };
$('oSvc').onchange = ()=>{ try{ localStorage.setItem('mahalco-dwg-service', $('oSvc').value.trim()); }catch(e){} };

/* ---------- שמירה ופתיחה ---------- */
$('bSave').onclick = ()=>{
  const blob = new Blob([JSON.stringify(P)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (P.name || 'mahalco-project').replace(/\s+/g, '-') + '.mahalco.json';
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  persist(); toast('הפרויקט נשמר');
};
$('bOpen').onclick = ()=>$('fOpen').click();
$('fOpen').onchange = async e=>{
  const f = e.target.files[0]; e.target.value = '';
  if(!f) return;
  try{
    const j = JSON.parse(await f.text());
    if(!j.v) throw new Error('קובץ פרויקט לא תקין');
    Object.assign(P, j);
    fillUI(); drawSurvey(); renderLayers(); refreshTags(); persist();
    if(P.align && P.align.state){ waitReady('alignment').then(()=>call('alignment','push',{data:{state:P.align.state}})).catch(()=>{}); }
    toast('הפרויקט נפתח');
  }catch(err){ toast('פתיחה נכשלה: ' + (err.message || err)); }
};
function fillUI(){
  $('pname').value = P.name || '';
  $('mOffice').value = P.meta.office || ''; $('mProj').value = P.meta.proj || '';
  $('mDrawn').value = P.meta.drawn || '';   $('mDate').value = P.meta.date || todayStr();
  $('oPlanD').value = P.out.planD; $('oStep').value = P.out.step; $('oXD').value = P.out.xD;
  $('oVD').value = P.out.vD; $('oVE').value = P.out.ve; $('oTemp').value = P.out.temp;
  try{ $('oSvc').value = localStorage.getItem('mahalco-dwg-service') || DWG_SERVICE; }catch(e){ $('oSvc').value = DWG_SERVICE; }
}

restore(); fillUI(); renderLayers(); drawSurvey(); refreshTags();
$('mCal').classList.add('pri');
