/* ======================================================================
   בניית הפלט: אוסף מכל הכלים, מרכיב מודל + לשוניות נייר, וממיר ל-DWG.
   ====================================================================== */
function axisFrameAt(axis, sta){            /* נקודה על הציר לפי סטציה */
  const els = axis.elements || [];
  if(!els.length) return null;
  let e = els[els.length-1];
  for(const x of els){ if(sta <= x.sta0 + x.length + 1e-9){ e = x; break; } }
  const t = Math.max(0, Math.min(e.length, sta - e.sta0));
  if(e.type === 'line'){
    const dx = e.to.x - e.from.x, dy = e.to.y - e.from.y, L = Math.hypot(dx, dy) || 1;
    return {x: e.from.x + dx*t/L, y: e.from.y + dy*t/L};
  }
  if(e.type === 'arc' && e.center){
    const a0 = Math.atan2(e.from.y - e.center.y, e.from.x - e.center.x);
    const sg = Math.sign(e.D || 1), a = a0 + sg*t/e.R;
    return {x: e.center.x + e.R*Math.cos(a), y: e.center.y + e.R*Math.sin(a)};
  }
  return {x: e.from ? e.from.x : 0, y: e.from ? e.from.y : 0};
}

async function buildOutput(){
  const btn = $('bBuild');
  btn.disabled = true;
  $('bLog').textContent = ''; $('bLog').hidden = false;
  const say = m => logTo('bLog', m);
  try{
    const meta = Object.assign({}, P.meta, {projTitle: P.name || P.meta.proj, date: P.meta.date || todayStr()});
    const frameSVG = P.frame ? P.frame.svg : null;
    const o = P.out;
    const sheets = [], model = [];

    /* ---- 1. התכנית ---- */
    say('אוסף את התכנית מבונה הצירים…');
    await waitReady('alignment');
    if(!P.align) P.align = await call('alignment', 'pull');
    const plan = await call('alignment', 'plan', {D: o.planD}, 60000);
    const ops = plan.ops || [];
    if(ops.length){
      model.push({ops});                                  /* מודל במטרים 1:1 */
      const ps = planSheets(ops, o.planD, meta, frameSVG);
      ps.forEach(s=>sheets.push(s));
      say('תכנית: ' + ops.length + ' ישויות · ' + ps.length + ' גיליונות');
    } else say('אזהרה: אין תכנית לייצוא — לא שורטטו צירים.');

    /* ---- 2. חתכי רוחב כל X מטר ---- */
    const axes = (P.align && P.align.axes || []).filter(a=>a.elements && a.length > 0);
    if(axes.length){
      say('בונה את תבנית חתך הרוחב…');
      await waitReady('typical');
      const blocks = await call('typical', 'render', {D: o.xD}, 40000);
      const block = blocks[0];
      const vdata = P.vert && P.vert.data;
      const ground = (P.vert && P.vert.ground) || [];
      let total = 0;
      for(const ax of axes){
        const rows = [];
        for(let s = 0; s <= ax.length + 1e-6; s += o.step){
          const sta = Math.min(s, ax.length);
          const pt = axisFrameAt(ax, sta);
          let g = groundElev(sta, ground);
          if(g == null && pt && P.survey.pts.length) g = idw(pt, P.survey.pts, 15);
          rows.push({sta, design: vdata ? designElev(sta, vdata) : null, ground: g});
        }
        const xs = crossSheets(block, rows, o.xD, meta, frameSVG, 'חתכי רוחב · ' + (ax.name || 'ציר'));
        xs.forEach(s=>sheets.push(s));
        total += rows.length;
        say('ציר ' + (ax.name || '') + ': ' + rows.length + ' חתכים כל ' + o.step + ' מ׳ · ' + xs.length + ' גיליונות');
      }
      if(!total) say('אזהרה: לא נוצרו חתכי רוחב.');
    }

    /* ---- 3. חתך אורך ---- */
    if(P.vert && (P.vert.ground || []).length){
      const vs = profileSheets(P.vert, o.vD, o.ve, meta, frameSVG);
      vs.forEach(s=>sheets.push(s));
      say('חתך אורך: ' + vs.length + ' גיליונות');
    } else say('אין חתך אורך — לא נשמר ציר אנכי בשלב 3.');

    /* ---- 4. חתכים זמניים ---- */
    if(o.temp === 'yes'){
      say('בונה חתכים זמניים…');
      try{
        await waitReady('temporary');
        const t = await call('temporary', 'render', {D: o.xD}, 40000);
        const ts = tempSheets(t.blocks, o.xD, meta, frameSVG);
        ts.forEach(s=>sheets.push(s));
        say('חתכים זמניים: ' + t.blocks.length + ' חתכים');
      }catch(e){ say('אזהרה: החתכים הזמניים לא נוצרו — ' + e.message); }
    }

    if(!sheets.length && !model.length) throw new Error('אין תוכן לייצוא');

    /* ---- 5. כתיבת הקובץ ---- */
    say('כותב ' + sheets.length + ' לשוניות נייר…');
    const res = CAD.fromSheets({model, sheets}, {fills: $('oFill').checked, rtl: $('oRtl').checked});
    say('DXF: ' + (res.dxf.length/1024).toFixed(0) + ' KB · ' + res.entities + ' ישויות · ' + res.layers.length + ' שכבות');

    const base = 'MAHALCO_' + (P.name || 'project').replace(/\s+/g, '-') + '_' + new Date().toISOString().slice(0,10);
    const dl = (blob, name)=>{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    };
    const svc = svcUrl();
    if(svc){
      say('ממיר ל-DWG בשירות ההמרה… (אם השירות היה רדום ההמרה הראשונה עשויה לקחת עד דקה)');
      try{
        const ctl = new AbortController(), to = setTimeout(()=>ctl.abort(), 180000);
        let r;
        try{ r = await fetch(svc, {method:'POST', headers:{'Content-Type':'application/dxf'}, body: res.dxf, signal: ctl.signal}); }
        finally{ clearTimeout(to); }
        if(!r.ok) throw new Error('HTTP ' + r.status);
        const blob = await r.blob();
        if(blob.size < 512) throw new Error('תשובה ריקה מהשירות');
        dl(blob, base + '.dwg');
        say('נוצר ' + base + '.dwg · ' + (blob.size/1024).toFixed(0) + ' KB');
        toast('קובץ ה-DWG ירד');
        return;
      }catch(err){
        say('ההמרה נכשלה (' + (err.message || err) + ') – יורד DXF במקום.');
      }
    }
    dl(new Blob([res.dxf], {type:'application/dxf'}), base + '.dxf');
    say('נוצר ' + base + '.dxf');
    toast('קובץ ה-DXF ירד');
  }catch(err){
    logTo('bLog', 'שגיאה: ' + (err.message || err));
    toast('הבנייה נכשלה');
  }finally{
    btn.disabled = false;
  }
}
/* גובה קרקע מענן הנקודות, בשיטת מרחק הפוך בריבוע */
function idw(pt, pts, radius){
  let ws = 0, zs = 0;
  for(const p of pts){
    const d = Math.hypot(p.x - pt.x, p.y - pt.y);
    if(d <= radius){ const w = 1/Math.pow(Math.max(d, 0.5), 2); ws += w; zs += w*p.z; }
  }
  return ws ? zs/ws : null;
}
$('bBuild').onclick = buildOutput;
