const fs = require('fs');
const path = require('path');

const LEVELS_DIR = path.join(__dirname, '../levels');

function getLevels() {
  const levels = {
    webpack: [],
    vite: []
  };

  try {
    // 读取 webpack 关卡
    const webpackDir = path.join(LEVELS_DIR, 'webpack');
    if (fs.existsSync(webpackDir)) {
      levels.webpack = fs.readdirSync(webpackDir)
        .filter(dir => fs.statSync(path.join(webpackDir, dir)).isDirectory())
        .sort();
    }

    // 读取 vite 关卡
    const viteDir = path.join(LEVELS_DIR, 'vite');
    if (fs.existsSync(viteDir)) {
      levels.vite = fs.readdirSync(viteDir)
        .filter(dir => fs.statSync(path.join(viteDir, dir)).isDirectory())
        .sort();
    }
  } catch (error) {
    console.error('读取关卡目录失败:', error);
  }

  return levels;
}

function getLevelConfig(type, level) {
  const levelPath = path.join(LEVELS_DIR, type, level);
  const configPath = path.join(levelPath, 'config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`关卡配置文件不存在: ${configPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // 读取关卡文件内容
  const files = {};
  if (config.files) {
    config.files.forEach(file => {
      const filePath = path.join(levelPath, file);
      if (fs.existsSync(filePath)) {
        files[file] = fs.readFileSync(filePath, 'utf8');
      }
    });
  }

  return {
    ...config,
    files
  };
}

module.exports = {
  getLevels,
  getLevelConfig
};