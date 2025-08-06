// Service Worker for Surya Abadi Connecteam
// Version: 1.0.2 - Mobile/PWA Fix Update

const CACHE_NAME = 'surya-abadi-v1.0.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Add version control
const APP_VERSION = '1.0.2';

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
        cacheNames.filter((cacheName) => {
          // Delete old caches that don't match current version
          return cacheName.startsWith('surya-abadi-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: APP_VERSION
          });
        });
        return self.clients.claim();
      });
    })
  );
});

// Fetch event - network first for API calls, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for API calls and authentication
  if (url.pathname.includes('/api/') ||
      url.pathname.includes('firestore.googleapis.com') ||
      url.pathname.includes('identitytoolkit.googleapis.com') ||
      url.pathname.includes('securetoken.googleapis.com')) {
    event.respondWith(fetch(request));
    return;
  }
  
  // For navigation requests, always fetch from network
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Message event - handle various commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear all caches on demand
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('Clearing cache on demand:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Notify client that cache is cleared
        event.ports[0].postMessage({ success: true });
      })
    );
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
                data: data,
                currentVersion: APP_VERSION
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

// Handle white screen recovery
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WHITE_SCREEN_DETECTED') {
    console.log('White screen detected by client, clearing cache...');
    
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Force refresh all clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_CLEARED',
              action: 'reload'
            });
          });
        });
      })
    );
  }
});

console.log('Service Worker v' + APP_VERSION + ' loaded successfully');