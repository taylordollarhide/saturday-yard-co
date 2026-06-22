const CACHE = 'syc-v3';
const ASSETS = [
  '/schedule.html',
  '/app-icon.png',
  '/SaturdayYardCompany_Logo.png',
  '/logo.png',
  '/favicon.png',
];

// Always fetch fresh from network for these
const NETWORK_FIRST = [
  '/.netlify/functions/',
  '/leads.html',
  '/api/',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Always network for external tiles, APIs, and leads pipeline
  if (
    url.includes('nominatim') ||
    url.includes('osrm') ||
    url.includes('valhalla') ||
    url.includes('tile.openstreetmap') ||
    NETWORK_FIRST.some(p => url.includes(p))
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
