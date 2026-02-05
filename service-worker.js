// Версия кэша - меняйте при обновлении
const CACHE_NAME = 'rr4-clock-v2';

// Файлы для кэширования
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Установка');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Пропуск ожидания');
        return self.skipWaiting();
      })
  );
});

// Активация
self.addEventListener('activate', event => {
  console.log('[Service Worker] Активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Активирован');
      return self.clients.claim();
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  // Пропускаем запросы к аналитике и API
  if (event.request.url.includes('analytics') || event.request.url.includes('api.')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если файл в кэше - возвращаем его
        if (response) {
          return response;
        }
        
        // Если нет - загружаем из сети
        return fetch(event.request).then(response => {
          // Проверяем валидный ли ответ
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Клонируем ответ
          const responseToCache = response.clone();

          // Добавляем в кэш
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      }).catch(error => {
        // Если нет сети и нет в кэше - показываем оффлайн страницу
        console.log('[Service Worker] Ошибка загрузки:', error);
        return new Response('Оффлайн режим. Приложение будет работать с ограниченным функционалом.', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Обработка push-уведомлений
self.addEventListener('push', event => {
  console.log('[Service Worker] Push-уведомление получено');

  const data = event.data ? event.data.text() : 'Новое уведомление';
  
  const options = {
    body: data,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'rr4-alarm',
    requireInteraction: true,
    actions: [
      {
        action: 'close',
        title: 'Закрыть'
      },
      {
        action: 'snooze',
        title: 'Отложить'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Часы РР4', options)
  );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Клик по уведомлению');
  
  event.notification.close();

  if (event.action === 'snooze') {
    // Логика для откладывания
    console.log('Будильник отложен');
  } else {
    // Открываем приложение
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
    );
  }
});