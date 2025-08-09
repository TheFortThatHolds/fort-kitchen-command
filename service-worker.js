// Fort Kitchen Command - Service Worker
// PWA functionality for offline usage

const CACHE_NAME = 'fort-kitchen-command-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/kitchen-command.js',
    '/manifest.json'
];

self.addEventListener('install', function(event) {
    // Force new service worker to activate immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', function(event) {
    // Clear old caches
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName !== CACHE_NAME;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            }
        )
    );
});

// Handle background sync for pantry updates
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync-pantry') {
        event.waitUntil(syncPantryData());
    }
});

function syncPantryData() {
    // Sync pantry inventory when online
    return new Promise((resolve) => {
        console.log('Fort Kitchen Command: Syncing pantry data...');
        resolve();
    });
}