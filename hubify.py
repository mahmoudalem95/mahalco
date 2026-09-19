# -*- coding: utf-8 -*-
"""מזריק את גשר הפרויקט (bridge.js + מטפלים ייעודיים לכלי) לפני </body>."""
import io, os

HERE = os.path.dirname(os.path.abspath(__file__))


def bridge_core():
    return io.open(os.path.join(HERE, 'bridge.js'), encoding='utf-8').read()


def inject(src, handlers_js):
    block = '\n<script>\n' + handlers_js.rstrip() + '\n</script>\n<script>\n' + bridge_core().rstrip() + '\n</script>\n'
    i = src.rfind('</body>')
    if i < 0:
        i = src.rfind('</html>')
    assert i > 0, 'no </body>'
    return src[:i] + block + src[i:]


HANDLERS = {}

HANDLERS['typical'] = r'''
/* ---- גשר: חתך טיפוסי ---- */
window.__BRIDGE__ = {
  id: 'typical',
  /* מצב הכלי – התבנית שהמשתמש בנה */
  pull: function(){
    return {secs: (typeof SHEET!=='undefined' && SHEET.length) ? SHEET : [curSec()],
            D: +document.getElementById('scale').value,
            opt: opts(),
            meta: {proj: document.getElementById('proj').value,
                   dwg: document.getElementById('dwg').value,
                   drawn: document.getElementById('drawn').value}};
  },
  push: function(m){
    var d = (m && m.data) || {}, $ = function(i){ return document.getElementById(i); };
    if(d.meta){ if(d.meta.proj) $('proj').value = d.meta.proj;
                if(d.meta.dwg) $('dwg').value = d.meta.dwg;
                if(d.meta.drawn) $('drawn').value = d.meta.drawn; }
    if(d.D) { $('scale').value = String(d.D); }
    if(d.sec){ applySec(d.sec); }
    update(true);
    return true;
  },
  /* גוף החתך בלבד (מ״מ על הנייר) – לשימוש דף הניהול בבניית גיליונות */
  render: function(m){
    var D = (m && m.D) || 100, opt = (m && m.opt) || opts();
    var secs = (m && m.secs) || [curSec()];
    return secs.map(function(s){ var b = sectionSVG(s, D, opt); return {g:b.g, w:b.w, h:b.h, title:s.title}; });
  },
  /* גיליון A0 שלם של הכלי עצמו */
  sheet: function(m){
    m = m || {};
    return sheetSVGOf(m.secs || [curSec()], m.D || 100, m.opt || opts(), m.meta || {});
  }
};
function applySec(sec){
  if(!sec) return;
  var $ = function(i){ return document.getElementById(i); };
  if(sec.title!=null) $('title').value = sec.title;
  if(sec.ctx) $('ctx').value = sec.ctx;
  if(sec.cells) S.cells = sec.cells.map(function(c){ return Object.assign({}, c); });
  if(sec.eL) S.eL = Object.assign({}, sec.eL);
  if(sec.eR) S.eR = Object.assign({}, sec.eR);
  ['curbH','dSurf','dBase','dSub','cfRoad','cfSide','rowTarget'].forEach(function(k){
    if(sec[k]!=null && $(k)) $(k).value = sec[k];
  });
  if(sec.pave!=null && $('tPave')) $('tPave').checked = !!sec.pave;
}
'''

HANDLERS['temporary'] = r'''
/* ---- גשר: חתך זמני ---- */
window.__BRIDGE__ = {
  id: 'temporary',
  pull: function(){ return {ST: JSON.parse(JSON.stringify(ST))}; },
  push: function(m){
    var d = (m && m.data && m.data.ST) || null;
    if(!d) return false;
    if(d.P) Object.assign(ST.P, d.P);
    if(d.preset) ST.preset = d.preset;
    if(d.caseId) ST.caseId = d.caseId;
    if(d.stage) ST.stage = d.stage;
    if(d.cells !== undefined) ST.cells = d.cells;
    if(d.close !== undefined) ST.close = d.close;
    render();
    return true;
  },
  /* גושי החתכים (קיים + זמני) במ״מ על הנייר */
  render: function(m){
    var D = (m && m.D) || 200;
    var t = window.tempSecs();
    var blocks = sheetBlocks(t.secs, D).map(function(b){
      return {g: '<g transform="scale(' + b.s + ')">' + b.body + '</g>', w:b.w, h:b.h, title:b.title};
    });
    return {blocks: blocks, meta: t.meta, caseId: ST.caseId};
  },
  sheet: function(m){
    m = m || {};
    var t = window.tempSecs();
    return sheetSVGOf(m.secs || t.secs, m.D || 200, m.meta || t.meta);
  }
};
'''

