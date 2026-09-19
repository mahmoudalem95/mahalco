# dxf2dwg – שירות המרה ל-DWG

הכלי בדפדפן בונה DXF R2000 (מטרים, 1:1, שכבות ‎TS-*‎). DWG הוא פורמט בינארי סגור
ואין ספרייה שכותבת אותו בתוך הדפדפן, ולכן ההמרה נעשית בשירות הקטן הזה.

## פריסה ב-Render
1. Repo חדש עם שלושת הקבצים: `app.py`, `Dockerfile`, `README.md`.
2. Render → New → Web Service → Docker (הבנייה של LibreDWG לוקחת כ-5 דקות).
3. משתנה סביבה: `ALLOW_ORIGINS=https://mahmoudalem95.github.io` (או הדומיין של האתר).
4. בדיקה: `GET /` מחזיר `{"ok":true}`.

## חיבור לכלי
בלוח «ייצוא ל-CAD (DWG)» שבעמוד, בשדה «שירות המרה ל-DWG», הדביקו:

```
https://<the-service>.onrender.com/dxf2dwg
```

הכתובת נשמרת ב-localStorage של הדפדפן. מאותו רגע «הורדת קובץ DWG» מוריד DWG אמיתי;
אם השירות לא זמין – יורד DXF עם הודעה מתאימה.

## בדיקה מהירה משורת הפקודה
```bash
curl -X POST --data-binary @section.dxf \
     -H "Content-Type: application/dxf" \
     https://<the-service>.onrender.com/dxf2dwg -o section.dwg
```

הערות
- LibreDWG כותב DWG עד גרסת R2000 (AutoCAD 2000), שנפתחת בכל גרסה מודרנית של AutoCAD/BricsCAD/ZWCAD.
- LibreDWG מופץ ברישיון GPL-3; כאן הוא רץ כתוכנית נפרדת בשרת, ללא קישור לקוד של האתר.
