/* マイ手帳 Service Worker — ネットワーク優先＋キャッシュフォールバック（オフライン対応） */
const CACHE = "mytecho-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // キャッシュ対象はアプリ本体とFirebase SDKのみ（Firestore・Googleの通信はそのまま通す）
  const u = e.request.url;
  if (!u.startsWith(self.location.origin) && !u.startsWith("https://www.gstatic.com/firebasejs/")) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
