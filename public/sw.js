const CACHE_NAME = 'cbr-quiz-v1';
const SHELL_FILES = [
  '/quiz.html',
  '/questions.json',
  '/manifest.json',
  '/icon.svg'
];

// Install: cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for everything
self.addEventListener('fetch', event => {
  event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
  const cache = await caches.open(CACHE_NAME);

  // Try cache first
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    // Cache successful same-origin responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    // Cache opaque cross-origin responses (S3 images)
    if (response.type === 'opaque') {
      cache.put(request, response.clone());
    }

    return response;
  } catch (e) {
    // Offline fallback
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Handle bulk image download message from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'DOWNLOAD_IMAGES') {
    event.waitUntil(downloadAllImages(event.data.urls, event.source));
  }
});

async function downloadAllImages(urls, client) {
  const cache = await caches.open(CACHE_NAME);
  let done = 0;
  const total = urls.length;
  const BATCH_SIZE = 6;

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async url => {
      try {
        // Skip if already cached
        const req = new Request(url, { mode: 'no-cors' });
        const existing = await cache.match(req);
        if (existing) {
          done++;
          client.postMessage({ type: 'DL_PROGRESS', done, total });
          return;
        }

        const resp = await fetch(req);
        await cache.put(req, resp);
      } catch (e) {
        // Skip failed images
      }
      done++;
      client.postMessage({ type: 'DL_PROGRESS', done, total });
    }));
  }

  client.postMessage({ type: 'DL_COMPLETE', done, total });
}
