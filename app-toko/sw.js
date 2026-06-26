const CACHE_NAME = 'toko-pwa-v5';

const urlsToCache = [
    '/index.html',
    '/login.html',
    '/app.js',
    '/manifest.json',
    '/icons/download.png',
    '/icons/downloadre.png'
];

function amanUntukCache(response) {
    if (!response) return false;
    if (response.status !== 200) return false;
    if (response.type === 'opaque') return false;
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('text/html')) return false;
    return true;
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                urlsToCache.map(url =>
                    fetch(url).then(response => {
                        if (amanUntukCache(response)) {
                            return cache.put(url, response);
                        }
                    }).catch(() => {})
                )
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(oldCache => caches.delete(oldCache))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return event.respondWith(fetch(event.request));
    }

    const url = new URL(event.request.url);

    // Bypass: API
    if (url.pathname.startsWith('/api-toko')) return;

    // Bypass: PHP
    if (url.pathname.endsWith('.php')) return;

    // Bypass: favicon
    if (url.pathname === '/favicon.ico') return;

    // Bypass: domain lain (CDN Tailwind, dll)
    if (url.origin !== self.location.origin) return;

    const acceptHeader = event.request.headers.get('accept') || '';
    const isHtmlRequest = acceptHeader.includes('text/html');

    if (isHtmlRequest) {
        // HTML: selalu dari network, tidak di-cache
        // InfinityFree inject script ke semua HTML
        event.respondWith(
            fetch(event.request)
                .catch(() =>
                    caches.match(event.request)
                        .then(r => r || caches.match('/index.html'))
                        .then(r => r || new Response('Offline', { status: 503 }))
                )
        );
        return;
    }

    // Aset statis (JS, CSS, gambar): cache-first
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then(networkResponse => {
                if (amanUntukCache(networkResponse)) {
                    const cloned = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, cloned).catch(() => {});
                    });
                }
                return networkResponse;
            }).catch(() => {
                return new Response('Aset tidak tersedia offline.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});
