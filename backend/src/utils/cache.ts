import Redis from 'redis'
import { config } from '../config/index.js'
import { logger } from './logger.js'

// Redis客户端实例
export let redis: Redis.RedisClientType

// 缓存键前缀
const CACHE_PREFIX = 'elp:'

// 缓存时间常量
export const CACHE_TTL = {
  SHORT: 300,      // 5分钟
  MEDIUM: 1800,    // 30分钟  
  LONG: 3600,      // 1小时
  VERY_LONG: 86400 // 24小时
} as const

// 缓存键生成器
export const CacheKeys = {
  user: (id: string) => `${CACHE_PREFIX}user:${id}`,
  userSession: (id: string) => `${CACHE_PREFIX}session:${id}`,
  level: (id: string) => `${CACHE_PREFIX}level:${id}`,
  levels: (category?: string) => category 
    ? `${CACHE_PREFIX}levels:${category}` 
    : `${CACHE_PREFIX}levels:all`,
  userProgress: (userId: string) => `${CACHE_PREFIX}progress:${userId}`,
  levelProgress: (userId: string, levelId: string) => 
    `${CACHE_PREFIX}progress:${userId}:${levelId}`,
  leaderboard: (type: string) => `${CACHE_PREFIX}leaderboard:${type}`,
  achievements: () => `${CACHE_PREFIX}achievements`,
  userAchievements: (userId: string) => `${CACHE_PREFIX}achievements:${userId}`,
  communityPosts: (page: number = 1, category?: string) => 
    `${CACHE_PREFIX}posts:${page}${category ? `:${category}` : ''}`,
  post: (id: string) => `${CACHE_PREFIX}post:${id}`,
  postComments: (postId: string) => `${CACHE_PREFIX}comments:${postId}`,
  userStats: (userId: string) => `${CACHE_PREFIX}stats:${userId}`,
  systemStats: () => `${CACHE_PREFIX}stats:system`,
  rateLimiter: (ip: string, endpoint: string) => 
    `${CACHE_PREFIX}ratelimit:${ip}:${endpoint}`,
  emailVerification: (email: string) => `${CACHE_PREFIX}verify:${email}`,
  passwordReset: (email: string) => `${CACHE_PREFIX}reset:${email}`
} as const

// 缓存服务类
export class CacheService {
  private client: Redis.RedisClientType

  constructor(client: Redis.RedisClientType) {
    this.client = client
  }