HANDLERS['alignment'] = r'''
/* ---- גשר: בונה הצירים ---- */
window.__BRIDGE__ = {
  id: 'alignment',
  pull: function(){
    return {state: projectState(),
            axes: S.axes.map(function(a,k){ return withAxis(k, function(){
              var r = solve();
              return {name:a.name, pis:a.pis, length:r.total, valid:!r.errs.length,
                      elements:r.els, sec:a.sec ? JSON.parse(JSON.stringify(a.sec, function(key,v){ return String(key).charAt(0)==='_'?undefined:v; })) : null};
            }); }),
            junctions: S.junctions.map(function(J){
              return {type:J.type, point:J.p, major:S.axes[J.major].name, minor:S.axes[J.minor].name,
                      station_major:J.sMaj, station_minor:J.sMin};
            })};
  },
  push: function(m){
    var d = (m && m.data) || {};
    if(d.state) openProject(d.state);
    if(d.bg && d.bg.src){
      var im = new Image();
      im.onload = function(){
        S.bg = {img:im, op:(d.bg.op==null?0.85:d.bg.op), show:true,
                A:d.bg.A, B:d.bg.B, C:d.bg.C, D:d.bg.D, E:d.bg.E, F:d.bg.F, geo:!!d.bg.geo};
        try{ renderMapBox(); }catch(e){}
        try{ fit(); }catch(e){}
        draw();
      };
      im.src = d.bg.src;
    }
    return true;
  },
  /* התכנית כפעולות CAD בקואורדינטות עולם (מטרים) */
  plan: function(m){
    if(!S.axes.some(function(a){ return a.pis && a.pis.length; })) return {ops:[]};
    var R = recordDrawing();
    var ops = opsToCAD(R.ops, R.inv, (m && m.D) || 500);
    draw();
    return {ops: ops};
  }
};
'''

HANDLERS['vertical'] = r'''
/* ---- גשר: תכנון הציר האנכי ---- */
window.__BRIDGE__ = {
  id: 'vertical',
  pull: function(){
    return {ground: LAST_GROUND, pvi: parsePairs($('pvi').value), data: LAST_DATA,
            vd: Number($('vd').value), crit: $('crit').value, veh: Number($('veh').value),
            ve: Number($('veRatio').value)||10,
            axis: AXIS ? {name:AXIS.name, total:AXIS.total} : null};
  },
  push: function(m){
    var d = (m && m.data) || {};
    if(d.axes && d.axes.length){
      AXES_LIST = d.axes.filter(function(a){ return a.pis && a.pis.length>=2; });
      var sel = $('axisPick');
      sel.innerHTML = AXES_LIST.map(function(a,i){ return '<option value="'+i+'">'+(a.name||('ציר '+(i+1)))+'</option>'; }).join('');
      sel.hidden = AXES_LIST.length < 2;
      if(AXES_LIST.length) sel.onchange();
    }
    if(d.survey && d.survey.length){
      $('surveyTxt').value = d.survey.map(function(p){ return [p.x,p.y,p.z].join(','); }).join('\n');
      $('colOrder').value = 'xyz';
      loadSurveyCloud();
    }
    if(d.ground) $('ground').value = d.ground.map(function(r){ return r.join(','); }).join('\n');
    if(d.pvi) $('pvi').value = d.pvi.map(function(r){ return r.join(','); }).join('\n');
    if(d.ground || d.pvi) run();
    return true;
  },
  /* גובה מתוכנן בסטציה – לשימוש דף הניהול בחתכי הרוחב */
  elev: function(m){
    if(!LAST_DATA) return null;
    return elevOnDesign(Number(m.sta), LAST_DATA);
  }
};
'''
