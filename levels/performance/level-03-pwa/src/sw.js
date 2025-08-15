// TODO: 完成 Service Worker 配置
// 1. 实现缓存策略
// 2. 配置离线支持
// 3. 添加推送通知
// 4. 实现后台同步

const CACHE_NAME = 'pwa-demo-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
});

// 获取事件
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有响应，则返回缓存的版本
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});