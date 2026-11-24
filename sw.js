/* Size tracker offline cache: uses the network when it answers fast, otherwise the saved copy */
const CACHE='size-app-v1';
const FILES=['./','./index.html','./apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);const nav=r.mode==='navigate';
    const net=fetch(new Request(r.url,{cache:'no-store',credentials:'same-origin'})).then(res=>{if(res&&res.ok){c.put(nav?'./index.html':r,res.clone());if(nav)c.put('./',res.clone());}return res;});
    const hit=nav?(await c.match('./index.html')||await c.match('./')):await c.match(r,{ignoreSearch:true});
    if(!hit)return net;
    return Promise.race([net.then(res=>res&&res.ok?res:hit).catch(()=>hit),new Promise(ok=>setTimeout(()=>ok(hit),3000))]);
  })());
});
