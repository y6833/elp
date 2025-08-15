# 🚀 前端工程化学习平台

一个通过关卡式学习掌握前端工程化（Webpack/Vite）的交互式项目。通过实战配置和即时反馈，让你轻松掌握现代前端构建工具。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequests.com)

## ✨ 项目特色

### 🎯 关卡式学习系统
- **循序渐进**：从基础配置到高级优化，逐步提升技能
- **实战导向**：每个关卡都是真实的配置场景
- **即时反馈**：提交配置后立即获得验证结果和详细反馈

### 🧠 智能提示系统
- **上下文感知**：根据配置内容提供针对性建议
- **错误诊断**：详细的错误信息和修复建议
- **学习引导**：适时的提示帮助理解配置原理

### 📊 进度管理
- **学习统计**：实时显示学习进度和完成情况
- **成就系统**：解锁各种学习成就，激励持续学习
- **时间跟踪**：记录学习时间，了解学习效率

### 🔧 真实验证
- **语法检查**：验证配置文件语法正确性
- **构建测试**：实际运行构建流程验证配置
- **最佳实践**：基于官方推荐的配置模式

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装和启动

```bash
# 克隆项目
git clone https://github.com/y6833/elp.git
cd elp

# 安装依赖
npm install

# 启动学习平台
npm start

# 访问应用
# 打开浏览器访问 http://localhost:3001
```

### 其他命令

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 仅启动服务器
npm run server
```

## 📚 学习路径

### 🔧 Webpack 学习关卡（5个关卡）

| 关卡 | 名称 | 难度 | 预估时间 | 学习内容 |
|------|------|------|----------|----------|
| 1 | 基础配置 | 入门 | 10分钟 | entry、output、mode 配置 |
| 2 | 加载器配置 | 入门 | 15分钟 | CSS、图片等资源处理 |
| 3 | 插件系统 | 中级 | 20分钟 | HtmlWebpackPlugin、CleanWebpackPlugin |
| 4 | 代码分割 | 高级 | 25分钟 | splitChunks、懒加载优化 |
| 5 | 性能优化 | 专家 | 30分钟 | 缓存、Tree Shaking、externals |

### ⚡ Vite 学习关卡（3个关卡）

| 关卡 | 名称 | 难度 | 预估时间 | 学习内容 |
|------|------|------|----------|----------|
| 1 | 基础配置 | 入门 | 8分钟 | 开发服务器、构建配置 |
| 2 | 插件生态 | 中级 | 15分钟 | Vite 插件使用和配置 |
| 3 | 构建优化 | 高级 | 20分钟 | 生产环境优化配置 |

## 🏗️ 项目架构

```
elp/
├── 📁 public/              # 前端静态资源
│   ├── index.html          # 主页面
│   ├── app.js             # 前端逻辑
│   └── styles.css         # 样式文件
├── 📁 server/              # 后端服务
│   ├── index.js           # 服务器入口
│   ├── configValidator.js # 配置验证器
│   ├── progressManager.js # 进度管理
│   ├── levelManager.js    # 关卡管理
│   └── hintSystem.js      # 提示系统
├── 📁 levels/              # 学习关卡
│   ├── 📁 webpack/         # Webpack 关卡
│   │   ├── level-01-basic/
│   │   ├── level-02-loaders/
│   │   ├── level-03-plugins/
│   │   ├── level-04-optimization/
│   │   └── level-05-performance/
│   └── 📁 vite/           # Vite 关卡
│       ├── level-01-basic/
│       ├── level-02-plugins/
│       └── level-03-build/
├── 📁 data/               # 用户数据存储
├── 📁 scripts/            # 构建脚本
├── package.json
├── README.md
├── USER_GUIDE.md          # 用户使用指南
└── deploy.md              # 部署指南
```

## 🎯 核心功能

### 🔍 配置验证系统
- **实时验证**：提交配置后立即进行语法和逻辑检查
- **构建测试**：实际运行 webpack/vite 验证配置可行性
- **错误诊断**：提供详细的错误信息和修复建议

### 💡 智能提示引擎
- **动态提示**：根据当前配置内容生成相关提示
- **示例代码**：每个提示都包含可参考的代码示例
- **学习引导**：帮助理解配置项的作用和最佳实践

### 📈 学习分析
- **进度跟踪**：实时显示各技术栈的学习进度
- **时间统计**：记录和分析学习时间分布
- **成就系统**：通过解锁成就激励持续学习

## 🛠️ 技术栈

### 前端技术
- **原生 JavaScript**：无框架依赖，轻量高效
- **CSS3**：现代化的响应式设计
- **CodeMirror**：专业的代码编辑器

### 后端技术
- **Node.js**：服务器运行环境
- **Express.js**：Web 框架
- **文件系统**：轻量级数据存储

### 构建工具
- **Webpack 5**：用于验证 webpack 配置
- **Vite 4**：用于验证 vite 配置
- **Babel**：JavaScript 编译器

## 📖 使用指南

### 🎓 学习建议
1. **按顺序学习**：建议按关卡顺序逐步学习
2. **理解原理**：不要只是复制代码，要理解每个配置的作用
3. **实践应用**：在实际项目中应用所学知识
4. **查阅文档**：结合官方文档深入学习

### 🔧 功能使用
- **智能提示**：遇到困难时点击"💡 获取提示"
- **配置验证**：完成配置后点击"运行配置"进行验证
- **进度查看**：在统计页面查看详细的学习数据
- **成就解锁**：在成就页面查看学习成果

详细使用说明请参考 [用户使用指南](USER_GUIDE.md)

## 🚀 部署指南

### 本地部署
```bash
npm start
```

### 生产部署
```bash
# 使用 PM2
npm install -g pm2
pm2 start server/index.js --name elp

# 使用 Docker
docker build -t elp .
docker run -p 3001:3001 elp
```

详细部署说明请参考 [部署指南](deploy.md)

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 贡献方式
- 🐛 **报告 Bug**：发现问题请提交 Issue
- 💡 **功能建议**：有好的想法请分享
- 📝 **改进文档**：帮助完善文档内容
- 🔧 **代码贡献**：提交 Pull Request

### 开发流程
1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Webpack](https://webpack.js.org/) - 强大的模块打包工具
- [Vite](https://vitejs.dev/) - 快速的前端构建工具
- [Express.js](https://expressjs.com/) - 简洁的 Web 框架
- [CodeMirror](https://codemirror.net/) - 优秀的代码编辑器

## 📞 联系我们

- **项目地址**：https://github.com/y6833/elp
- **问题反馈**：https://github.com/y6833/elp/issues
- **讨论交流**：https://github.com/y6833/elp/discussions

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！