// Fort Kitchen Command - Service Worker
// PWA functionality for offline usage

const CACHE_NAME = 'fort-kitchen-command-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/kitchen-command.js',
    '/manifest.json'
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
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