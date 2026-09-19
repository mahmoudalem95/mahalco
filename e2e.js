/* בדיקה מקצה לקצה: מדידה → צירים → ציר אנכי → קובץ אחד עם לשוניות */
const {chromium} = require('playwright');
const fs = require('fs');

(async ()=>{
  const b = await chromium.launch();
  const p = await b.newPage({viewport:{width:1500, height:950}});
  const errs = [];
  p.on('pageerror', e=>errs.push('pageerror: ' + e.message));
  p.on('console', m=>{ if(m.type()==='error' && !/ERR_TUNNEL|net::|favicon/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + __dirname + '/project-hub.html');
  await p.waitForTimeout(600);

  /* --- שלב 1: ענן נקודות סינתטי לאורך הציר --- */
  const survey = await p.evaluate(()=>{
    const pts = [];
    for(let s = -40; s <= 560; s += 4)
      for(let o = -30; o <= 30; o += 6){
        const x = s, y = o + 0.12*s, z = 100 + 0.02*s + 3*Math.sin(s/140) + 0.01*o;
        pts.push({x, y, z: +z.toFixed(3)});
      }
    P.survey.pts = pts; P.survey.layers = {'בדיקה': pts.length};
    drawSurvey(); refreshTags();
    return pts.length;
  });
  console.log('survey points:', survey);

  /* --- שלב 2: צירים דרך הגשר --- */
  await p.evaluate(()=>{ document.querySelector('.rail button[data-step="2"]').click(); });
  await p.waitForFunction(()=>window.ready && ready.alignment, {timeout:30000});
  const ax = await p.evaluate(async ()=>{
    const sec = ()=>({preset:'t', title:'חתך', ctx:'inter', median:3.0,
      left:[{type:'lane',w:3.5},{type:'lane',w:3.5},{type:'shoulder',w:2.5}],
      right:[{type:'lane',w:3.5},{type:'lane',w:3.5},{type:'shoulder',w:2.5}]});
    const state = {env:'inter', net:true,
      axes:[{name:'ציר ראשי', locked:true, drawing:false, V:80, Rmin:null, Rc:90, sec:sec(),
             pis:[{x:0,y:0,R:0},{x:250,y:30,R:400},{x:520,y:120,R:0}]}]};
    await call('alignment', 'push', {data:{state}});
    await new Promise(r=>setTimeout(r, 700));
    P.align = await call('alignment', 'pull');
    refreshTags();
    return {axes:P.align.axes.length, len: Math.round(P.align.axes[0].length),
            els: P.align.axes[0].elements.length};
  });
  console.log('alignment:', ax);

  /* --- שלב 3: ציר אנכי --- */
  await p.evaluate(()=>{ document.querySelector('.rail button[data-step="3"]').click(); });
  await p.waitForFunction(()=>window.ready && ready.vertical, {timeout:30000});
  const va = await p.evaluate(async ()=>{
    await call('vertical', 'push', {data:{
      axes: P.align.axes.map(a=>({name:a.name, pis:a.pis})),
      survey: P.survey.pts}});
    await new Promise(r=>setTimeout(r, 400));
    /* בניית קו הקרקע מהמדידה ואז קו אדום */
    const w = document.getElementById('fVert').contentWindow;
    w.document.getElementById('sampleStep').value = '20';
    w.document.getElementById('corridorW').value = '20';
    w.buildGroundFromSurvey();
    await new Promise(r=>setTimeout(r, 300));
    const g = w.LAST_GROUND;
    const pvi = [[0, g[0][1]], [260, g[Math.floor(g.length/2)][1] + 1.2], [g[g.length-1][0], g[g.length-1][1]]];
    w.document.getElementById('pvi').value = pvi.map(r=>r.join(',')).join('\n');
    w.run();
    await new Promise(r=>setTimeout(r, 200));
    P.vert = await call('vertical', 'pull');
    refreshTags();
    return {ground: P.vert.ground.length, pvi: P.vert.data ? P.vert.data.pvi.length : 0,
            curves: P.vert.data ? P.vert.data.curves.length : 0};
  });
  console.log('vertical:', va);

  /* --- שלב 4: בנייה, בלי שירות ההמרה --- */
  await p.evaluate(()=>{ document.querySelector('.rail button[data-step="4"]').click(); });
  const out = await p.evaluate(async ()=>{
    document.getElementById('oSvc').value = '';
    document.getElementById('oStep').value = '20';
    document.getElementById('oTemp').value = 'yes';
    ['oPlanD','oStep','oXD','oVD','oVE','oTemp'].forEach(i=>document.getElementById(i).onchange());
    document.getElementById('pname').value = 'בדיקה מקצה לקצה';
    document.getElementById('pname').onchange();
    let blob = null;
    const real = URL.createObjectURL;
    URL.createObjectURL = x => { if(x instanceof Blob && !blob) blob = x; return real.call(URL, x); };
    await buildOutput();
    URL.createObjectURL = real;
    const txt = blob ? await blob.text() : '';
    return {log: document.getElementById('bLog').textContent, bytes: txt.length, dxf: txt.slice(0, 20), full: txt};
  });
  console.log('--- build log ---\n' + out.log);
  if(out.full){
    fs.writeFileSync('e2e.dxf', out.full);
    console.log('saved e2e.dxf', (out.bytes/1024).toFixed(0) + ' KB');
  }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  await b.close();
})();
