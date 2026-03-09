const CACHE_NAME = 'fuel-tracker-v3';
const ASSETS = [
    './',
    './fuel-tracker.html',
    './styles.css',
    './app.js',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js'
];

// Instalar: cachear todos los archivos
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activar: borrar cachés antiguas
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // Guardar copia fresca en caché
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, clone);
                });
                return response;
            })
            .catch(() => {
                // Sin conexión: servir desde caché
                return caches.match(e.request);
            })
    );
});
