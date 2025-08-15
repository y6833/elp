class HintSystem {
    constructor() {
        this.hints = {
            'webpack-basic': [
                {
                    trigger: 'entry',
                    message: '💡 entry 是 webpack 开始构建的入口点，通常指向你的主 JavaScript 文件',
                    code: `entry: './src/index.js'`
                },
                {
                    trigger: 'output',
                    message: '📁 output 配置告诉 webpack 在哪里输出构建后的文件',
                    code: `output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'bundle.js'
}`
                },
                {
                    trigger: 'mode',
                    message: '⚙️ mode 设置构建模式，development 用于开发，production 用于生产',
                    code: `mode: 'development'`
                }
            ],
            'webpack-loaders': [
                {
                    trigger: 'css-loader',
                    message: '🎨 css-loader 解析 CSS 文件，style-loader 将样式注入到 DOM',
                    code: `{
  test: /\\.css$/,
  use: ['style-loader', 'css-loader']
}`
                },
                {
                    trigger: 'file-loader',
                    message: '🖼️ file-loader 处理文件资源，将它们复制到输出目录',
                    code: `{
  test: /\\.(png|jpg|gif)$/,
  use: ['file-loader']
}`
                }
            ],
            'common-errors': [
                {
                    error: 'Module not found',
                    solution: '检查文件路径是否正确，确保文件存在',
                    example: '确保 ./src/index.js 文件存在'
                },
                {
                    error: 'Cannot resolve loader',
                    solution: '确保已安装相应的 loader',
                    example: 'npm install css-loader style-loader --save-dev'
                }
            ]
        };
        
        this.codeTemplates = {
            'webpack-basic': `const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development'
};`,
            'webpack-loaders': `const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\\.(png|jpg|gif)$/,
        use: ['file-loader']
      }
    ]
  }
};`
        };
    }

    getHints(levelType, userCode) {
        const levelHints = this.hints[levelType] || [];
        const relevantHints = [];
        
        levelHints.forEach(hint => {
            if (!userCode.includes(hint.trigger)) {
                relevantHints.push(hint);
            }
        });
        
        return relevantHints;
    }

    getTemplate(levelType) {
        return this.codeTemplates[levelType] || '';
    }

    analyzeError(error) {
        const commonErrors = this.hints['common-errors'];
        
        for (const errorInfo of commonErrors) {
            if (error.toLowerCase().includes(errorInfo.error.toLowerCase())) {
                return {
                    solution: errorInfo.solution,
                    example: errorInfo.example
                };
            }
        }
        
        return null;
    }
}

module.exports = HintSystem;