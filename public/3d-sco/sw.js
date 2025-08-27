// Service Worker for 3D-SCO PWA
const CACHE_NAME = '3d-sco-v1.0.0';
const STATIC_CACHE_NAME = '3d-sco-static-v1.0.0';
const DYNAMIC_CACHE_NAME = '3d-sco-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other critical assets here
];

// Routes to cache dynamically
const CACHEABLE_ROUTES = [
  '/projects',
  '/blog',
  '/about',
  '/contact',
  '/admin'
];

// Network-first routes (always try network first)
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/admin/api/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different types of requests
  if (isNetworkFirstRoute(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else if (isCacheableRoute(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Strategy: Network First (for API calls)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
    
    throw error;
  }
}

// Strategy: Cache First (for static assets)
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch and cache', error);
    throw error;
  }
}

// Strategy: Stale While Revalidate (for pages)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('Service Worker: Network failed for stale-while-revalidate', error);
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

// Helper functions
function isNetworkFirstRoute(pathname) {
  return NETWORK_FIRST_ROUTES.some(route => pathname.startsWith(route));
}

function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

function isCacheableRoute(pathname) {
  return CACHEABLE_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm());
  } else if (event.tag === 'newsletter-signup') {
    event.waitUntil(syncNewsletterSignup());
  }
});

// Sync contact form submissions
async function syncContactForm() {
  try {
    // Get pending contact form submissions from IndexedDB
    const pendingSubmissions = await getPendingContactSubmissions();
    
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submission.data)
        });
        
        if (response.ok) {
          await removePendingContactSubmission(submission.id);
          console.log('Service Worker: Contact form synced successfully');
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync contact form', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Sync newsletter signups
async function syncNewsletterSignup() {
  try {
    const pendingSignups = await getPendingNewsletterSignups();
    
    for (const signup of pendingSignups) {
      try {
        const response = await fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signup.data)
        });
        
        if (response.ok) {
          await removePendingNewsletterSignup(signup.id);
          console.log('Service Worker: Newsletter signup synced successfully');
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync newsletter signup', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Newsletter sync failed', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: 'มีเนื้อหาใหม่ใน 3D-SCO Portfolio',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'ดูเนื้อหา',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'ปิด',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('3D-SCO Portfolio', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Placeholder functions for IndexedDB operations
// These would need to be implemented with actual IndexedDB code
async function getPendingContactSubmissions() {
  // Implementation would go here
  return [];
}

async function removePendingContactSubmission(id) {
  // Implementation would go here
}

async function getPendingNewsletterSignups() {
  // Implementation would go here
  return [];
}

async function removePendingNewsletterSignup(id) {
  // Implementation would go here
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});