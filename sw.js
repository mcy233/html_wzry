const CACHE_VERSION = 'kpl-game-v1';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/animations.css',
    '/css/components/buttons.css',
    '/css/components/cards.css',
    '/css/components/modal.css',
    '/css/components/momentum-bar.css',
    '/css/components/tutorial.css',
    '/css/scenes/title.css',
    '/css/scenes/team-select.css',
    '/css/scenes/home.css',
    '/css/scenes/battle.css',
    '/css/scenes/explore.css',
    '/css/scenes/training.css',
    '/css/scenes/roster.css',
    '/css/scenes/season.css',
    '/css/scenes/settings.css',
    '/js/main.js',
    '/js/core/GameEngine.js',
    '/js/core/SceneManager.js',
    '/js/core/EventBus.js',
    '/js/core/SaveManager.js',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            const networkFetch = fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});
