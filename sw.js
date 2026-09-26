// מהאלco — Service Worker
// גרסת המטמון: מעלים ב-1 בכל פעם שמפרסמים גרסה חדשה של האתר,
// כדי לאלץ דפדפנים לרענן את הקבצים השמורים.
const CACHE_VERSION = "mahalco-v7";

// נשמרים מראש (זמינים גם ללא אינטרנט) רק כפתורי ה-hero בעמוד הבית.
// כדי להוסיף כלי נוסף לרשימה — פשוט מוסיפים שורה נוספת כאן.
const PRECACHE_URLS = [
  "./",
  "index.html",
  "en/index.html",
  "ar/index.html",
  "css/junction.css",
  "js/junction.js",
  "manifest.webmanifest",
  "he/critical-lane-volume.html",
  "he/parking-regulations.html",
  "he/sd-tool.html",
  "he/typical-section.html",
  "he/calculator-dark-ui.html",
  "he/worklog.html",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // רק בקשות GET מטופלות על ידי ה-Service Worker.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // בקשות API (Render / api.mahalco.com) תמיד יוצאות לרשת –
  // אין טעם וגם לא נכון לשמור חישובים במטמון.
  const isApi =
    url.hostname.endsWith("onrender.com") ||
    url.hostname === "api.mahalco.com";
  if (isApi) return;

  // ניווט לדף HTML: קודם רשת (לתוכן עדכני), נפילה למטמון כשאין רשת,
  // ואם גם זה לא קיים - נופלים לעמוד הבית.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("index.html")))
    );
    return;
  }

  // קבצים סטטיים (CSS/JS/תמונות/גופנים): מטמון קודם, רשת כגיבוי,
  // ועדכון המטמון ברקע לפעם הבאה.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
