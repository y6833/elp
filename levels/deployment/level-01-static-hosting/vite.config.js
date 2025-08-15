import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // 基础路径配置 (GitHub Pages 需要)
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',
  
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 资源内联阈值
    assetsInlineLimit: 4096,
    
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    },
    
    // 生成 source map
    sourcemap: false,
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // 预览服务器配置
  preview: {
    port: 4173,
    open: true
  }
})