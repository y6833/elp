import { defineConfig } from 'vite'
import { resolve } from 'path'

// TODO: 配置库模式构建
export default defineConfig({
  build: {
    lib: {
      // TODO: 配置库的入口文件
      // entry: resolve(__dirname, 'src/index.js'),
      // name: 'MyLibrary',
      // fileName: 'my-library'
    },
    rollupOptions: {
      // TODO: 配置外部依赖
      // external: ['vue', 'react'],
      output: {
        // TODO: 配置全局变量名
        // globals: {
        //   vue: 'Vue',
        //   react: 'React'
        // }
      }
    }
  },
  
  // 开发模式配置
  server: {
    port: 3000
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})