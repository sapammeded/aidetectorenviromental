const CACHE_NAME = 'security-prompt-m4-v1';
const FILES = [
  './security_prompt_maker_v4.html',
  'https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js',
  'https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', evt=>{
  evt.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', evt=>{
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', evt=>{
  evt.respondWith(caches.match(evt.request).then(resp=>resp || fetch(evt.request)));
});