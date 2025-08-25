import { z } from 'zod'
import dotenv from 'dotenv'

// 加载环境变量
dotenv.config()

// 环境变量验证schema
const envSchema = z.object({
  // 基础配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  
  // 前端URL
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  API_HOST: z.string().default('localhost:3000'),
  
  // 数据库配置
  DATABASE_URL: z.string().min(1, '数据库URL不能为空'),
  
  // Redis配置
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT配置
  JWT_SECRET: z.string().min(32, 'JWT密钥长度至少32位'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  
  // Cookie配置
  COOKIE_SECRET: z.string().min(32, 'Cookie密钥长度至少32位'),
  
  // 速率限制
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.string().default('15 minutes'),
  
  // 日志级别
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // 文件上传
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  
  // 邮件配置
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // 外部服务
  OPENAI_API_KEY: z.string().optional(),
  
  // 监控配置
  SENTRY_DSN: z.string().optional(),
  
  // 云存储配置
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  
  // 缓存配置
  CACHE_TTL: z.coerce.number().default(3600), // 1小时
  
  // 安全配置
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  SESSION_TIMEOUT: z.coerce.number().default(24 * 60 * 60 * 1000), // 24小时
  
  // 功能开关
  ENABLE_SWAGGER: z.coerce.boolean().default(true),
  ENABLE_CORS: z.coerce.boolean().default(true),
  ENABLE_RATE_LIMIT: z.coerce.boolean().default(true),
  ENABLE_HELMET: z.coerce.boolean().default(true)
})

// 验证环境变量
const envResult = envSchema.safeParse(process.env)

if (!envResult.success) {
  console.error('❌ 环境变量验证失败:')
  console.error(envResult.error.format())
  process.exit(1)
}

export const config = envResult.data

// 数据库配置
export const databaseConfig = {
  url: config.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  }
}

// Redis配置
export const redisConfig = {
  url: config.REDIS_URL,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000
}

// JWT配置
export const jwtConfig = {
  secret: config.JWT_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshExpiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
  algorithm: 'HS256' as const,
  issuer: 'elp-backend',
  audience: 'elp-frontend'
}

// 邮件配置
export const emailConfig = {
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: config.SMTP_USER && config.SMTP_PASS ? {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS
  } : undefined,
  from: config.SMTP_FROM || 'noreply@elp.dev'
}

// 文件上传配置
export const uploadConfig = {
  dir: config.UPLOAD_DIR,
  maxFileSize: config.MAX_FILE_SIZE,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/json',
    'application/javascript',
    'text/css',
    'text/html'
  ]
}

// 缓存配置
export const cacheConfig = {
  ttl: config.CACHE_TTL,
  levels: {
    short: 300,      // 5分钟
    medium: 1800,    // 30分钟
    long: 3600,      // 1小时
    veryLong: 86400  // 24小时
  }
}

// 分页配置
export const paginationConfig = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultOffset: 0
}

// 验证配置
export const validationConfig = {
  // 用户名规则
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  
  // 密码规则
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false
  },
  
  // 邮箱规则
  email: {
    maxLength: 254
  }
}

// 日志配置
export const logConfig = {
  level: config.LOG_LEVEL,
  format: config.NODE_ENV === 'production' ? 'json' : 'pretty',
  file: {
    enabled: config.NODE_ENV === 'production',
    path: './logs',
    maxSize: '10m',
    maxFiles: '7d'
  }
}

// 安全配置
export const securityConfig = {
  bcryptRounds: config.BCRYPT_ROUNDS,
  sessionTimeout: config.SESSION_TIMEOUT,
  maxLoginAttempts: 5,
  lockoutTime: 15 * 60 * 1000, // 15分钟
  
  // CORS配置
  cors: {
    origin: config.NODE_ENV === 'production' 
      ? [config.FRONTEND_URL]
      : true,
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Helmet配置
  helmet: {
    contentSecurityPolicy: config.NODE_ENV === 'production',
    hsts: config.NODE_ENV === 'production',
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
  }
}

// 导出所有配置
export default {
  ...config,
  database: databaseConfig,
  redis: redisConfig,
  jwt: jwtConfig,
  email: emailConfig,
  upload: uploadConfig,
  cache: cacheConfig,
  pagination: paginationConfig,
  validation: validationConfig,
  log: logConfig,
  security: securityConfig
}