import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    
    // 自动导入组合式API
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core'
      ],
      dts: true,
      dirs: [
        'src/composables',
        'src/stores'
      ],
      vueTemplate: true
    }),
    
    // 自动导入组件
    Components({
      resolvers: [NaiveUiResolver()],
      dts: true,
      dirs: ['src/components']
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    }
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  
  build: {
    target: 'esnext',
    outDir: '../dist/frontend',
    
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心依赖
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          
          // UI库
          'ui-vendor': ['naive-ui'],
          
          // 工具库
          'utils-vendor': ['@vueuse/core', 'lodash-es', 'axios'],
          
          // 代码编辑器 (较大的依赖单独分离)
          'monaco-editor': ['monaco-editor', '@monaco-editor/loader'],
          
          // 图表库
          'charts-vendor': ['echarts', 'vue-echarts']
        }
      }
    },
    
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // 测试配置
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts']
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      '@vueuse/core',
      'naive-ui',
      'monaco-editor'
    ]
  }
})