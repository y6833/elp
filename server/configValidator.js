const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ConfigValidator {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async validateWebpackConfig(levelPath, userConfig, files) {
    try {
      // 创建临时项目目录
      const tempProjectDir = path.join(this.tempDir, `webpack-${Date.now()}`);
      fs.mkdirSync(tempProjectDir, { recursive: true });

      // 写入用户配置
      fs.writeFileSync(
        path.join(tempProjectDir, 'webpack.config.js'),
        userConfig
      );

      // 复制其他必要文件
      Object.entries(files).forEach(([filename, content]) => {
        if (filename !== 'webpack.config.js') {
          const filePath = path.join(tempProjectDir, filename);
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content);
        }
      });

      // 创建基础 package.json
      const packageJson = {
        name: 'temp-webpack-project',
        version: '1.0.0',
        scripts: {
          build: 'webpack --mode=development'
        }
      };
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // 验证配置语法
      const syntaxCheck = this.checkConfigSyntax(tempProjectDir);
      if (!syntaxCheck.valid) {
        return {
          success: false,
          error: syntaxCheck.error,
          type: 'syntax'
        };
      }

      // 验证配置内容
      const contentCheck = this.checkWebpackConfigContent(userConfig, levelPath);
      if (!contentCheck.valid) {
        return {
          success: false,
          error: contentCheck.error,
          type: 'config',
          hints: contentCheck.hints
        };
      }

      // 尝试运行 webpack（干运行）
      const buildCheck = await this.tryWebpackBuild(tempProjectDir);
      
      // 清理临时文件
      this.cleanupTemp(tempProjectDir);

      return {
        success: buildCheck.success,
        output: buildCheck.output,
        error: buildCheck.error,
        type: buildCheck.success ? 'success' : 'build'
      };

    } catch (error) {
      return {
        success: false,
        error: `验证过程出错: ${error.message}`,
        type: 'system'
      };
    }
  }

  checkConfigSyntax(projectDir) {
    try {
      const configPath = path.join(projectDir, 'webpack.config.js');
      require(configPath);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `配置文件语法错误: ${error.message}`
      };
    }
  }

  checkWebpackConfigContent(userConfig, levelPath) {
    // 读取关卡的验证规则
    const levelConfigPath = path.join(levelPath, 'config.json');
    let levelConfig = {};
    
    try {
      levelConfig = JSON.parse(fs.readFileSync(levelConfigPath, 'utf8'));
    } catch (error) {
      return { valid: true }; // 如果没有验证规则，默认通过
    }

    const validation = levelConfig.validation || {};
    const hints = [];

    // 检查必需的配置项
    if (validation.required) {
      for (const requirement of validation.required) {
        if (!userConfig.includes(requirement.key)) {
          return {
            valid: false,
            error: requirement.message || `缺少必需配置: ${requirement.key}`,
            hints: requirement.hints || []
          };
        }
      }
    }

    // 检查禁止的配置项
    if (validation.forbidden) {
      for (const forbidden of validation.forbidden) {
        if (userConfig.includes(forbidden.key)) {
          return {
            valid: false,
            error: forbidden.message || `不应包含配置: ${forbidden.key}`,
            hints: forbidden.hints || []
          };
        }
      }
    }

    // 检查特定模式
    if (validation.patterns) {
      for (const pattern of validation.patterns) {
        const regex = new RegExp(pattern.regex);
        if (!regex.test(userConfig)) {
          hints.push(pattern.hint || `建议检查: ${pattern.description}`);
        }
      }
    }

    return { valid: true, hints };
  }

  async tryWebpackBuild(projectDir) {
    try {
      // 使用 --dry-run 模式进行验证（如果支持）
      const output = execSync('npx webpack --mode=development --stats=minimal', {
        cwd: projectDir,
        timeout: 10000,
        encoding: 'utf8'
      });

      return {
        success: true,
        output: `✅ 配置验证成功！\n\n构建输出:\n${output}`
      };
    } catch (error) {
      return {
        success: false,
        error: `构建失败: ${error.message}`,
        output: error.stdout || error.stderr || ''
      };
    }
  }

  async validateViteConfig(levelPath, userConfig, files) {
    try {
      const tempProjectDir = path.join(this.tempDir, `vite-${Date.now()}`);
      fs.mkdirSync(tempProjectDir, { recursive: true });

      // 写入配置文件
      fs.writeFileSync(
        path.join(tempProjectDir, 'vite.config.js'),
        userConfig
      );

      // 复制其他文件
      Object.entries(files).forEach(([filename, content]) => {
        if (filename !== 'vite.config.js') {
          const filePath = path.join(tempProjectDir, filename);
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, content);
        }
      });

      // 创建 package.json
      const packageJson = {
        name: 'temp-vite-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          build: 'vite build'
        }
      };
      fs.writeFileSync(
        path.join(tempProjectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // 验证配置
      const syntaxCheck = this.checkViteConfigSyntax(tempProjectDir);
      if (!syntaxCheck.valid) {
        this.cleanupTemp(tempProjectDir);
        return {
          success: false,
          error: syntaxCheck.error,
          type: 'syntax'
        };
      }

      const contentCheck = this.checkViteConfigContent(userConfig, levelPath);
      
      this.cleanupTemp(tempProjectDir);

      return {
        success: contentCheck.valid,
        error: contentCheck.error,
        hints: contentCheck.hints,
        output: contentCheck.valid ? '✅ Vite 配置验证成功！' : undefined,
        type: contentCheck.valid ? 'success' : 'config'
      };

    } catch (error) {
      return {
        success: false,
        error: `验证过程出错: ${error.message}`,
        type: 'system'
      };
    }
  }

  checkViteConfigSyntax(projectDir) {
    try {
      const configPath = path.join(projectDir, 'vite.config.js');
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // 简单的语法检查
      if (!configContent.includes('defineConfig') && !configContent.includes('export default')) {
        return {
          valid: false,
          error: 'Vite 配置文件应该导出配置对象或使用 defineConfig'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `配置文件语法错误: ${error.message}`
      };
    }
  }

  checkViteConfigContent(userConfig, levelPath) {
    const levelConfigPath = path.join(levelPath, 'config.json');
    let levelConfig = {};
    
    try {
      levelConfig = JSON.parse(fs.readFileSync(levelConfigPath, 'utf8'));
    } catch (error) {
      return { valid: true };
    }

    const validation = levelConfig.validation || {};
    const hints = [];

    if (validation.required) {
      for (const requirement of validation.required) {
        if (!userConfig.includes(requirement.key)) {
          return {
            valid: false,
            error: requirement.message || `缺少必需配置: ${requirement.key}`,
            hints: requirement.hints || []
          };
        }
      }
    }

    return { valid: true, hints };
  }

  cleanupTemp(dir) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('清理临时文件失败:', error.message);
    }
  }

  async validateGenericConfig(levelPath, userConfig, files) {
    try {
      // 对于非 webpack/vite 类型的关卡，提供基本的配置验证
      console.log('验证通用配置:', levelPath);
      
      // 读取关卡配置
      const configPath = path.join(levelPath, 'config.json');
      if (!fs.existsSync(configPath)) {
        return {
          success: false,
          message: '关卡配置文件不存在'
        };
      }
      
      const levelConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // 基本的语法检查
      if (!userConfig || userConfig.trim() === '') {
        return {
          success: false,
          message: '配置不能为空'
        };
      }
      
      // 尝试解析配置文件（如果是 JSON 格式）
      if (userConfig.trim().startsWith('{')) {
        try {
          JSON.parse(userConfig);
        } catch (error) {
          return {
            success: false,
            message: `JSON 格式错误: ${error.message}`
          };
        }
      }
      
      // 检查是否包含必要的关键词（如果配置中有定义）
      if (levelConfig.validation && levelConfig.validation.required) {
        const missingItems = [];
        levelConfig.validation.required.forEach(item => {
          if (!userConfig.includes(item.key)) {
            missingItems.push(item.message || `缺少配置: ${item.key}`);
          }
        });
        
        if (missingItems.length > 0) {
          return {
            success: false,
            message: '配置不完整',
            details: missingItems
          };
        }
      }
      
      return {
        success: true,
        message: '配置验证通过！',
        details: ['基本配置检查通过']
      };
      
    } catch (error) {
      console.error('通用配置验证失败:', error);
      return {
        success: false,
        message: `验证失败: ${error.message}`
      };
    }
  }
}

module.exports = ConfigValidator;