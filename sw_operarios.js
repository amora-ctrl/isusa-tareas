const CACHE_NAME = 'isusa-operarios-v1';
const ASSETS = [
  './operarios.html',
  './manifest_operarios.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca interceptar: POST, requests al GAS (script.google.com), o chrome-extension
  if (
    e.request.method !== 'GET' ||
    url.includes('script.google.com') ||
    url.includes('chrome-extension')
  ) {
    return; // dejar pasar sin cachear
  }

  // Para GET normales: cache first, luego red
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        // Solo cachear respuestas válidas de mismo origen
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('./operarios.html'))
  );
});
