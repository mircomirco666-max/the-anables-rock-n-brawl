#!/bin/bash
# Costruisce pwa/: il gioco come web app installabile (GitHub Pages / itch.io)
cd "$(dirname "$0")/.."
./tools/build.sh >/dev/null
VER=$(date +%Y%m%d%H%M)
python3 - "$VER" << 'PY'
import sys, json
ver = sys.argv[1]
body = open('dist/index.html').read()
head = """<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="theme-color" content="#0e0818">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="The Anables">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/icon-32.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
</head>
<body>
"""
tail = """
<script>
// uso offline e installazione: il service worker tiene una copia del gioco sul dispositivo
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
</body>
</html>
"""
open('pwa/index.html', 'w').write(head + body + tail)
open('pwa/manifest.webmanifest', 'w').write(json.dumps({
  "name": "The Anables: Rock 'n' Brawl", "short_name": "The Anables",
  "description": "Beat 'em up arcade della band The Anables: 10 livelli, fino a 4 giocatori.",
  "start_url": "./index.html", "scope": "./", "display": "fullscreen", "orientation": "landscape",
  "background_color": "#0e0818", "theme_color": "#0e0818", "lang": "it",
  "icons": [
    {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}, indent=2, ensure_ascii=False))
open('pwa/sw.js', 'w').write("""// Service worker: salva il gioco sul dispositivo e lo serve anche senza rete.
// A ogni nuova versione la cache cambia nome e quella vecchia viene cancellata.
const CACHE = 'anables-%s';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/icon-180.png', './icons/icon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
""" % ver)
open('pwa/.nojekyll', 'w').write('')
print('pwa/ pronta, versione', ver)
PY
