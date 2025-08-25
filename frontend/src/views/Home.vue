<template>
  <div class="home-page">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            掌握现代前端工程化
            <span class="text-gradient">从这里开始</span>
          </h1>
          <p class="hero-description">
            通过关卡式学习，循序渐进地掌握 Webpack、Vite、Rollup 等现代前端构建工具。
            从基础配置到高级优化，从理论到实践，打造完整的前端工程化技能体系。
          </p>
          <div class="hero-actions">
            <BaseButton
              type="primary"
              size="lg"
              @click="startLearning"
            >
              开始学习
              <template #icon>
                <Icon name="arrow-right" />
              </template>
            </BaseButton>
            <BaseButton
              type="ghost"
              size="lg"
              @click="viewLevels"
            >
              浏览关卡
            </BaseButton>
          </div>
        </div>
        <div class="hero-visual">
          <div class="code-preview">
            <MonacoEditor
              v-model="heroCode"
              language="javascript"
              :height="300"
              :readonly="true"
              :show-toolbar="false"
              :show-status-bar="false"
              theme="vs-dark"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- 特性介绍 -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">为什么选择 ELP？</h2>
        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.id"
            class="feature-card card card-hover"
          >
            <div class="feature-icon">
              <Icon :name="feature.icon" :size="32" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 学习路径 -->
    <section class="learning-path-section">
      <div class="container">
        <h2 class="section-title">学习路径</h2>
        <div class="path-timeline">
          <div
            v-for="(step, index) in learningPath"
            :key="step.id"
            class="path-step"
            :class="{ active: index === 0 }"
          >
            <div class="step-marker">
              <span class="step-number">{{ index + 1 }}</span>
            </div>
            <div class="step-content">
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-description">{{ step.description }}</p>
              <div class="step-levels">
                <span class="levels-count">{{ step.levelCount }} 个关卡</span>
                <span class="estimated-time">预计 {{ step.estimatedTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 统计数据 -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="stat-item"
          >
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA区域 -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">准备好开始你的前端工程化之旅了吗？</h2>
          <p class="cta-description">
            加入数千名开发者的行列，通过实践学习现代前端工程化技能
          </p>
          <div class="cta-actions">
            <BaseButton
              type="primary"
              size="xl"
              @click="startLearning"
            >
              立即开始
            </BaseButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/ui/BaseButton.vue'
import Icon from '@/components/ui/Icon.vue'
import MonacoEditor from '@/components/business/MonacoEditor.vue'

const router = useRouter()
const authStore = useAuthStore()

// 英雄区域代码展示
const heroCode = ref(`// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};`)

// 特性数据
const features = ref([
  {
    id: 'hands-on',
    icon: 'code',
    title: '实战导向',
    description: '每个关卡都基于真实的工程化场景，让你在实践中掌握技能'
  },
  {
    id: 'progressive',
    icon: 'academic-cap',
    title: '循序渐进',
    description: '从基础概念到高级技巧，科学的学习路径帮你稳步提升'
  },
  {
    id: 'instant-feedback',
    icon: 'light-bulb',
    title: '即时反馈',
    description: '实时的配置验证和智能提示，让学习更高效'
  },
  {
    id: 'comprehensive',
    icon: 'book',
    title: '内容全面',
    description: '覆盖现代前端工程化的各个方面，从构建到部署一应俱全'
  },
  {
    id: 'community',
    icon: 'user',
    title: '社区支持',
    description: '活跃的学习社区，与其他开发者交流经验，共同成长'
  },
  {
    id: 'up-to-date',
    icon: 'star',
    title: '与时俱进',
    description: '紧跟前端技术发展，及时更新最新的工具和最佳实践'
  }
])

// 学习路径
const learningPath = ref([
  {
    id: 'webpack',
    title: 'Webpack 基础与进阶',
    description: '从零开始学习 Webpack，掌握模块化构建的核心技能',
    levelCount: 13,
    estimatedTime: '4-6 小时'
  },
  {
    id: 'vite',
    title: 'Vite 现代化构建',
    description: '体验 Vite 的极速开发，学习现代化的前端构建方案',
    levelCount: 10,
    estimatedTime: '3-4 小时'
  },
  {
    id: 'tools',
    title: '构建工具生态',
    description: '探索 Rollup、Parcel、ESBuild 等多种构建工具',
    levelCount: 5,
    estimatedTime: '2-3 小时'
  },
  {
    id: 'ecosystem',
    title: '工程化生态',
    description: '学习包管理、CI/CD、测试、部署等工程化实践',
    levelCount: 15,
    estimatedTime: '6-8 小时'
  }
])

// 统计数据
const stats = ref([
  { label: '学习关卡', value: '33+' },
  { label: '技术栈', value: '10+' },
  { label: '学习者', value: '1000+' },
  { label: '完成率', value: '85%' }
])

// 方法
const startLearning = () => {
  if (authStore.isAuthenticated) {
    router.push('/levels')
  } else {
    router.push('/auth/login?redirect=/levels')
  }
}

const viewLevels = () => {
  router.push('/levels')
}

// 生命周期
onMounted(() => {
  // 可以在这里添加页面统计或其他初始化逻辑
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

/* 英雄区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 0;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
}

.text-gradient {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 32px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-visual {
  position: relative;
}

.code-preview {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
  transition: transform 0.3s ease;
}

.code-preview:hover {
  transform: perspective(1000px) rotateY(-2deg) rotateX(2deg);
}

/* 特性区域 */
.features-section {
  padding: 100px 0;
  background: #fafafa;
}

.dark .features-section {
  background: #111;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 60px;
  color: #333;
}

.dark .section-title {
  color: #fff;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-card {
  padding: 40px 30px;
  text-align: center;
  background: white;
  border-radius: 16px;
}

.dark .feature-card {
  background: #1a1a1a;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  margin-bottom: 24px;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.dark .feature-title {
  color: #fff;
}

.feature-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
}

.dark .feature-description {
  color: #ccc;
}

/* 学习路径 */
.learning-path-section {
  padding: 100px 0;
}

.path-timeline {
  max-width: 800px;
  margin: 0 auto;
}

.path-step {
  display: flex;
  gap: 30px;
  margin-bottom: 50px;
  position: relative;
}

.path-step::after {
  content: '';
  position: absolute;
  left: 25px;
  top: 60px;
  width: 2px;
  height: calc(100% + 50px);
  background: #e5e5e5;
}

.dark .path-step::after {
  background: #404040;
}

.path-step:last-child::after {
  display: none;
}

.step-marker {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.path-step.active .step-marker {
  background: linear-gradient(135deg, #667eea, #764ba2);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
}

.step-content {
  flex: 1;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.dark .step-title {
  color: #fff;
}

.step-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
  margin-bottom: 16px;
}

.dark .step-description {
  color: #ccc;
}

.step-levels {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
}

.levels-count {
  color: #667eea;
  font-weight: 500;
}

.estimated-time {
  color: #999;
}

.dark .estimated-time {
  color: #666;
}

/* 统计区域 */
.stats-section {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-value {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* CTA区域 */
.cta-section {
  padding: 100px 0;
  background: #fafafa;
  text-align: center;
}

.dark .cta-section {
  background: #111;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #333;
}

.dark .cta-title {
  color: #fff;
}

.cta-description {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.dark .cta-description {
  color: #ccc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .path-step {
    flex-direction: column;
    gap: 20px;
  }
  
  .path-step::after {
    left: 25px;
    top: 70px;
    height: 30px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>