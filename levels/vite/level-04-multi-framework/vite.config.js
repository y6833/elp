import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// TODO: 配置多框架支持
export default defineConfig({
  plugins: [
    // TODO: 添加 React 插件支持
    // TODO: 添加 Vue 插件支持  
    // TODO: 添加 Svelte 插件支持
  ],
  
  // 构建配置
  build: {
    rollupOptions: {
      input: {
        // TODO: 配置多个入口点
        // main: 'index.html',
        // react: 'react.html',
        // vue: 'vue.html',
        // svelte: 'svelte.html'
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils'
    }
  },
  
  // CSS 预处理器配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  }
})