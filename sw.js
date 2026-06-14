// Service Worker — Ders Takip Pro
// Strateji: network-first (her zaman en son kod), offline ise önbellekten sun

const CACHE_VER      = 'v29';
const CACHE_LOCAL    = 'ders-takip-local-'  + CACHE_VER;
const CACHE_CDN      = 'ders-takip-cdn-'    + CACHE_VER;

// ─── Önbelleğe alınacak yerel dosyalar ───────────────────────────────────────

const LOCAL_ASSETS = [
  '/welcome.html',
  '/index-teacher.html',
  '/index-student.html',
  '/weekly-teacher.html',
  '/weekly-student.html',
  '/notes-teacher.html',
  '/notes-student.html',
  '/settings-teacher.html',
  '/settings-student.html',
  '/assets/css/tokens.css',
  '/assets/css/base.css',
  '/assets/css/brand.css',
  '/assets/css/components.css',
  '/assets/css/pages/notes.css',
  '/assets/css/pages/home-teacher.css',
  '/assets/css/pages/home-student.css',
  '/assets/css/pages/weekly.css',
  '/assets/css/pages/swipe.css',
  '/assets/css/pages/settings.css',
  '/assets/js/app-shell.js',
  '/assets/js/firebase.js',
  '/assets/js/auth.js',
  '/assets/js/sync.js',
  '/font/material-symbols-rounded-latin-400-normal.woff2',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
];

// ─── CDN host'ları (Firebase SDK, Google Fonts) ───────────────────────────────

function isCdnUrl(url) {
  const h = new URL(url).hostname;
  return (
    h.endsWith('gstatic.com')      ||
    h.endsWith('googleapis.com')   ||
    h.endsWith('firebaseapp.com')
  );
}

// ─── Firebase Realtime Database API — sadece network ─────────────────────────

function isFirebaseDbUrl(url) {
  const h = new URL(url).hostname;
  return (
    h.endsWith('firebasedatabase.app') ||
    h.endsWith('firebase.googleapis.com')
  );
}

// ─── Install: yerel dosyaları önbelleğe al ────────────────────────────────────

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_LOCAL).then(function(cache) {
      // Her dosyayı ayrı ayrı dene; biri başarısız olursa diğerleri devam eder
      return Promise.allSettled(
        LOCAL_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] cache.add başarısız:', url, err);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ─── Activate: eski önbellekleri temizle ──────────────────────────────────────

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_LOCAL && k !== CACHE_CDN; })
          .map(function(k)    { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', function(event) {
  // Sadece GET isteklerini yönet
  if (event.request.method !== 'GET') return;

  var url = event.request.url;

  // Firebase DB API → her zaman network (offline ise hata dönsün, o normal)
  if (isFirebaseDbUrl(url)) return;

  // CDN (Firebase SDK, Google Fonts) → önce cache, yoksa network + cache'e yaz
  if (isCdnUrl(url)) {
    event.respondWith(cdnFirst(event.request));
    return;
  }

  // Yerel dosyalar → network-first (önce network, yoksa önbellekten sun)
  event.respondWith(networkFirst(event.request));
});

// ─── Strateji: CDN cache-first ────────────────────────────────────────────────

function cdnFirst(request) {
  return caches.open(CACHE_CDN).then(function(cache) {
    return cache.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response.ok) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

// ─── Strateji: network-first ─────────────────────────────────────────────────
// Önce network'ten al (her zaman en güncel kod), network yoksa önbellekten sun

function networkFirst(request) {
  var cacheKey = stripVersionParam(request);

  return caches.open(CACHE_LOCAL).then(function(cache) {
    return fetch(request).then(function(response) {
      // Network başarılıysa önbelleği güncelle ve döndür
      if (response.ok) cache.put(cacheKey, response.clone());
      return response;
    }).catch(function() {
      // Network yoksa önbellekten sun (offline modu)
      return cache.match(cacheKey, { ignoreSearch: true });
    });
  });
}

// ─── Yardımcı: versiyon query param temizle ───────────────────────────────────

function stripVersionParam(request) {
  try {
    var u = new URL(request.url);
    u.searchParams.delete('v');
    u.searchParams.delete('t');
    return new Request(u.toString(), { method: request.method, headers: request.headers });
  } catch(e) {
    return request;
  }
}
