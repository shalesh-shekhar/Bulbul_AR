const CACHE_NAME = 'bulbul-v1.01';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // 1. Skip APIs and let Safari natively handle heavy .mp4 byte-range streaming
    if (event.request.url.includes('firestore.googleapis.com') || 
        event.request.url.includes('google.com') || 
        event.request.url.endsWith('.mp4')) return;

    // 2. Network-First for HTML navigation
    if (event.request.mode === 'navigate') {
        if (event.request.method !== 'GET') {
            event.respondWith(fetch(event.request));
            return;
        }
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => caches.match(event.request))
        );
        return;
    }

    // 3. Cache-First for standard assets (Allow 200 and Status 0 Opaque CDNs)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                if (event.request.method !== 'GET') return networkResponse;
                if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
                    return networkResponse;
                }
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
