importScripts('./cache-polyfill.js');
self.addEventListener('install', function(e) {
e.waitUntil(
caches.open('airhorner').then(function(cache) {
return cache.addAll([
'/',
'index.html',
'styles.css',
'background.png',
'app.bundle.js',
'app.bundle.js.map'
]);
})
);
});


self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
  if (event.request.url.slice(0,5) !== 'about') {
    event.respondWith(
      caches.match(event.request).then(function(response) {
        return response || fetch(event.request);
      })
    );
  }
});
