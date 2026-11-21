// 앱을 고칠 때마다 VERSION만 올리면 태블릿이 새 버전을 받아요.
const VERSION='kids-play-v18';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  // 영상은 크고 이어받기(range) 요청이라 저장하지 않고 그대로 받음
  if(req.headers.has('range')||/\.(webm|ogv|mp4)(\?|$)/.test(req.url))return;
  const isPage=req.mode==='navigate';
  if(isPage){
    const fresh=()=>fetch(req,{cache:'no-cache'}).then(r=>{if(r.ok){const c=r.clone();caches.open(VERSION).then(x=>x.put('./index.html',c))}return r});
    // 새 버전으로 바꿀 때(?v=)만 인터넷을 기다리고, 평소에는 저장본으로 바로 열고 뒤에서 새로 받아 둠 → 와이파이가 느려도 빨리 열림
    if(/[?&]v=/.test(req.url)){e.respondWith(Promise.race([fresh(),new Promise(r=>setTimeout(r,5000))]).then(r=>r||caches.match('./index.html')).catch(()=>caches.match('./index.html')));return}
    e.respondWith(caches.match('./index.html').then(hit=>{const f=fresh().catch(()=>hit);if(hit){e.waitUntil(f.catch(()=>{}));return hit}return f}));return;
  }
  // 나머지(글꼴·QR 도구·미리보기 그림)는 저장본 우선
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok||r.type==='opaque'){const c=r.clone();caches.open(VERSION).then(x=>x.put(req,c))}return r})));
});
