/* eslint-disable no-restricted-globals */

// Cache name for offline support
const CACHE_NAME = 'batch-monitor-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/icons/notification-icon.png',
        '/icons/notification-badge.png',
      ]);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    ...data,
    icon: data.icon || '/icons/notification-icon.png',
    badge: data.badge || '/icons/notification-badge.png',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
    data: {
      ...data.data,
      timestamp: new Date().getTime(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Handle 'view' action or default click
  const urlToOpen = event.notification.data?.url || '/admin/monitoring';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          client.focus();
          // Post message to the client
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            alert: event.notification.data?.alert,
          });
          return;
        }
      }
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  // You could log notification dismissals here
  console.log('Notification dismissed', event.notification.data);
});

// Fetch event - offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      // Otherwise, fetch from network
      return fetch(event.request).then((response) => {
        // Cache successful GET requests
        if (event.request.method === 'GET' && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
