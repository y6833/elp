import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import Redis from 'redis'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/index.js'
import { logger } from './utils/logger.js'
import { errorHandler } from './utils/errorHandler.js'
import { authRoutes } from './routes/auth.js'
import { levelRoutes } from './routes/levels.js'
import { userRoutes } from './routes/users.js'
import { progressRoutes } from './routes/progress.js'
import { achievementRoutes } from './routes/achievements.js'
import { communityRoutes } from './routes/community.js'
import { adminRoutes } from './routes/admin.js'
import { registerAIAssistantRoutes } from './services/ai-assistant.js'
import { registerAdaptiveDifficultyRoutes } from './services/adaptive-difficulty.js'
import { registerProgressAnalyticsRoutes } from './services/progress-analytics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建Fastify实例
export const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
}).withTypeProvider<TypeBoxTypeProvider>()

// 数据库连接
export const prisma = new PrismaClient({
  log: config.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
})

// Redis连接
export const redis = Redis.createClient({
  url: config.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
})

// 全局错误处理
fastify.setErrorHandler(errorHandler)

// 注册插件
async function registerPlugins() {
  // 安全相关
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  })

  // CORS配置
  await fastify.register(fastifyCors, {
    origin: config.NODE_ENV === 'production' 
      ? [config.FRONTEND_URL] 
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })

  // 速率限制
  await fastify.register(fastifyRateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    skipOnError: true,
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`
    })
  })

  // JWT认证
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    cookie: {
      cookieName: 'token',
      signed: false
    },
    sign: {
      expiresIn: config.JWT_EXPIRES_IN
    }
  })

  // Cookie支持
  await fastify.register(fastifyCookie, {
    secret: config.COOKIE_SECRET
  })

  // 文件上传
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5
    }
  })

  // 静态文件服务
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/'
  })

  // API文档
  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'ELP API',
        description: 'ELP 前端工程化学习平台 API 文档',
        version: '2.0.0'
      },
      host: config.API_HOST,
      schemes: [config.NODE_ENV === 'production' ? 'https' : 'http'],
      consumes: ['application/json', 'multipart/form-data'],
      produces: ['application/json'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description: 'Bearer JWT token'
        }
      }
    }
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })
}

// 注册路由
async function registerRoutes() {
  // API路由前缀
  await fastify.register(async function (fastify) {
    // 健康检查
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '2.0.0',
        environment: config.NODE_ENV
      }
    })

    // 认证路由
    await fastify.register(authRoutes, { prefix: '/auth' })
    
    // 用户路由
    await fastify.register(userRoutes, { prefix: '/users' })
    
    // 关卡路由
    await fastify.register(levelRoutes, { prefix: '/levels' })
    
    // 进度路由
    await fastify.register(progressRoutes, { prefix: '/progress' })
    
    // 成就路由
    await fastify.register(achievementRoutes, { prefix: '/achievements' })
    
    // 社区路由
    await fastify.register(communityRoutes, { prefix: '/community' })
    
    // 管理员路由
    await fastify.register(adminRoutes, { prefix: '/admin' })
    
    // AI助手路由
    await registerAIAssistantRoutes(fastify)
    
    // 自适应难度路由
    await registerAdaptiveDifficultyRoutes(fastify)
    
    // 进度分析路由
    await registerProgressAnalyticsRoutes(fastify)
  }, { prefix: '/api' })
}

// 数据库连接钩子
fastify.addHook('onReady', async () => {
  try {
    await prisma.$connect()
    fastify.log.info('数据库连接成功')
  } catch (error) {
    fastify.log.error('数据库连接失败:', error)
    throw error
  }
})

// Redis连接钩子
fastify.addHook('onReady', async () => {
  try {
    await redis.connect()
    fastify.log.info('Redis连接成功')
  } catch (error) {
    fastify.log.error('Redis连接失败:', error)
    throw error
  }
})

// 优雅关闭
fastify.addHook('onClose', async () => {
  await prisma.$disconnect()
  await redis.disconnect()
  fastify.log.info('服务器优雅关闭')
})

// 启动服务器
async function start() {
  try {
    // 注册插件和路由
    await registerPlugins()
    await registerRoutes()

    // 启动服务器
    const address = await fastify.listen({
      port: config.PORT,
      host: config.HOST
    })

    fastify.log.info(`🚀 ELP后端服务启动成功！`)
    fastify.log.info(`📍 服务地址: ${address}`)
    fastify.log.info(`📚 API文档: ${address}/docs`)
    fastify.log.info(`🌍 环境: ${config.NODE_ENV}`)

  } catch (error) {
    fastify.log.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  fastify.log.error('未捕获的异常:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  fastify.log.error('未处理的Promise拒绝:', reason)
  process.exit(1)
})

// 处理进程信号
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`收到 ${signal} 信号，开始优雅关闭...`)
  
  try {
    await fastify.close()
    fastify.log.info('服务器已优雅关闭')
    process.exit(0)
  } catch (error) {
    fastify.log.error('关闭服务器时出错:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// 启动应用
if (import.meta.url === `file://${process.argv[1]}`) {
  start()
}

export default fastify