const fs = require('fs');
const path = require('path');

const LEVELS_DIR = path.join(__dirname, '../levels');

function getLevels() {
  const levels = {};

  try {
    // 读取所有关卡分类目录
    const categories = fs.readdirSync(LEVELS_DIR)
      .filter(dir => fs.statSync(path.join(LEVELS_DIR, dir)).isDirectory());

    categories.forEach(category => {
      const categoryDir = path.join(LEVELS_DIR, category);
      levels[category] = fs.readdirSync(categoryDir)
        .filter(dir => fs.statSync(path.join(categoryDir, dir)).isDirectory())
        .sort();
    });

    console.log('已加载关卡分类:', Object.keys(levels));
    console.log('关卡详情:', levels);
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
      // 处理两种格式：字符串数组（旧格式）和对象数组（新格式）
      const fileName = typeof file === 'string' ? file : file.name;
      const filePath = path.join(levelPath, fileName);
      if (fs.existsSync(filePath)) {
        files[fileName] = fs.readFileSync(filePath, 'utf8');
      }
      // 移除警告日志，减少控制台输出
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