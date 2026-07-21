// SlabSet live — bump VERSION on deploy so caches refresh.
var VERSION = 'v707';
var CACHE = 'slabset-' + VERSION;
var ASSETS = [
  './',
  './index.html',
  './concrete-slab-calculator.html',
  './concrete-footing-calculator.html',
  './pier-footing-calculator.html',
  './concrete-column-calculator.html',
  './round-pad-calculator.html',
  './concrete-stairs-calculator.html',
  './terms.html',
  './privacy.html',
  './shared/styles.css',
  './shared/app.js',
  './shared/icons/icon-192.png',
  './shared/icons/icon-512.png',
  './shared/icons/icon-maskable-512.png',
  './shared/icons/favicon-48.png',
  './shared/icons/apple-touch-icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
