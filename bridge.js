/* ======================================================================
   גשר פרויקט – מחבר את הכלי אל דף הניהול (project-hub) כשהוא רץ בתוך מסגרת.
   ----------------------------------------------------------------------
   הכלי נשאר עצמאי לחלוטין: אם אין דף אב, הקוד הזה לא עושה דבר.
   פרוטוקול: postMessage עם {ns:'mahalco'}.
     אב → כלי :  {t:'<פקודה>', rid, ...}    לפי הפקודות שהכלי מצהיר עליהן
     כלי → אב :  {t:'ready'|'reply'|'changed'}
   ====================================================================== */
(function(){
  if(window.top === window.self) return;              /* עצמאי – אין גשר */
  const NS = 'mahalco';
  const H = window.__BRIDGE__ || {};
  window.__BRIDGE__ = H;
  const send = (t, extra)=>{
    try{ parent.postMessage(Object.assign({ns:NS, t:t, tool:H.id}, extra||{}), '*'); }catch(e){}
  };
  window.addEventListener('message', function(ev){
    const m = ev.data;
    if(!m || m.ns !== NS || !m.t) return;
    const fn = H[m.t];
    if(typeof fn !== 'function') return;
    Promise.resolve().then(()=>fn(m)).then(
      r => send('reply', {rid:m.rid, ok:true, data:r}),
      e => send('reply', {rid:m.rid, ok:false, err:String((e&&e.message)||e)}));
  });
  /* הכלי קורא לזה אחרי כל שינוי שראוי שהאב יידע עליו */
  H.notify = function(){ send('changed'); };
  send('ready', {caps:Object.keys(H).filter(k=>typeof H[k]==='function')});
})();
