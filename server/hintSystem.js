class HintSystem {
  constructor() {
    this.hints = {
      webpack: {
        'level-01-basic': [
          {
            trigger: 'entry',
            message: '💡 entry 是 webpack 开始构建的入口点，通常指向你的主 JavaScript 文件。',
            example: "entry: './src/index.js'"
          },
          {
            trigger: 'output',
            message: '📁 output 配置告诉 webpack 在哪里输出它所创建的 bundles。',
            example: "output: {\n  path: path.resolve(__dirname, 'dist'),\n  filename: 'bundle.js'\n}"
          },
          {
            trigger: 'mode',
            message: '⚙️ mode 设置为 development 会启用有用的开发工具。',
            example: "mode: 'development'"
          }
        ],
        'level-02-loaders': [
          {
            trigger: 'css-loader',
            message: '🎨 css-loader 解析 CSS 文件中的 @import 和 url()，需要配合 style-loader 使用。',
            example: "use: ['style-loader', 'css-loader']"
          },
          {
            trigger: 'file-loader',
            message: '🖼️ file-loader 将文件输出到输出目录并返回 public URL。',
            example: "use: ['file-loader']"
          },
          {
            trigger: 'test',
            message: '🔍 test 属性用正则表达式匹配文件，决定哪些文件使用这个 loader。',
            example: "test: /\\.css$/"
          }
        ],
        'level-03-plugins': [
          {
            trigger: 'HtmlWebpackPlugin',
            message: '📄 HtmlWebpackPlugin 自动生成 HTML 文件并注入所有生成的 bundle。',
            example: "new HtmlWebpackPlugin({\n  template: './src/template.html'\n})"
          },
          {
            trigger: 'CleanWebpackPlugin',
            message: '🧹 CleanWebpackPlugin 在每次构建前清理输出目录。',
            example: "new CleanWebpackPlugin()"
          }
        ],
        'level-04-optimization': [
          {
            trigger: 'splitChunks',
            message: '📦 splitChunks 可以将代码分割成多个 chunk，提高缓存效率。',
            example: "splitChunks: {\n  chunks: 'all'\n}"
          },
          {
            trigger: 'runtimeChunk',
            message: '⚡ runtimeChunk 将运行时代码分离到单独的文件中。',
            example: "runtimeChunk: 'single'"
          }
        ],
        'level-05-performance': [
          {
            trigger: 'cache',
            message: '💾 启用持久化缓存可以显著提升重复构建的速度。',
            example: "cache: {\n  type: 'filesystem'\n}"
          },
          {
            trigger: 'resolve.alias',
            message: '🔗 alias 可以创建模块别名，简化导入路径并加快解析速度。',
            example: "resolve: {\n  alias: {\n    '@': path.resolve(__dirname, 'src')\n  }\n}"
          }
        ]
      },
      vite: {
        'level-01-basic': [
          {
            trigger: 'server',
            message: '🚀 Vite 的开发服务器配置，可以设置端口、代理等选项。',
            example: "server: {\n  port: 3000\n}"
          },
          {
            trigger: 'build',
            message: '🏗️ build 配置控制生产环境构建的行为。',
            example: "build: {\n  outDir: 'build'\n}"
          }
        ]
      }
    };
  }

  // 根据用户输入获取相关提示
  getHintsForInput(type, level, userInput) {
    const levelHints = this.hints[type]?.[level] || [];
    const relevantHints = [];

    levelHints.forEach(hint => {
      if (userInput.toLowerCase().includes(hint.trigger.toLowerCase())) {
        relevantHints.push(hint);
      }
    });

    return relevantHints;
  }

  // 获取关卡的所有提示
  getAllHintsForLevel(type, level) {
    return this.hints[type]?.[level] || [];
  }

  // 根据错误类型获取提示
  getHintForError(errorType, errorMessage) {
    const errorHints = {
      'syntax': [
        {
          message: '🔧 检查语法错误：确保所有的括号、引号都正确匹配。',
          example: '常见错误：缺少逗号、括号不匹配、引号未闭合'
        }
      ],
      'config': [
        {
          message: '⚙️ 配置不完整：请检查是否遗漏了必需的配置项。',
          example: '确保 entry、output、mode 等基本配置都已设置'
        }
      ],
      'build': [
        {
          message: '🚨 构建失败：通常是因为配置错误或依赖问题。',
          example: '检查模块路径、loader 配置是否正确'
        }
      ]
    };

    return errorHints[errorType] || [];
  }

  // 获取智能建议
  getSmartSuggestions(type, level, userInput, errorType) {
    const suggestions = [];

    // 基于关卡的建议
    const levelHints = this.getHintsForInput(type, level, userInput);
    suggestions.push(...levelHints);

    // 基于错误的建议
    if (errorType) {
      const errorHints = this.getHintForError(errorType);
      suggestions.push(...errorHints);
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push({
        message: '💭 需要帮助？查看关卡说明或参考官方文档。',
        example: '每个关卡都有详细的任务说明和提示'
      });
    }

    return suggestions;
  }
}

module.exports = HintSystem;