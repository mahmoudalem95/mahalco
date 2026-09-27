/* סיור „איך משתמשים?” – כפתור בכל כלי שמסמן את השדות אחד אחד עם הסבר קצר.
   השלבים לכל דף ב-TOURS (לפי שם הקובץ). sel = סלקטור CSS (אפשר כמה, מופרדים בפסיק). */
(function () {
  'use strict';
  var TOURS = {
    'aadt.html': [
      ['#fName, #fDate', 'פרטי הספירה', 'שם הצומת ותאריך הספירה (לדוח).'],
      ['#btnPick, #btnExample', 'טעינת נתונים', 'בחרו קובץ ספירה – או „טען דוגמה” כדי לראות איך זה עובד.'],
      ['#fK, #fEF, #fDHVm, #fDHVe, #fV14', 'מקדמים ונפחים', 'מקדם K, מקדם המרה 14→24 שעות, ונפחי שעת שיא בוקר/ערב.'],
      ['#armN_DHV', 'נפחים לפי זרוע', 'צפון/דרום/מזרח/מערב: DHV, AADT, % כבד ו-% אוטובוסים.'],
      ['#btnCalc', 'חשבו', 'לחצו „חשב AADT ומקדמים”.'],
      ['#results', 'התוצאה', 'AADT, מקדמי K/D/T, פרופיל שעתי ופילוג לדרכים. אפשר להדפיס PDF או לייצא CSV.']
    ],
    'bike-design.html': [
      ['.tabs', 'בחרו נושא', 'רחוב עירוני, צומת או בין-עירוני – כל לשונית בודקת שאלה אחרת.'],
      ['#u_sp, #u_mode, #u_vol', 'מהירות ונפח', 'מהירות הייעוד ונפח התנועה ברחוב.'],
      ['#u_calm, #u_park, #u_parkw', 'מאפייני הרחוב', 'מיתון תנועה וחניה מקבילה לצד הנתיב.'],
      ['#u_w', 'הרוחב המתוכנן', 'רוחב רצועת האופניים שמתוכננת – הכלי בודק מול ההנחיות.'],
      ['#urbOut', 'התוצאה', 'סוג ההסדר המומלץ ובדיקת הרוחב – מתעדכן מיד.']
    ],
    'calculator-dark-ui.html': [
      ['#env', 'תחום', 'רחובות עירוניים, דרכים בין-עירוניות, רמפות, חניונים או הסדרים זמניים.'],
      ['#seg', 'נושא', 'בחרו מה לבדוק (רוחב נתיב, רדיוס, מרחק ראות…). אם לנושא יש פרמטרים (מהירות וכו׳) – הם מופיעים ליד.'],
      ['#results', 'התוצאה', 'כרטיסים עם הערכים מהספרים. לחצו על 📖 כדי לראות את העמוד בספר.'],
      ['[data-tab=search]', 'חיפוש בספרים', 'חיפוש חופשי בטקסט של ספרי ההנחיות.']
    ],
    'critical-lane-volume.html': [
      ['#btnPick, #btnExample', 'טעינת ספירה', 'בחרו קובץ ספירה, הדביקו טבלה – או „טען דוגמה”.'],
      ['#cross', 'נפחים ונתיבים לכל זרוע', 'לכל כיוון: שמאלה / ישר / ימינה – נפח ומספר נתיבים.'],
      ['#threshold', 'סף נפח לנתיב', 'רכב/שעה/נתיב לבדיקת הצומת.'],
      ['#fcMethod, #fcSat, #fcLost, #fcCycle', 'פאזות ותזמון', 'שיטת פאזות, זרימת רוויה, זמן אבוד ואורך מחזור (ריק = Webster).'],
      ['#results', 'התוצאה', 'נפח נתיב קריטי, מצב הצומת ותחזית. אפשר להדפיס PDF.']
    ],
    'crossing-high-demand.html': [
      ['#n1, #n2', 'נפחי הולכי רגל', 'הולכי רגל לשעה בכל כיוון.'],
      ['#cyc, #g', 'רמזור', 'אורך המחזור והירוק המתוכנן להולכי רגל.'],
      ['#L, #We, #sp', 'המעבר', 'אורך, רוחב אפקטיבי ומהירות הליכה.'],
      ['#stage, #mw, #ma', 'חצייה בשלבים', 'אם יש מפרדה – רוחבה ושטח ההמתנה.'],
      ['#out', 'התוצאה', 'בדיקות ההנחיות ומה צריך לשנות – מתעדכן מיד.']
    ],
    'horizontal.html': [
      ['.tabs', 'בחרו נושא', 'רדיוס והגבה, מעבר שיפועים, הרחבה, עקום מעבר, מרחק ראות ועוד.'],
      ['#t1_vd', 'מהירות תכן', 'מהירות התכן Vd בקמ״ש.'],
      ['#t1_emax_mode, #t1_emax, #t1_f', 'הגבה וחיכוך', 'emax לפי סוג הדרך, או ידני.'],
      ['#t1_rc, #t1_slope', 'העקום המתוכנן', 'רדיוס Rc ושיפוע אורכי לבדיקה.'],
      ['#t1_results', 'התוצאה', 'רדיוס מינימלי, הגבה נדרשת ובדיקה מול התכנון – מתעדכן מיד.']
    ],
    'htool.html': [
      ['#control, #side', 'סוג הבקרה', 'רמזור / זכות קדימה, וצד הנהיגה.'],
      ['#counts', 'ספירות', 'נפחים לכל תנועה בכל זרוע.'],
      ['#lanes', 'נתיבים', 'מספר הנתיבים לכל תנועה.'],
      ['#phf, #hv, #cycle', 'פרמטרים', 'PHF, % רכב כבד ואורך מחזור (ריק = אופטימלי).'],
      ['#year, #rates, #years', 'תחזית', 'שנת בסיס, שיעורי צמיחה ושנות תחזית.'],
      ['#go', 'נתחו', 'לחצו „נתח צומת” – התוצאה מופיעה למטה.']
    ],
    'interchange-ramp-terminal-analysis.html': [
      ['#tA, #tB, #tC', 'סוג ההשתזרות', 'רמפה, עיקרית או דו-צדדית.'],
      ['#L, #N, #SFF, #roadtype', 'הקטע', 'אורך, נתיבים, מהירות זרימה חופשית וסוג הדרך.'],
      ['#Vw1, #Vw2, #Vo1, #Vo2', 'נפחים', 'משתזרים ולא-משתזרים (רכב/שעה).'],
      ['#PHF, #PT, #fp, #ET', 'מקדמים', 'PHF, % רכב כבד, אוכלוסיית נהגים וטופוגרפיה.'],
      ['#calcBtn', 'חשבו', 'לחצו „חשב רמת-שירות”.'],
      ['#resultsArea', 'התוצאה', 'צפיפות, מהירות ורמת שירות.']
    ],
    'intercity-bus-lane-justification.html': [
      ['#btn_pax, #btn_bus', 'בסיס הבדיקה', 'נוסעים ממשיכים או נפח אוטובוסים.'],
      ['#metric', 'הנפח', 'נפח הנוסעים / האוטובוסים בשעת שיא.'],
      ['#v_ff, #v_cur', 'מהירויות', 'מהירות בנפח אפס ומהירות מסחרית ממוצעת בשיא.'],
      ['#cv_on, #prox_on', 'מדדים נוספים', 'אמינות (CV) וקרבה לנתיב העירוני – לפי הצורך.'],
      ['#q0', 'שאלות איכותיות', 'סמנו את מה שמתאים לציר.'],
      ['#results', 'התוצאה', 'האם יש הצדקה לנת״צ, והגרף – מתעדכן מיד.']
    ],
    'lane-queue-analysis.html': [
      ['#cross', 'הצומת', 'נפחים ונתיבים לכל זרוע ותנועה.'],
      ['#btnExample', 'חשבו', 'לחצו „חשב” (או טענו דוגמה).'],
      ['#results', 'התוצאה', 'תורים ונפח נתיב קריטי לכל זרוע.'],
      ['#btnJson', 'ייצוא', 'אפשר לראות ולהעתיק את החישוב כ-JSON.']
    ],
    'lane-queue-metric.html': [
      ['#mAASHTO, #mHCM', 'שיטה', 'AASHTO או HCM.'],
      ['#facilityType, #volume, #lanes', 'המתקן והנפח', 'סוג המתקן, נפח לשעה ומספר נתיבים.'],
      ['#cycleLength, #greenTime', 'רמזור', 'אורך מחזור וזמן ירוק.'],
      ['#truckPct, #surgeFactor, #laneWidth, #shoulderWidth, #grade', 'מאפיינים', '% משאיות, מקדם עומס, רוחבים ושיפוע.'],
      ['#submitBtn', 'נתחו', 'לחצו „נתח תור”.'],
      ['#resultsPlaceholder', 'התוצאה', 'אורך התור ורמת השירות.']
    ],
    'los-nat.html': [
      ['.tabs', 'בחרו סוג דרך', 'דו-נתיבית, רב-נתיבית, דרך מהירה או הרחבה.'],
      ['#t1_roadtype, #t1_terrain, #t1_vd', 'הדרך', 'סוג, טופוגרפיה ומהירות תכן.'],
      ['#t1_phf, #t1_pt', 'מקדמים', 'PHF ו-% רכב כבד.'],
      ['#t1_v, #t1_dir', 'נפח', 'נפח בשעת שיא והתפלגות כיוונית.'],
      ['#t1_results', 'התוצאה', 'קיבולת ורמת שירות – מתעדכן מיד.']
    ],
    'optimizes-signal-timing-plans-metric.html': [
      ['#projId, #periodLabel, #phf', 'הפרויקט', 'מזהה, תקופת ניתוח ו-PHF.'],
      ['#objective', 'יעד האופטימיזציה', 'מה ממזערים / ממקסמים.'],
      ['#minCycle, #maxCycle, #minGreen, #maxGreenSplit, #maxVc', 'אילוצים', 'טווח מחזור, ירוק מזערי, v/c מרבי.'],
      ['#corridorSpeed, #distBetween, #desiredBW', 'תיאום בציר', 'מהירות, מרחק בין צמתים ורוחב גל רצוי.'],
      ['#submitBtn', 'בצעו', 'לחצו „בצע אופטימיזציה”.'],
      ['#phaseTable', 'התוצאה', 'תזמון המופעים והיסטים.']
    ],
    'parking-regulations.html': [
      ['#projectName, #cityInput', 'שם הפרויקט והעיר', 'העיר קובעת אוטומטית את סוג היישוב ומצב המתע״ן.'],
      ['#distance', 'מרחק אווירי מתחנת המתע״ן', 'קובע את אזור החניה (א׳ / ב׳ / ג׳).'],
      ['#pos', 'מדיניות הוועדה המקומית (עירייה / מועצה)', 'מיקום בתוך הטווח שבתקנות: 0% = מינימום חניות, 100% = מקסימום. התוצאה מתעדכנת מיד.'],
      ['#guestPct, #bikeExtra', 'חניית אורחים ותוספת אופניים', 'חניית אורחים 10%–30% מיח״ד (חלק מסך המקומות, לא תוספת).'],
      ['#usePicker, #addLandUseBtn', 'השימושים בפרויקט', 'מלאו לכל שימוש יח״ד / שטח עיקרי / מקומות ישיבה. להוספת שימוש – בחרו מהרשימה ולחצו „הוסף”.'],
      ['#calcBtn', 'חשבו', 'לחצו „חשב דרישות חניה”. כל שינוי בשדות מעדכן גם אוטומטית.'],
      ['#resultsArea', 'התוצאה', 'חניה לרכב פרטי, תפעולית, אוטובוסים, אופניים ואופנועים – ומתחת פירוט לפי שימוש עם הסעיף בתקנות.']
    ],
    'policy-sec.html': [
      ['.tabs', 'בחרו נושא', 'סיווג ומהירויות, רוחב נתיבים, מפרדה, חתכי ביניים, מפרץ חירום.'],
      ['#t1_roadtype, #t1_terrain', 'הדרך', 'סיווג תפקודי וטופוגרפיה.'],
      ['#t1_sensitivity, #t1_target', 'רגישות ומהירות', 'רגישות סביבתית ומהירות יעוד רצויה.'],
      ['#t1_results', 'התוצאה', 'מהירות התכן והערכים לפי הפרק – מתעדכן מיד.']
    ],
    'project-hub.html': [
      ['#tpDraw', 'ציור ציר', 'לחצו ✎ ואז הקליקו על המפה נקודה אחרי נקודה. לחיצה כפולה מסיימת.'],
      ['#inV, #inRmin', 'מהירות ורדיוס', 'מהירות התכן ורדיוס מינימלי לציר.'],
      ['#mhFlowNext', 'השלבים', 'הבא ← : ציר → חתך → צמתים. בשלב הצמתים מחושבים אזורי ההשפעה והמעגלים.'],
      ['#bProf', 'חתך לאורך', 'פרופיל אנכי עם PVI ועקומות.'],
      ['#bDxf', 'ייצוא', 'הורדה ל-DWG.']
    ],
    'queue-storage-length.html': [
      ['#ctlMode', 'סוג הבקרה', 'מרומזר או לא – ובסיס חישוב האחסנה.'],
      ['#btnFile, #btnExample', 'נתונים', 'קובץ ספירה, הדבקה או דוגמה.'],
      ['#sgMethod, #sgSat, #sgLost, #sgCycle', 'תזמון', 'שיטת פאזות, רוויה, זמן אבוד ומחזור.'],
      ['#results', 'התוצאה', 'אורך התור הנדרש לכל נתיב.'],
      ['#svTarget, #svAvail, #btnSolve', 'אחסנה זמינה', 'בדקו אם האורך הזמין מספיק – „פתור”.']
    ],
    'roundabout-analysis-metric.html': [
      ['#rbtId, #periodLabel, #phf', 'המעגל', 'מזהה, תקופה ו-PHF.'],
      ['#inscribedD, #islandD, #entryWidth, #circWidth', 'גאומטריה', 'קוטר חיצוני, אי מרכזי, רוחב כניסה ומסלול.'],
      ['#north_entry', 'נפחים לכל זרוע', 'כניסות, נתיבים ופניות בכל כיוון.'],
      ['#submitBtn', 'חשבו', 'לחצו „חשב ניתוח מעגל תנועה”.'],
      ['#approachTable', 'התוצאה', 'קיבולת, עיכוב ורמת שירות לכל זרוע.']
    ],
    'sd-tool.html': [
      ['#q, #qGo', 'חפשו מקום', 'הקלידו כתובת או צומת.'],
      ['#bDemo', 'דוגמה', 'טענו דוגמה לראות איך זה עובד.'],
      ['#zIn, #zOut, #zFit', 'תצוגה', 'זום והתאמה למסך.'],
      ['#bSave, #bLoad', 'שמירה', 'שמירה ופתיחה של משולשי הראות.']
    ],
    'sd.html': [
      ['.tabs', 'בחרו נושא', 'עצירה, החלטה, עקיפה, יישום לפי סוג דרך.'],
      ['#t1_vd, #t1_veh', 'מהירות ורכב', 'מהירות התכן וסוג הרכב.'],
      ['#t1_mode, #t1_check', 'מצב החישוב', 'חישוב או בדיקה של מרחק ראות מתוכנן.'],
      ['#t1_results', 'התוצאה', 'מרחק הראות הנדרש ובדיקה – מתעדכן מיד.']
    ],
    'temporary-section.html': [
      ['#projectName, #preset', 'פרויקט ותבנית', 'שם הפרויקט ובחירת חתך התחלתי.'],
      ['#componentType, #componentWidth, #componentDir, #svgTemp', 'עריכת רכיב', 'לחצו על רכיב בשרטוט ושנו סוג, רוחב וכיוון.'],
      ['#addComponent', 'הוספה', 'הוספת רכיב חדש לחתך.'],
      ['#tc, #st, #devSel, #wz', 'אתר העבודה', 'הרכב התנועה, סוג הרחוב, התקן הפרדה ורוחב אזור העבודה.'],
      ['#svgTemp', 'החתך', 'השרטוט והבדיקות מתעדכנים מיד.'],
      ['#dxfBtn, #exportSVG, #printTool', 'ייצוא', 'CAD, SVG או PDF.']
    ],
    'traffic-impact.html': [
      ['#projectName, #landUseType, #grossArea', 'הפרויקט', 'שם, סוג שימוש ושטח ברוטו.'],
      ['#analysisYear, #existingYear, #growthRate', 'שנים', 'שנת ניתוח, שנה נוכחית וגידול שנתי.'],
      ['#passByPct, #divertedPct, #truckPct', 'נסיעות', 'עוברות, מוסטות ו-% משאיות.'],
      ['#mainAadt, #sideAadt, #mainPeak, #sidePeak', 'תנועה קיימת', 'AADT ושעת שיא ברחוב הראשי והמשני.'],
      ['#addIntersectionBtn', 'צמתים', 'הוסיפו צמתים לבדיקה.'],
      ['#calcBtn', 'חשבו', 'לחצו „חשב / עדכן תוצאות”.'],
      ['#resultsArea', 'התוצאה', 'נסיעות מיוצרות, השפעה על הצמתים והמלצות.']
    ],
    'transit-lanes-stations-safety.html': [
      ['.tabs', 'בחרו נושא', 'נתיבי נת״צ, תחנות, בטיחות, שדרוג תשתית.'],
      ['#l_type, #l_vd, #l_width, #l_lanes', 'הנתיב', 'סוג, מהירות תכן, רוחב ומספר נתיבים.'],
      ['#l_barrier, #l_buses, #l_pax, #l_speed_limit', 'שימוש', 'הפרדה, נפח אוטובוסים ונוסעים ומהירות מותרת.'],
      ['#laneResults', 'התוצאה', 'בדיקות מול AASHTO / APTA – מתעדכן מיד.']
    ],
    'transit-level-of-service.html': [
      ['#area_type', 'סוג המרחב', 'לפיו נקבעים התקנים.'],
      ['#freq, #walk, #h_start, #h_end', 'שירות', 'תדירות, מרחק הליכה ושעות פעילות.'],
      ['#line_type, #speed, #transfers', 'הקו', 'סוג, מהירות מסחרית ומספר עליות.'],
      ['#cv_mean, #cv_std', 'אמינות', 'משך נסיעה ממוצע וסטיית תקן.'],
      ['#results', 'התוצאה', 'עמידה בכל תקן – מתעדכן מיד.']
    ],
    'typical-section.html': [
      ['#ctx, #preset', 'הקשר ותבנית', 'עירוני / בין-עירוני ותבנית התחלתית.'],
      ['#rowTarget', 'זכות דרך יעד', 'הכלי מראה אם החתך נכנס ברוחב.'],
      ['#secSVG, #sheetwrap', 'עריכת החתך', 'לחצו על רכיב כדי לשנות סוג, רוחב וכיוון.'],
      ['#statusPill', 'בדיקות', 'חריגות מההנחיות – לחצו לפירוט.'],
      ['#btnAddSheet, #btnShare', 'גיליון וייצוא', 'הוספה לגיליון A0 וייצוא.']
    ],
    'urban-bus-lane-justification.html': [
      ['#btn_pax, #btn_bus', 'בסיס הבדיקה', 'נוסעים ממשיכים או נפח אוטובוסים.'],
      ['#metric, #speed', 'נפח ומהירות', 'הנפח בשעת שיא ומהירות מסחרית ממוצעת.'],
      ['#cv_on, #prox_on', 'מדדים נוספים', 'אמינות (CV) וקרבה לנתיב העירוני – לפי הצורך.'],
      ['#q0', 'שאלות איכותיות', 'סמנו את מה שמתאים לציר.'],
      ['#results', 'התוצאה', 'האם יש הצדקה לנת״צ, והגרף – מתעדכן מיד.']
    ],
    'urban-street-segment-analysis-metric.html': [
      ['#segmentId, #periodLabel, #phf', 'המקטע', 'מזהה, תקופה ו-PHF.'],
      ['#segLength, #throughLanes, #laneWidth, #medianType', 'גאומטריה', 'אורך, נתיבים, רוחב וסוג אי מפריד.'],
      ['#accessPerKm, #parking, #busStops, #speedLimit', 'רחוב', 'גישות, חניה, תחנות ומהירות מותרת.'],
      ['#throughVol, #truckPct, #bikeVol, #pedVol', 'נפחים', 'רכב, משאיות, אופניים והולכי רגל.'],
      ['#submitBtn', 'נתחו', 'לחצו „נתח מקטע”.'],
      ['#results, #submitBtn', 'התוצאה', 'אחרי „נתח מקטע” – מהירות נסיעה ורמת שירות לרכב, אופניים, הולכי רגל ותח״צ.']
    ],
    'vertical-alignment.html': [
      ['#srcProj, #srcFiles', 'מקור הציר', 'ייבוא מהפרויקט או מקבצי DWG / DXF.'],
      ['#fAxes, #fSurv, #srcFiles', 'קבצים', 'בקבצי DWG / DXF: קובץ צירים וקובץ מדידה.'],
      ['#surveyTxt, #colOrder', 'או ענן נקודות', 'הדביקו X,Y,Z ובחרו סדר עמודות.'],
      ['#btnLoad, #srcProj', 'בנו את החתך', 'לחצו „קליטה ובניית החתך”.'],
      ['#btnDrawAxis', 'ציר ידני', 'אפשר גם לצייר ציר ביד.']
    ],
    'vertical.html': [
      ['.tabs', 'בחרו נושא', 'קמור, קעור, שיפועים, שילוב תוואים, כבש מילוט.'],
      ['#t1_vd, #t1_sd', 'מהירות וראות', 'מהירות תכן ומרחק ראות לתכן.'],
      ['#t1_g1, #t1_g2', 'שיפועים', 'שיפוע נכנס ויוצא.'],
      ['#t1_h1, #t1_h2, #t1_Ruser', 'גבהים ורדיוס', 'גובה עין ועצם, ורדיוס מתוכנן לבדיקה.'],
      ['#t1_results', 'התוצאה', 'אורך / רדיוס נדרש ובדיקה – מתעדכן מיד.']
    ],
    'worklog.html': [
      ['#p_name, #p_client, #p_contr, #p_eng, #p_sec, #p_start', 'פתיחת פרויקט', 'שם, מזמין, קבלן, מהנדס, מקטע ותאריך התחלה.'],
      ['#btnPSave', 'שמירה', 'לחצו „שמירה” – היומן נפתח.'],
      ['#projList, #listBody', 'רישומי יומן', 'הוסיפו רישום לכל יום עבודה. הכל נשמר במכשיר (אפשר לגבות לקובץ).']
    ]
  };
  var page = location.pathname.split('/').pop() || 'index.html';
  var steps = TOURS[page];
  if (!steps) return;

  var css = '' +
    '.mt-btn{position:fixed;bottom:18px;left:72px;z-index:2147483000;background:#f59e0b;color:#111;border:0;border-radius:999px;padding:10px 18px;font:700 15px Arial,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}' +
    '.mt-ring{position:absolute;z-index:2147483001;border:4px solid #f59e0b;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,23,42,.45);pointer-events:none;transition:all .25s}' +
    '.mt-box{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483002;direction:rtl;background:#0f172a;color:#fff;border-radius:14px;padding:14px 18px;width:min(520px,92vw);font:16px/1.45 Arial,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4)}' +
    '.mt-box b{display:block;font-size:18px;margin-bottom:4px}.mt-box .mt-n{display:inline-block;background:#f59e0b;color:#111;border-radius:999px;min-width:26px;text-align:center;margin-left:8px}' +
    '.mt-nav{display:flex;gap:8px;justify-content:flex-start;margin-top:10px}.mt-nav button{border:0;border-radius:8px;padding:6px 14px;font:600 14px Arial,sans-serif;cursor:pointer}' +
    '.mt-next{background:#f59e0b;color:#111}.mt-prev,.mt-end{background:#334155;color:#fff}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'mt-btn'; btn.textContent = '❓ איך משתמשים?';
  document.body.appendChild(btn);

  var ring = null, box = null, i = 0;
  function end() { if (ring) ring.remove(); if (box) box.remove(); ring = box = null; btn.hidden = false; }
  function show() {
    var s = steps[i], els = [].slice.call(document.querySelectorAll(s[0])).filter(function (e) { return e.offsetParent !== null; });
    if (els.length) {
      els[0].scrollIntoView({ block: 'center' });
      var R = els.map(function (e) { return e.getBoundingClientRect(); });
      var x0 = Math.min.apply(0, R.map(function (r) { return r.left; })), y0 = Math.min.apply(0, R.map(function (r) { return r.top; }));
      var x1 = Math.max.apply(0, R.map(function (r) { return r.right; })), y1 = Math.max.apply(0, R.map(function (r) { return r.bottom; }));
      ring.style.cssText = 'left:' + (x0 + scrollX - 6) + 'px;top:' + (y0 + scrollY - 6) + 'px;width:' + (x1 - x0 + 12) + 'px;height:' + (y1 - y0 + 12) + 'px';
      ring.hidden = false;
    } else ring.hidden = true;
    box.querySelector('.mt-t').innerHTML = '';
    var n = document.createElement('span'); n.className = 'mt-n'; n.textContent = (i + 1) + '/' + steps.length;
    box.querySelector('.mt-t').append(n, document.createTextNode(s[1]));
    box.querySelector('.mt-d').textContent = s[2];
    box.querySelector('.mt-prev').hidden = i === 0;
    box.querySelector('.mt-next').textContent = i === steps.length - 1 ? 'סיום' : 'הבא ←';
  }
  function start() {
    btn.hidden = true; i = 0;
    ring = document.createElement('div'); ring.className = 'mt-ring'; document.body.appendChild(ring);
    box = document.createElement('div'); box.className = 'mt-box'; box.setAttribute('role', 'dialog');
    box.innerHTML = '<b class="mt-t"></b><div class="mt-d"></div><div class="mt-nav"><button type="button" class="mt-next"></button><button type="button" class="mt-prev">→ הקודם</button><button type="button" class="mt-end">סגור</button></div>';
    document.body.appendChild(box);
    box.querySelector('.mt-next').onclick = function () { if (i < steps.length - 1) { i++; show(); } else end(); };
    box.querySelector('.mt-prev').onclick = function () { if (i > 0) { i--; show(); } };
    box.querySelector('.mt-end').onclick = end;
    show();
  }
  btn.addEventListener('click', start);
  document.addEventListener('keydown', function (e) { if (box && e.key === 'Escape') end(); });
  addEventListener('resize', function () { if (box) show(); });
})();
