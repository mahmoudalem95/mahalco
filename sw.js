/* מהאלco — service worker
   מטרה: שהאתר ייפתח מהר, יעבוד גם ברשת חלשה, וייתן להתקין אותו כאפליקציה.
   אסטרטגיה: ניווטים — רשת קודם עם נפילה למטמון; שאר הקבצים — מטמון קודם. */
const VER   = 'mahalco-v1';
const SHELL = [
  './', './index.html', './apis-he.html', './apis.html',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VER).then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
          .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))
          .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // צד שלישי — לא נוגעים

  if (req.mode === 'navigate') {                            // דף
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VER).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(                                            // נכס
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VER).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
