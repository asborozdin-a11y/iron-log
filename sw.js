const C='ironlog-v3';

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./icon.svg']))
    .then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    // удалить старые кэши
    const ks=await caches.keys();
    await Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)));
    await self.clients.claim();
    // авто-перезагрузка открытых окон, чтобы сразу увидеть новую версию
    const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    cs.forEach(c=>c.navigate(c.url));
  })());
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;

  // Страницы: СНАЧАЛА СЕТЬ, кэш только при офлайне → всегда актуальная версия
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request)
        .then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put('./index.html',cp));return res;})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  // Остальное (иконка, манифест): кэш сразу + обновление в фоне
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fresh=fetch(e.request)
        .then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res;})
        .catch(()=>cached);
      return cached||fresh;
    })
  );
});
