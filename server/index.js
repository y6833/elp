const express = require('express');
const path = require('path');
const chalk = require('chalk');
const { getLevels, getLevelConfig } = require('./levelManager');
const ConfigValidator = require('./configValidator');
const AchievementManager = require('./achievementManager');

const app = express();
const PORT = 3000;
const validator = new ConfigValidator();
const achievementManager = new AchievementManager();

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/levels', express.static(path.join(__dirname, '../levels')));

// API 路由
app.get('/api/levels', (req, res) => {
  const levels = getLevels();
  res.json(levels);
});

app.get('/api/levels/:type/:level', (req, res) => {
  const { type, level } = req.params;
  try {
    const config = getLevelConfig(type, level);
    res.json(config);
  } catch (error) {
    res.status(404).json({ error: '关卡不存在' });
  }
});

// 配置验证 API
app.post('/api/validate/:type/:level', async (req, res) => {
  const { type, level } = req.params;
  const { config, files } = req.body;

  try {
    const levelPath = path.join(__dirname, '../levels', type, level);
    let result;

    if (type === 'webpack') {
      result = await validator.validateWebpackConfig(levelPath, config, files);
    } else if (type === 'vite') {
      result = await validator.validateViteConfig(levelPath, config, files);
    } else {
      return res.status(400).json({ error: '不支持的配置类型' });
    }

    res.json(result);
  } catch (error) {
    console.error('验证配置时出错:', error);
    res.status(500).json({ 
      success: false, 
      error: '服务器内部错误',
      type: 'system'
    });
  }
});

// 获取学习统计
app.get('/api/stats', (req, res) => {
  try {
    // 这里可以从数据库或文件中读取统计数据
    // 现在返回模拟数据
    const stats = {
      totalUsers: 1,
      totalLevels: Object.keys(getLevels().webpack || []).length + Object.keys(getLevels().vite || []).length,
      completedLevels: 0,
      averageTime: '15分钟'
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取成就信息
app.post('/api/achievements', (req, res) => {
  try {
    const { progress, levelStats } = req.body;
    const achievements = achievementManager.getAchievementProgress(progress || {}, levelStats || {});
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: '获取成就信息失败' });
  }
});

// 主页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(chalk.green('🚀 前端工程化学习平台启动成功！'));
  console.log(chalk.blue(`📖 访问地址: http://localhost:${PORT}`));
  console.log(chalk.yellow('💡 开始你的前端工程化学习之旅吧！'));
});