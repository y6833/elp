const fs = require('fs');
const path = require('path');

const PROGRESS_DIR = path.join(__dirname, '../data/progress');

// 确保进度目录存在
if (!fs.existsSync(PROGRESS_DIR)) {
  fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

class ProgressManager {
  constructor() {
    this.progressFile = path.join(PROGRESS_DIR, 'user-progress.json');
    this.loadProgress();
  }

  loadProgress() {
    try {
      if (fs.existsSync(this.progressFile)) {
        const data = fs.readFileSync(this.progressFile, 'utf8');
        this.progress = JSON.parse(data);
      } else {
        this.progress = {};
      }
    } catch (error) {
      console.error('加载进度失败:', error);
      this.progress = {};
    }
  }

  saveProgress() {
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  updateLevelProgress(userId, type, level, data) {
    if (!this.progress[userId]) {
      this.progress[userId] = {};
    }
    
    if (!this.progress[userId][type]) {
      this.progress[userId][type] = {};
    }
    
    this.progress[userId][type][level] = {
      ...this.progress[userId][type][level],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.saveProgress();
  }

  getUserProgress(userId) {
    return this.progress[userId] || {};
  }

  getLevelProgress(userId, type, level) {
    return this.progress[userId]?.[type]?.[level] || {};
  }

  getOverallStats() {
    const stats = {
      totalUsers: Object.keys(this.progress).length,
      completedLevels: 0,
      popularLevels: {}
    };

    Object.values(this.progress).forEach(userProgress => {
      Object.values(userProgress).forEach(typeProgress => {
        Object.entries(typeProgress).forEach(([level, data]) => {
          if (data.completed) {
            stats.completedLevels++;
          }
          
          if (!stats.popularLevels[level]) {
            stats.popularLevels[level] = 0;
          }
          stats.popularLevels[level]++;
        });
      });
    });

    return stats;
  }
}

module.exports = new ProgressManager();