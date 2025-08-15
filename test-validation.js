const ConfigValidator = require('./server/configValidator');
const path = require('path');

async function testValidation() {
    console.log('🧪 测试配置验证功能...\n');
    
    const validator = new ConfigValidator();
    
    // 测试正确的 webpack 配置
    const correctConfig = `
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development'
};
    `;
    
    const files = {
        'webpack.config.js': correctConfig,
        'src/index.js': 'console.log("Hello World");'
    };
    
    const levelPath = path.join(__dirname, 'levels/webpack/level-01-basic');
    
    try {
        const result = await validator.validateWebpackConfig(levelPath, correctConfig, files);
        
        if (result.success) {
            console.log('✅ 验证功能正常工作！');
            console.log('输出:', result.output);
        } else {
            console.log('❌ 验证失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 测试过程出错:', error.message);
    }
}

// 只在直接运行时执行测试
if (require.main === module) {
    testValidation();
}

module.exports = { testValidation };