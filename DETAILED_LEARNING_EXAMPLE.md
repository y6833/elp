# 🎯 具体化学习体验示例

## 以 Webpack 热重载关卡为例

### 📋 任务 1：配置基础开发服务器

**你看到的问题描述：**

> 你需要启动一个本地开发服务器，让你的网页能在浏览器中运行，并且能够自动刷新。

**具体要做什么：**

1. 打开 `webpack.config.js` 文件
2. 找到 `module.exports = {` 这一行
3. 在配置对象中添加以下代码：

```javascript
devServer: {
  static: {
    directory: path.join(__dirname, 'public'),
  },
  port: 3000,
  open: true,
  compress: true,
},
```

**每个配置项的作用：**

- `static.directory`: 告诉服务器从 `public` 文件夹提供静态文件（如 index.html、图片等）
- `port: 3000`: 开发服务器运行在 3000 端口，访问地址是 http://localhost:3000
- `open: true`: 启动服务器后自动打开浏览器
- `compress: true`: 启用 gzip 压缩，让文件传输更快

**如何验证配置正确：**
运行 `npm run dev`，应该会：

1. 自动打开浏览器
2. 显示你的网页
3. 地址栏显示 http://localhost:3000

---

### 📋 任务 2：启用热模块替换(HMR)

**你看到的问题描述：**

> 现在要让代码修改后不刷新页面就能看到效果。比如修改 CSS 颜色，页面会立即变色但不会丢失表单数据。

**具体要做什么：**
在刚才的 `devServer` 配置中继续添加：

```javascript
devServer: {
  // 之前的配置...
  hot: true, // 启用热模块替换
  historyApiFallback: true, // 支持单页应用路由

  // 客户端日志级别
  client: {
    logging: 'info',
    overlay: {
      errors: true,
      warnings: false,
    },
  },

  // 监听文件变化
  watchFiles: ['src/**/*', 'public/**/*'],
},
```

**什么是热模块替换(HMR)：**

- **CSS 修改**：修改样式后，页面样式立即更新，不会刷新页面
- **JS 修改**：修改 JS 代码后，webpack 会尝试热更新模块
- **错误处理**：如果热更新失败，会自动回退到页面刷新

**如何测试 HMR 是否工作：**

1. 启动开发服务器：`npm run dev`
2. 打开 `src/styles.css`
3. 修改某个颜色值，比如把 `color: blue` 改成 `color: red`
4. 保存文件
5. 观察浏览器：页面应该立即变色，而不是整页刷新

---

### 📋 任务 3：配置 API 代理解决跨域问题

**你看到的问题描述：**

> 前端运行在 localhost:3000，后端 API 运行在 localhost:8080。直接调用会有跨域错误，需要配置代理转发请求。

**具体要做什么：**
在 `devServer` 配置中添加 `proxy` 字段：

```javascript
devServer: {
  // 之前的配置...

  // API代理配置
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: {
        '^/api': ''
      }
    }
  },
},
```

**代理是如何工作的：**

| 步骤 | 前端请求                          | 实际转发 | 说明                            |
| ---- | --------------------------------- | -------- | ------------------------------- |
| 1    | `fetch('/api/users')`             | →        | 前端发起请求                    |
| 2    | `http://localhost:3000/api/users` | →        | 请求到达 webpack-dev-server     |
| 3    | `http://localhost:8080/users`     | ←        | 代理转发到后端（去掉/api 前缀） |
| 4    | 返回数据                          | ←        | 后端响应数据                    |
| 5    | 前端收到数据                      | ✅       | 没有跨域问题！                  |

**如何测试代理是否工作：**

1. 打开浏览器控制台（F12）
2. 执行：`fetch('/api/test').then(r => r.text()).then(console.log)`
3. 如果没有跨域错误，说明代理配置成功

---

## 🎯 渐进式提示系统示例

### 第一次点击"获取提示"：

```
💡 第一个提示 - 从基础配置开始：

你需要在webpack.config.js中添加devServer配置。先试试这个基础结构：

devServer: {
  port: 3000,
  open: true
}

这会让开发服务器运行在3000端口并自动打开浏览器。
```

### 第一次提交失败后点击"获取提示"：

```
🔥 第二个提示 - 添加更多配置：

基础配置不够，你还需要：

devServer: {
  static: {
    directory: path.join(__dirname, 'public')
  },
  port: 3000,
  open: true,
  hot: true,  // 这是热重载的关键！
  compress: true
}

别忘了在文件顶部添加：const path = require('path');
```

### 第二次提交失败后点击"获取提示"：

```
🎯 第三个提示 - 完整配置模板：

看起来你需要完整的配置。复制这个模板并根据任务要求调整：

const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,

    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' }
      }
    },

    client: {
      logging: 'info',
      overlay: { errors: true, warnings: false }
    },

    watchFiles: ['src/**/*', 'public/**/*']
  }
};
```

---

## 🎉 学习效果对比

### ❌ 之前的笼统描述：

> "学习 webpack-dev-server 和热模块替换(HMR)的配置与使用"

### ✅ 现在的具体指导：

1. **明确的任务目标**：配置基础开发服务器 → 启用热重载 → 解决跨域问题
2. **具体的代码示例**：每个配置项都有完整的代码和解释
3. **实际的测试方法**：告诉你如何验证配置是否正确
4. **渐进式的帮助**：从简单提示到完整代码模板
5. **真实的应用场景**：解释为什么需要这些配置

这样的学习体验让前端小白能够：

- 知道具体要做什么
- 理解每个配置的作用
- 能够验证自己的配置
- 在遇到困难时获得恰当的帮助
- 理解配置在实际项目中的价值

---

🚀 **现在每个关卡都是这样的具体化学习体验！**
