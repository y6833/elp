import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

// 样式导入
import './assets/styles/main.css'

// 国际化配置
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

// 创建Pinia实例
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 创建Vue应用实例
const app = createApp(App)

// 安装插件
app.use(pinia)
app.use(router)
app.use(i18n)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', vm)
  console.error('Info:', info)
  
  // 这里可以集成错误监控服务
  // 例如: Sentry.captureException(err)
}

// 挂载应用
app.mount('#app')