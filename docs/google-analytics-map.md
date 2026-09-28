# חיבור מפת הערים ל־Google Analytics

המפה ב־admin.html קוראת נתוני GA4 ישירות מ־Google Analytics Data API באמצעות חשבון Google בעל הרשאת Viewer לפחות לנכס. לא נדרש שרת נוסף. זהו דוח לתקופה, לא דוח Realtime.

## הגדרה חד־פעמית

1. ב־Google Analytics, פתחו Admin → Property details והעתיקו את **Property ID המספרי**. מזהה מדידה כגון G-HGFLQEM5HT אינו Property ID.
2. ב־Google Cloud, בחרו פרויקט והפעילו **Google Analytics Data API**.
3. הגדירו את מסך OAuth consent עבור האפליקציה. הוסיפו את ההרשאה `https://www.googleapis.com/auth/analytics.readonly`. אם האפליקציה במצב Testing, הוסיפו את חשבון המנהל לרשימת Test users.
4. צרו OAuth Client ID מסוג **Web application**. תחת Authorized JavaScript origins הוסיפו `https://mahmoudalem95.github.io` (ללא הנתיב /mahalco). לפיתוח אפשר להוסיף את מקור ה־localhost המדויק.
5. בדף המנהל פתחו **הגדרת החיבור**, הזינו Property ID ו־Client ID ולחצו על **חיבור ל־Google Analytics**. בטעינה הראשונה של ספריית Google יש ללחוץ שוב לאחר שמופיעה הודעת מוכנות.

אין להזין Client Secret, סיסמה או קובץ service-account בדף. שני המזהים נשמרים מקומית בדפדפן; אסימון הגישה נשמר רק בזיכרון ונמחק ברענון, ניתוק או פקיעת הרשאה. ניתוק Google מבטל את ההרשאה שניתנה לאפליקציה. הנתונים לא נשמרים בקוד האתר או ב־localStorage.

## התנהגות הדוח

- טווח הימים והרענון בראש דף המנהל שולפים מחדש את הנתונים.
- היום נכלל בטווח לפי אזור הזמן של נכס GA4. לדוגמה: שבעה ימים הם `6daysAgo` עד `today`.
- דוח עיר משתמש ב־countryId, region, city ובמדדים activeUsers, newUsers, engagedSessions, engagementRate, userEngagementDuration, eventCount.
- הסך הכולל נשלף בדוח נפרד ללא ממדי עיר, משום שמשתמש יכול להופיע במספר ערים.
- זמן מעורבות ממוצע מחושב כ־userEngagementDuration / activeUsers.
- רשומות מחוץ לישראל או שמיקומן אינו מזוהה מופיעות ברשימה ולא מקבלות נקודה שרירותית במפה.
- המפה כוללת מרכזי יישובים ושמות חלופיים מ־GeoNames. שמות עמומים שאינם במיפוי הידני מושמטים ממיפוי, אך נשארים ברשימה.
- ספי פרטיות, דגימה ואיחוד לשורת other מדווחים כשה־API מספק מידע כזה. הדוח עשוי להיות שונה מנתוני הדפדפן של מונה הביקורים העצמאי.
- אין רענון אוטומטי ברקע. אם ההרשאה פגה, יש להתחבר שוב.

## מקורות

- [Google token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [GA4 runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport)
- [API schema](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- גבולות: [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- מרכזי יישובים: [GeoNames Israel](https://download.geonames.org/export/dump/IL.zip), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). הוקרנו למרקטור ועובדו לשמות חלופיים; אינם מיקומי משתמשים.

מפת Analytics זמינה בנפרד מהכניסה למונה הביקורים. הגישה לדוחות נשלטת על ידי Google; מפתח מונה הביקורים אינו נשלח ל־Google. מזהה הנכס 553070001 הוגדר מראש לפי נכס האתר בחשבון.
