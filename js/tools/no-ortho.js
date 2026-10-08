/* MahAlCad / project hub: orthophoto (aerial image) removed from the tool in all languages.
   - background import accepts only DWG/DXF (images and world files are refused)
   - sheets never receive an orthophoto (MH_ORTHO -> null)
   - SD junction map runs on the street map only, and the PDF never carries a photo background */
(function () {
  'use strict';
  var IMG = /\.(png|jpe?g|gif|bmp|webp|tiff?|pgw|jgw|tfw|wld|j2w|bpw|gfw)$/i;
  var lang = (document.documentElement.lang || 'he').slice(0, 2);
  var MSG = {
    he: 'אורתופוטו/צילום אוויר הוסר מהכלי – ניתן לייבא רקע DWG/DXF בלבד',
    ar: 'تمت إزالة الصورة الجوية (أورثوفوتو) من الأداة',
    en: 'Orthophoto / aerial images were removed from this tool — only DWG/DXF backgrounds can be imported'
  }[lang] || 'Orthophoto removed';

  function say(t) {
    try { if (typeof window.toast === 'function') { window.toast(t); return; } } catch (e) {}
    var el = document.getElementById('toast');
    if (el) { el.textContent = t; el.classList.add('on', 'show'); setTimeout(function () { el.classList.remove('on', 'show'); }, 3500); }
  }

  // Refuse image / world files before the tool's own handler sees them.
  window.addEventListener('change', function (ev) {
    var t = ev.target;
    if (!t || t.id !== 'fMap' || !t.files) return;
    for (var i = 0; i < t.files.length; i++) {
      var f = t.files[i];
      if (IMG.test(f.name) || /^image\//.test(f.type || '')) {
        ev.stopImmediatePropagation(); ev.preventDefault();
        t.value = ''; say(MSG); return;
      }
    }
  }, true);

  // Same for images dropped on the page.
  window.addEventListener('drop', function (ev) {
    var fl = ev.dataTransfer && ev.dataTransfer.files;
    if (!fl) return;
    for (var i = 0; i < fl.length; i++) {
      if (IMG.test(fl[i].name) || /^image\//.test(fl[i].type || '')) {
        ev.stopImmediatePropagation(); ev.preventDefault(); say(MSG); return;
      }
    }
  }, true);

  function lockOrtho() {
    try {
      Object.defineProperty(window, 'MH_ORTHO', { configurable: true, get: function () { return function () { return null; }; }, set: function () {} });
    } catch (e) { window.MH_ORTHO = function () { return null; }; }
  }
  lockOrtho();

  function sdStreetMap() {
    var fm = document.getElementById('fMap');
    if (fm && fm.accept !== '.none') fm.accept = '.dwg,.dxf';
    var ph = document.getElementById('oPhoto');
    if (ph) { ph.checked = false; ph.disabled = true; var row = ph.closest('.row'); if (row) row.hidden = true; }
    var ms = document.getElementById('mStyle');
    if (ms) {
      // the button shows the style it switches TO; "מפה"/"map" means the aerial photo is on now
      if (ms.onclick && /מפה|map/i.test(ms.textContent) && !/צילום|🛰/.test(ms.textContent)) { try { ms.click(); } catch (e) {} }
      ms.hidden = true; ms.style.display = 'none';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(sdStreetMap, 0); });
  else setTimeout(sdStreetMap, 0);
  window.addEventListener('load', function () { lockOrtho(); sdStreetMap(); setInterval(sdStreetMap, 1000); });
})();
