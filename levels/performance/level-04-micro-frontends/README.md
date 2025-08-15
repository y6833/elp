# 微前端架构关卡

## 学习目标

通过本关卡，你将学会：
- 理解微前端架构的核心概念和优势
- 使用 Webpack Module Federation 实现微前端
- 配置远程模块的暴露和消费
- 掌握微前端应用的独立开发和部署

## 任务说明

你需要完成两个应用的 Module Federation 配置：

### 1. 远程应用 (Remote) 配置
在 `remote/webpack.config.js` 中：
- 配置 `exposes` 字段，暴露 `./Button` 组件
- 设置正确的应用名称和文件名

### 2. 主应用 (Host) 配置  
在 `host/webpack.config.js` 中：
- 配置 `remotes` 字段，消费远程应用的组件
- 设置正确的远程应用地址

### 3. 组件使用
在 `host/src/index.js` 中：
- 使用动态导入加载远程组件
- 使用 React.Suspense 处理加载状态

## 配置要点

### 远程应用配置示例：
```javascript
exposes: {
  './Button': './src/Button'
}
```

### 主应用配置示例：
```javascript
remotes: {
  remote: 'remote@http://localhost:3002/remoteEntry.js'
}
```

### 组件使用示例：
```javascript
const RemoteButton = React.lazy(() => import('remote/Button'));
```

## 验证方式

1. 远程应用能够独立运行在 3002 端口
2. 主应用能够成功加载远程组件
3. 两个应用都能正确构建并生成 remoteEntry.js

## 微前端优势

- **独立开发**: 不同团队可以独立开发和部署
- **技术栈自由**: 每个应用可以使用不同的技术栈
- **渐进升级**: 可以逐步迁移和升级应用
- **故障隔离**: 单个应用的问题不会影响整体

## 注意事项

- 确保共享依赖的版本兼容性
- 注意跨域和安全问题
- 合理设计应用间的通信机制
- 考虑应用的加载性能和用户体验