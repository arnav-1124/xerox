const CACHE_NAME = 'xerox-vault-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Navigation requests - Network-First
  // This ensures we always get the latest index.html when online, preventing stale hashes.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Static assets - Cache-First with Dynamic Caching
  // Cache built files (/assets/*) and other assets as they are fetched.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        const contentType = response.headers.get('content-type');
        
        // Only cache successful requests and ignore HTML fallbacks for assets
        if (
          response.status === 200 &&
          (!contentType || !contentType.includes('text/html')) &&
          (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.svg' || url.pathname === '/manifest.json')
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch((err) => {
        console.error('Fetch failed for asset:', event.request.url, err);
      });
    })
  );
});
