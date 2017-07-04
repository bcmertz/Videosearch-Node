self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('enventure dashboard 0.1').then(cache => (
      cache.addAll([
        '/',
        'index.html',
        'styles.css',
        'background.png',
        'app.bundle.js.gz',
      ])
      .then(() => self.skipWaiting())
    ))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keyList => (
      Promise.all(keyList.map((key) => {
        if (key !== cacheName) {
          console.log('deleting key', key);
          return caches.delete(key);
        }
      }))
    ))
  );
  return self.clients.claim();
});

// self.addEventListener('fetch', (event) => {
//   cacheURLS.forEach((url) => {
//     if (event.request.url.endsWith(url)) {
//       event.respondWith(
//         caches.match(event.request, { ignoreSearch: true }).then(response => (
//           response || fetch(event.request)
//         ))
//       );
//     }
//   });
// });

self.addEventListener('fetch', (e) => {
  console.log('[ServiceWorker] Fetch', e.request.url);
  e.respondWith(
    caches.match(e.request).then(response => (
      response || fetch(e.request)
    ))
  );
});
