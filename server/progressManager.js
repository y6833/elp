const fs = require('fs');
const path = require('path');

class ProgressManager {
  constructor() {
    this.progressFile = path.join(__dirname, '../data/progress.json');
    this.ensureDataDir();
  }

  ensureDataDir() {
    const dataDir = path.dirname(this.progressFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // 获取用户进度
  getUserProgress(userId = 'default') {
    try {
      if (!fs.existsSync(this.progressFile)) {
        return this.createDefaultProgress();
      }

      const data = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
      return data[userId] || this.createDefaultProgress();
    } catch (error) {
      console.error('读取进度失败:', error);
      return this.createDefaultProgress();
    }
  }

  // 保存用户进度
  saveUserProgress(userId = 'default', progress) {
    try {
      let data = {};
      if (fs.existsSync(this.progressFile)) {
        data = JSON.parse(fs.readFileSync(this.progressFile, 'utf8'));
      }

      data[userId] = {
        ...data[userId],
        ...progress,
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(this.progressFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('保存进度失败:', error);
      return false;
    }
  }

  // 标记关卡完成
  markLevelCompleted(userId = 'default', type, levelId, config) {
    const progress = this.getUserProgress(userId);
    
    if (!progress.completed) {
      progress.completed = {};
    }
    
    if (!progress.completed[type]) {
      progress.completed[type] = {};
    }

    progress.completed[type][levelId] = {
      completedAt: new Date().toISOString(),
      config: config,
      attempts: (progress.completed[type][levelId]?.attempts || 0) + 1
    };

    // 更新总体统计
    progress.stats = this.calculateStats(progress);

    return this.saveUserProgress(userId, progress);
  }

  // 获取学习统计
  calculateStats(progress) {
    const completed = progress.completed || {};
    let totalCompleted = 0;
    let totalLevels = 0;

    // 计算 webpack 关卡
    const webpackLevels = ['level-01-basic', 'level-02-loaders', 'level-03-plugins', 'level-04-optimization', 'level-05-performance'];
    const viteLevels = ['level-01-basic', 'level-02-plugins', 'level-03-build'];

    totalLevels = webpackLevels.length + viteLevels.length;

    if (completed.webpack) {
      totalCompleted += Object.keys(completed.webpack).length;
    }
    if (completed.vite) {
      totalCompleted += Object.keys(completed.vite).length;
    }

    return {
      totalLevels,
      totalCompleted,
      completionRate: Math.round((totalCompleted / totalLevels) * 100),
      webpackProgress: completed.webpack ? Object.keys(completed.webpack).length : 0,
      viteProgress: completed.vite ? Object.keys(completed.vite).length : 0
    };
  }

  // 创建默认进度
  createDefaultProgress() {
    return {
      completed: {},
      stats: {
        totalLevels: 8,
        totalCompleted: 0,
        completionRate: 0,
        webpackProgress: 0,
        viteProgress: 0
      },
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  // 获取学习建议
  getLearningRecommendations(userId = 'default') {
    const progress = this.getUserProgress(userId);
    const recommendations = [];

    // 基于完成情况给出建议
    if (progress.stats.totalCompleted === 0) {
      recommendations.push({
        type: 'start',
        title: '开始学习之旅',
        description: '建议从 Webpack 基础配置开始，逐步掌握前端工程化技能。',
        action: 'webpack/level-01-basic'
      });
    } else if (progress.stats.webpackProgress < 3) {
      recommendations.push({
        type: 'continue',
        title: '继续 Webpack 学习',
        description: '继续完成 Webpack 的基础关卡，建立扎实的基础。',
        action: `webpack/level-0${progress.stats.webpackProgress + 1}-*`
      });
    } else if (progress.stats.viteProgress === 0) {
      recommendations.push({
        type: 'explore',
        title: '探索 Vite',
        description: '你已经掌握了 Webpack 基础，现在可以学习现代化的 Vite 构建工具。',
        action: 'vite/level-01-basic'
      });
    } else {
      recommendations.push({
        type: 'advanced',
        title: '深入学习',
        description: '继续学习高级特性，成为前端工程化专家。',
        action: 'advanced-topics'
      });
    }

    return recommendations;
  }
}

module.exports = ProgressManager;