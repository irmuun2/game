// Интернэтгүй ажиллуулах service worker (V.__VERSION__).
// Сайтын файлууд (HTML, JS, CSS, зураг): эхлээд сүлжээнээс авна (шинэ хувилбар), тасарвал хадгалснаас.
// CDN-ийн сангууд (хаягтаа хувилбартай): хадгалснаас. Supabase-ийн хүсэлтэд хүрэхгүй.
// Хичээлийн файлуудыг app.js өөрөө «lib-files» санд хадгална (энэ файл тэдгээрийг устгахгүй).
const SHELL = 'lib-shell-__VERSION__';
const CORE = ['./', 'index.html', 'style.css', 'app.js', 'cloud.js', 'catalog.js', 'maps.js', 'mapview.js', 'thumbs.js', 'sky.js', 'config.js', 'logo.svg', 'icon.svg',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js'];
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('lib-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res.ok) { const cp = res.clone(); caches.open(SHELL).then(c => c.put(req, cp)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(fetch(r).then(res => keep(r, res))
      .catch(() => caches.match(r, { ignoreSearch: r.mode === 'navigate' }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
  } else if (CDN.test(r.url)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => keep(r, res))));
  }
});