  /**
   * 设置缓存
   */
  async set(
    key: string, 
    value: any, 
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<boolean> {
    try {
      const serializedValue = typeof value === 'string' 
        ? value 
        : JSON.stringify(value)
      
      await this.client.setEx(key, ttl, serializedValue)
      logger.debug(`缓存设置成功: ${key}`)
      return true
    } catch (error) {
      logger.error(`缓存设置失败: ${key}`, error)
      return false
    }
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null

      // 尝试解析JSON，如果失败则返回原始字符串
      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch (error) {
      logger.error(`缓存获取失败: ${key}`, error)
      return null
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string | string[]): Promise<boolean> {
    try {
      const keys = Array.isArray(key) ? key : [key]
      await this.client.del(keys)
      logger.debug(`缓存删除成功: ${keys.join(', ')}`)
      return true
    } catch (error) {
      logger.error(`缓存删除失败: ${key}`, error)
      return false
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`缓存检查失败: ${key}`, error)
      return false
    }
  }

  /**
   * 设置缓存过期时间
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.client.expire(key, ttl)
      return true
    } catch (error) {
      logger.error(`设置过期时间失败: ${key}`, error)
      return false
    }
  }

  /**
   * 获取缓存剩余过期时间
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      logger.error(`获取TTL失败: ${key}`, error)
      return -1
    }
  }

  /**
   * 原子性增加数值
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    try {
      return await this.client.incrBy(key, increment)
    } catch (error) {
      logger.error(`数值增加失败: ${key}`, error)
      return 0
    }
  }

  /**
   * 原子性减少数值
   */
  async decr(key: string, decrement: number = 1): Promise<number> {
    try {
      return await this.client.decrBy(key, decrement)
    } catch (error) {
      logger.error(`数值减少失败: ${key}`, error)
      return 0
    }
  }

  /**
   * 列表操作 - 左推
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values)
    } catch (error) {
      logger.error(`列表左推失败: ${key}`, error)
      return 0
    }
  }

  /**
   * 列表操作 - 右推
   */
  async rpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rPush(key, values)
    } catch (error) {
      logger.error(`列表右推失败: ${key}`, error)
      return 0
    }
  }

  /**
   * 列表操作 - 获取范围
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop)
    } catch (error) {
      logger.error(`列表范围获取失败: ${key}`, error)
      return []
    }
  }

  /**
   * 有序集合操作 - 添加成员
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      return await this.client.zAdd(key, { score, value: member })
    } catch (error) {
      logger.error(`有序集合添加失败: ${key}`, error)
      return 0
    }
  }

  /**
   * 有序集合操作 - 获取排名范围
   */
  async zrange(
    key: string, 
    start: number, 
    stop: number, 
    withScores: boolean = false
  ): Promise<string[] | Array<{ value: string; score: number }>> {
    try {
      if (withScores) {
        return await this.client.zRangeWithScores(key, start, stop)
      } else {
        return await this.client.zRange(key, start, stop)
      }
    } catch (error) {
      logger.error(`有序集合范围获取失败: ${key}`, error)
      return []
    }
  }

  /**
   * 有序集合操作 - 按分数倒序获取
   */
  async zrevrange(
    key: string, 
    start: number, 
    stop: number, 
    withScores: boolean = false
  ): Promise<string[] | Array<{ value: string; score: number }>> {
    try {
      if (withScores) {
        return await this.client.zRevRangeWithScores(key, start, stop)
      } else {
        return await this.client.zRevRange(key, start, stop)
      }
    } catch (error) {
      logger.error(`有序集合倒序获取失败: ${key}`, error)
      return []
    }
  }

  /**
   * 哈希操作 - 设置字段
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value)
    } catch (error) {
      logger.error(`哈希设置失败: ${key}`, error)
      return 0
    }
  }

  /**
   * 哈希操作 - 获取字段
   */
  async hget(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      logger.error(`哈希获取失败: ${key}`, error)
      return undefined
    }
  }

  /**
   * 哈希操作 - 获取所有字段
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      logger.error(`哈希全获取失败: ${key}`, error)
      return {}
    }
  }

  /**
   * 模式匹配删除
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length === 0) return 0
      
      await this.client.del(keys)
      logger.debug(`模式删除成功: ${pattern}, 删除了 ${keys.length} 个键`)
      return keys.length
    } catch (error) {
      logger.error(`模式删除失败: ${pattern}`, error)
      return 0
    }
  }

  /**
   * 批量设置
   */
  async mset(keyValues: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const pipeline = this.client.multi()
      
      Object.entries(keyValues).forEach(([key, value]) => {
        const serializedValue = typeof value === 'string' 
          ? value 
          : JSON.stringify(value)
        
        if (ttl) {
          pipeline.setEx(key, ttl, serializedValue)
        } else {
          pipeline.set(key, serializedValue)
        }
      })
      
      await pipeline.exec()
      logger.debug(`批量设置成功: ${Object.keys(keyValues).length} 个键`)
      return true
    } catch (error) {
      logger.error(`批量设置失败`, error)
      return false
    }
  }

  /**
   * 批量获取
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mGet(keys)
      return values.map(value => {
        if (!value) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return value as T
        }
      })
    } catch (error) {
      logger.error(`批量获取失败`, error)
      return keys.map(() => null)
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const info = await this.client.info('memory')
      const dbSize = await this.client.dbSize()
      
      return {
        connected: this.client.isReady,
        dbSize,
        memory: info
      }
    } catch (error) {
      logger.error('获取缓存统计失败', error)
      return {
        connected: false,
        dbSize: 0,
        memory: ''
      }
    }
  }

  /**
   * 清空所有缓存（谨慎使用）
   */
  async flushAll(): Promise<boolean> {
    try {
      await this.client.flushAll()
      logger.warn('所有缓存已清空')
      return true
    } catch (error) {
      logger.error('清空缓存失败', error)
      return false
    }
  }
}

// 初始化Redis连接
export async function initRedis(): Promise<CacheService> {
  try {
    redis = Redis.createClient({
      url: config.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
      }
    })

    redis.on('error', (error) => {
      logger.error('Redis连接错误:', error)
    })

    redis.on('connect', () => {
      logger.info('Redis连接建立')
    })

    redis.on('ready', () => {
      logger.info('Redis准备就绪')
    })

    redis.on('end', () => {
      logger.info('Redis连接关闭')
    })

    await redis.connect()
    
    // 测试连接
    await redis.ping()
    logger.info('Redis连接测试成功')

    return new CacheService(redis)
  } catch (error) {
    logger.error('Redis初始化失败:', error)
    throw error
  }
}

// 创建缓存服务实例
export const cache = new CacheService(redis)

// 缓存装饰器
export function Cacheable(
  keyGenerator: (...args: any[]) => string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)
      
      // 尝试从缓存获取
      const cachedResult = await cache.get(cacheKey)
      if (cachedResult !== null) {
        logger.debug(`缓存命中: ${cacheKey}`)
        return cachedResult
      }

      // 执行原方法
      const result = await method.apply(this, args)
      
      // 缓存结果
      await cache.set(cacheKey, result, ttl)
      logger.debug(`缓存设置: ${cacheKey}`)
      
      return result
    }

    return descriptor
  }
}

export default cache