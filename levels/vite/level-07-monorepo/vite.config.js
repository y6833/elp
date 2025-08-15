import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// TODO: 配置 Monorepo 支持
export default defineConfig({
  plugins: [react()],
  
  // 路径解析配置
  resolve: {
    alias: {
      // TODO: 配置包别名
      // '@shared/ui': resolve(__dirname, '../shared/ui/src'),
      // '@shared/utils': resolve(__dirname, '../shared/utils/src'),
      // '@shared/types': resolve(__dirname, '../shared/types/src')
    }
  },
  
  // 优化依赖配置
  optimizeDeps: {
    // TODO: 包含 monorepo 内的包
    // include: ['@shared/ui', '@shared/utils']
  },
  
  // 构建配置
  build: {
    rollupOptions: {
      external: [
        // TODO: 排除内部包作为外部依赖
        // '@shared/ui',
        // '@shared/utils'
      ]
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    fs: {
      // TODO: 允许访问 monorepo 根目录
      // allow: ['..']
    }
  }
})