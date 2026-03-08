// SiteViral Service Worker — Web Push Notifications + Badge API

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push events
self.addEventListener('push', (event) => {
  let data = { title: '🔔 SiteViral', body: 'Nouvelle notification', url: '/' };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-96x96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'dismiss', title: 'Fermer' },
    ],
    tag: data.tag || 'siteviral-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      // Update app badge count
      if (self.navigator && self.navigator.setAppBadge) {
        // Increment badge — read current count from a simple approach
        self.navigator.setAppBadge();
      }
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Clear badge when user interacts with notification
  if (self.navigator && self.navigator.clearAppBadge) {
    self.navigator.clearAppBadge();
  }

  const url = event.notification.data?.url || '/';
  const fullUrl = url.startsWith('http') ? url : `${self.location.origin}${url}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(fullUrl);
    })
  );
});

// Periodic Background Sync — refresh data when online
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sv-content-sync') {
    event.waitUntil(
      // Notify all clients to refresh their data
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PERIODIC_SYNC', tag: event.tag });
        });
      })
    );
  }
});
