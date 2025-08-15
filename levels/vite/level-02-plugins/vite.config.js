import { defineConfig } from 'vite';
// TODO: 导入需要的插件
// import react from '@vitejs/plugin-react';
// import eslint from 'vite-plugin-eslint';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // TODO: 配置插件
  plugins: [
    // TODO: 添加 React 插件
    
    // TODO: 添加 ESLint 插件
    
    // TODO: 添加打包分析插件
  ],
  
  server: {
    port: 3000,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    
    // 构建优化
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  }
});