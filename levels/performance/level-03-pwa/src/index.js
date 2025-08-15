console.log('PWA 应用启动');

// TODO: 注册 Service Worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/service-worker.js')
//       .then((registration) => {
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

// 创建简单的应用界面
const app = document.getElementById('app');
if (app) {
  app.innerHTML = `
    <h1>PWA 示例应用</h1>
    <p>这是一个 Progressive Web App 示例</p>
    <button id="installBtn" style="display: none;">安装应用</button>
    <div id="status">在线状态: ${navigator.onLine ? '在线' : '离线'}</div>
  `;
}

// 监听网络状态变化
window.addEventListener('online', () => {
  document.getElementById('status').textContent = '在线状态: 在线';
});

window.addEventListener('offline', () => {
  document.getElementById('status').textContent = '在线状态: 离线';
});

// 处理应用安装
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('用户接受了安装提示');
        }
        deferredPrompt = null;
      });
    });
  }
});