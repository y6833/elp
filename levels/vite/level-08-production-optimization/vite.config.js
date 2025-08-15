import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// TODO: 配置生产环境优化
export default defineConfig({
  plugins: [
    react({
      // TODO: 配置 React 插件优化选项
    })
  ],
  
  // 构建优化配置
  build: {
    // TODO: 配置构建目标和兼容性
    // target: 'es2015',
    
    // TODO: 配置代码分割策略
    rollupOptions: {
      output: {
        manualChunks: {
          // TODO: 手动分割代码块
          // vendor: ['react', 'react-dom'],
          // utils: ['lodash', 'axios']
        }
      }
    },
    
    // TODO: 配置压缩和优化选项
    // minify: 'terser',
    // terserOptions: {
    //   compress: {
    //     drop_console: true,
    //     drop_debugger: true
    //   }
    // },
    
    // TODO: 配置 source map
    // sourcemap: false,
    
    // TODO: 配置资源内联阈值
    // assetsInlineLimit: 4096
  },
  
  // 预构建优化
  optimizeDeps: {
    // TODO: 配置预构建包含和排除
    // include: ['react', 'react-dom'],
    // exclude: ['@vite/client']
  },
  
  // CSS 优化
  css: {
    // TODO: 配置 CSS 代码分割
    // codeSplit: true,
    
    // TODO: 配置 PostCSS 插件
    postcss: {
      plugins: [
        // TODO: 添加 autoprefixer 等插件
      ]
    }
  },
  
  // 实验性功能
  experimental: {
    // TODO: 启用实验性优化功能
  }
})