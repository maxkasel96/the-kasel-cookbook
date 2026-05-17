const STATIC_CACHE = 'kasel-cookbook-static-v1'
const RECIPE_CACHE = 'kasel-cookbook-recipes-v1'
const APP_SHELL_URLS = ['/offline', '/recipes', '/icons/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  const expectedCaches = new Set([STATIC_CACHE, RECIPE_CACHE])

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (expectedCaches.has(cacheName)) {
              return Promise.resolve()
            }

            return caches.delete(cacheName)
          })
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request, url))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
  }
})

async function handleNavigation(request, url) {
  if (!isRecipeSurface(url)) {
    return fetch(request)
  }

  try {
    const response = await fetch(request)

    if (response.ok) {
      const cache = await caches.open(RECIPE_CACHE)
      await cache.put(request, response.clone())
    }

    return response
  } catch {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    return caches.match('/offline')
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const response = await fetch(request)

  if (response.ok) {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }

  return response
}

function isRecipeSurface(url) {
  const isRecipeDetail = /^\/recipes\/[^/]+$/.test(url.pathname)

  return (
    url.pathname === '/recipes' ||
    isRecipeDetail ||
    url.pathname === '/favorites'
  )
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.webmanifest'
  )
}
