/* MahAlCad – סינון קפיצות בקו הקרקע הקיימת (חתך לאורך)
 * כלל אחוזי פשוט: תחנה שהרום שלה סוטה מהחציון של שכנותיה (±3 תחנות)
 * ביותר מ-X% ממרווח התחנות – נחשבת קפיצה ונמחקת. הקרקע מאונטרפלצת ביניהן.
 * רץ באיטרציות כדי "לקלף" גם קפיצות רחבות (כמה תחנות ברצף).
 * שיפוע רציף אמיתי של הקרקע לא נפגע – החציון של שכנות על מדרון אחיד שווה לרום התחנה.
 * הסף נלקח מהשדה vSpikePct (ברירת מחדל 30%, 0 = כבוי).
 */
(function () {
  function median(a) {
    const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  // pts: מערך [תחנה, רום] ממוין לפי תחנה. משנה את המערך במקום ומחזיר כמה תחנות נמחקו.
  window.mhGroundSpikeFilter = function (pts) {
    const el = document.getElementById('vSpikePct');
    const pct = el ? Number(el.value) : 30;
    if (!(pct > 0) || !pts || pts.length < 5) return 0;
    const K = 3, removedAll = [];
    for (let pass = 0; pass < 60 && pts.length >= 5; pass++) {
      const gaps = [];
      for (let i = 1; i < pts.length; i++) gaps.push(pts[i][0] - pts[i - 1][0]);
      const ds = Math.max(median(gaps), 0.01);
      const bad = [];
      for (let i = 0; i < pts.length; i++) {
        const nb = [];
        for (let j = Math.max(0, i - K); j <= Math.min(pts.length - 1, i + K); j++) if (j !== i) nb.push(pts[j][1]);
        const dev = Math.abs(pts[i][1] - median(nb));
        if (dev / ds * 100 > pct) bad.push({ i, dev });
      }
      if (!bad.length) break;
      // מוחקים בכל סבב רק את הסוטות ביותר (מעל חצי מהסטייה המרבית) – קילוף הדרגתי ובטוח
      const maxDev = Math.max(...bad.map(b => b.dev));
      const kill = new Set(bad.filter(b => b.dev >= maxDev / 2).map(b => b.i));
      for (let i = pts.length - 1; i >= 0; i--) if (kill.has(i)) removedAll.push(pts.splice(i, 1)[0]);
    }
    window.mhGroundSpikeRemoved = removedAll.sort((a, b) => a[0] - b[0]);
    return removedAll.length;
  };
})();
