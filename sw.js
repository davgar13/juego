const CACHE_NAME = 'juego-cache-v1.0';

const carruselImages = [];
for (let i = 1; i <= 25; i++) {
  carruselImages.push(`./img/carucel/producto${i}.webp`);
}

const urlsToCache = [
  // Archivos raíz
  './',
  './index.html',
  
  // CSS
  './css/style.css',
  
  // JavaScript
  './js/script.js',
  './js/confetti.browser.min.js',
  
  // Imágenes principales
  './img/logo.webp',
  './img/fondo_inferior.webp',
  './img/fondo_superior.webp',
  './img/moneda3.webp',
  
  // Audio
  './audio/juego_ganar.ogg',
  './audio/juego_girrar.ogg',
  './audio/juego_perder.ogg',
  './audio/wood_plank_flicks.ogg',
  
  // Imágenes del carrusel
  ...carruselImages
];

// Instalación: cachea todos los recursos
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando recursos');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Error en instalación:', error);
      })
  );
});

// Activación: limpia caches viejos
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Ahora controla todas las peticiones');
      return self.clients.claim();
    })
  );
});

// Fetch: sirve desde cache si está disponible
self.addEventListener('fetch', event => {
  // Solo cachea peticiones GET
  if (event.request.method !== 'GET') return;
  
  // Excluye peticiones a servidores externos
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en cache, devuélvelo
        if (response) {
          console.log('[Service Worker] Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        // Si no está en cache, haz la petición y guarda en cache
        return fetch(event.request)
          .then(response => {
            // Verifica que la respuesta sea válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la respuesta para guardar en cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Guardando en cache:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Error al fetch:', error);
            // Puedes devolver una página de error personalizada aquí
          });
      })
  );
});