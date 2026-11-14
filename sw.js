const C='ironlog-v78';
const FILES=['./','./index.html','./style.css','./data.js','./app.js','./train.js','./measure.js','./food.js','./manifest.webmanifest','icon.svg','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png'];

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('message',e=>{
 if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
  const ks=await caches.keys();
  await Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)));
  await self.clients.claim();
  /* УБРАНО: принудительный navigate — теперь страница не перезагружается посреди ввода.
     Пользователь сам нажимает "Обновить" в баннере. */
 })());
});
/* нажатие на уведомление: открыть приложение на нужном экране (или вернуть его на передний план) */
self.addEventListener('notificationclick',e=>{
 e.notification.close();
 const url=new URL((e.notification.data&&e.notification.data.url)||'./#measure',self.registration.scope).href;
 e.waitUntil((async()=>{
  const list=await clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of list){
   if(c.url.startsWith(self.registration.scope)){
    try{await c.focus();}catch(err){}
    try{await c.navigate(url);}catch(err){}
    return;
   }
  }
  await clients.openWindow(url);
 })());
});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(url.origin!==location.origin)return;
 if(e.request.mode==='navigate'){
  e.respondWith(
   fetch(e.request)
    .then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put('./index.html',cp));}return res;})
    .catch(()=>caches.match('./index.html'))
  );
  return;
 }
 e.respondWith(
  caches.match(e.request).then(cached=>{
   /* в кеш кладём только успешные ответы; без сети и без кеша — честная сетевая ошибка */
   const fresh=fetch(e.request)
    .then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));}return res;})
    .catch(()=>cached||Response.error());
   return cached||fresh;
  })
 );
});
