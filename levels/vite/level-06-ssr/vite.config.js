import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: 配置 SSR 支持
export default defineConfig({
  plugins: [react()],
  
  // SSR 构建配置
  build: {
    rollupOptions: {
      // TODO: 配置客户端和服务端入口
      // input: {
      //   client: 'src/entry-client.jsx',
      //   server: 'src/entry-server.jsx'
      // }
    }
  },
  
  // SSR 选项
  ssr: {
    // TODO: 配置 SSR 外部依赖
    // noExternal: ['react', 'react-dom']
  },
  
  // 开发服务器配置
  server: {
    middlewareMode: true
  },
  
  // 优化配置
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})