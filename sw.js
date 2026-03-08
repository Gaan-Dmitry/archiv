// Service Worker для кэширования и офлайн-работы

const CACHE_NAME = 'audio-archive-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Кэширование ресурсов');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('Ошибка кэширования:', error);
            })
    );
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    // Пропускаем запросы к Яндекс API
    if (event.request.url.includes('cloud-api.yandex.net')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Возвращаем из кэша, если есть
                if (response) {
                    return response;
                }
                
                // Иначе делаем запрос к сети
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Кэшируем успешные ответы
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Если нет сети и нет кэша, возвращаем офлайн страницу
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Обработка сообщений от основного приложения
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_AUDIO') {
        const audioUrl = event.data.url;
        const audioName = event.data.name;
        
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => {
                    return fetch(audioUrl)
                        .then((response) => {
                            if (response.ok) {
                                return cache.put(audioUrl, response);
                            }
                        })
                        .then(() => {
                            self.clients.matchAll().then((clients) => {
                                clients.forEach((client) => {
                                    client.postMessage({
                                        type: 'AUDIO_CACHED',
                                        name: audioName
                                    });
                                });
                            });
                        });
                })
        );
    }
});