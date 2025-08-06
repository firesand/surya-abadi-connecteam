// Service Worker for App Update Detection
// Version: 1.0.0

const CACHE_NAME = 'surya-abadi-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Message event - handle update notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Check for updates
    event.waitUntil(
      fetch('/api/version')
        .then(response => response.json())
        .then(data => {
          // Send update info to client
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'UPDATE_AVAILABLE',
                data: data
              });
            });
          });
        })
        .catch(error => {
          console.log('Update check failed:', error);
        })
    );
  }
});

// Background sync for update checks
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

// Check for updates function
async function checkForUpdates() {
  try {
    const response = await fetch('/api/version');
    const data = await response.json();
    
    // Notify all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_CHECK',
        data: data
      });
    });
  } catch (error) {
    console.log('Background update check failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'App update available',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'app-update',
      data: {
        url: data.url || '/',
        version: data.version
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Surya Abadi Update', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      // Focus existing client or open new window
      for (let client of clients) {
        if (client.url === event.notification.data.url) {
          return client.focus();
        }
      }
      return self.clients.openWindow(event.notification.data.url);
    })
  );
});

console.log('Service Worker loaded successfully'); 