const C='ironlog-v13';
const FILES=['./','./index.html','./style.css','./data.js','./app.js','./train.js','./measure.js','./food.js','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    const ks=await caches.keys();
    await Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)));
    await self.clients.claim();
    const cs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    cs.forEach(c=>c.navigate(c.url));
  })());
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request)
        .then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put('./index.html',cp));return res;})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fresh=fetch(e.request)
        .then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res;})
        .catch(()=>cached);
      return cached||fresh;
    })
  );
});
