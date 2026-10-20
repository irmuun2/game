// 2026-10: «Хичээлийн сан»-гийн файлууд энэ репод андуурч орж, түүний service worker тоглоомын хаягт бүртгэгдсэн.
// Энэ файл тэр service worker-ийг солиод хадгалсан кэшийг цэвэрлэж, өөрийгөө устгана. Тоглоом service worker ашигладаггүй.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then(cs => cs.forEach(c => c.navigate(c.url))));
});
