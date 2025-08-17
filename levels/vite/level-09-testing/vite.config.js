import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // 测试配置
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.js'
      ]
    },
    
    // 测试文件匹配模式
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    
    // 监听模式配置
    watch: false,
    
    // 并发测试
    threads: true,
    
    // 测试超时
    testTimeout: 10000,
  },
  
  // 构建配置
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          testing: ['@testing-library/react', '@testing-library/jest-dom']
        }
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true
  }
})