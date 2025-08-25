import { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import bcrypt from 'bcryptjs'
import { prisma } from '../index.js'
import { cache, CacheKeys, CACHE_TTL } from '../utils/cache.js'
import { generateTokens, verifyRefreshToken } from '../utils/auth.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js'
import { rateLimiter } from '../utils/rateLimiter.js'

// 类型定义
const LoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  rememberMe: Type.Optional(Type.Boolean())
})

const RegisterSchema = Type.Object({
  username: Type.String({ minLength: 3, maxLength: 30 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  confirmPassword: Type.String({ minLength: 8 })
})

const ForgotPasswordSchema = Type.Object({
  email: Type.String({ format: 'email' })
})

const ResetPasswordSchema = Type.Object({
  token: Type.String(),
  password: Type.String({ minLength: 8 }),
  confirmPassword: Type.String({ minLength: 8 })
})

const RefreshTokenSchema = Type.Object({
  refreshToken: Type.String()
})

const VerifyEmailSchema = Type.Object({
  token: Type.String()
})

// 响应类型
const UserResponseSchema = Type.Object({
  id: Type.String(),
  username: Type.String(),
  email: Type.String(),
  avatar: Type.Union([Type.String(), Type.Null()]),
  bio: Type.Union([Type.String(), Type.Null()]),
  role: Type.String(),
  isEmailVerified: Type.Boolean(),
  createdAt: Type.String(),
  lastLoginAt: Type.Union([Type.String(), Type.Null()])
})

const AuthResponseSchema = Type.Object({
  user: UserResponseSchema,
  accessToken: Type.String(),
  refreshToken: Type.String(),
  expiresIn: Type.Number()
})

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // 登录
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      description: '用户登录',
      body: LoginSchema,
      response: {
        200: AuthResponseSchema,
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        }),
        401: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        })
      }
    },
    preHandler: [rateLimiter({ max: 5, timeWindow: '15 minutes' })]
  }, async (request, reply) => {
    const { email, password, rememberMe } = request.body

    try {
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          email: true,
          passwordHash: true,
          avatar: true,
          bio: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true
        }
      })

      if (!user) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: '邮箱或密码错误'
        })
      }

      if (!user.isActive) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: '账户已被禁用'
        })
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: '邮箱或密码错误'
        })
      }

      // 生成令牌
      const { accessToken, refreshToken, expiresIn } = await generateTokens(
        user.id,
        rememberMe
      )

      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // 缓存用户信息
      await cache.set(
        CacheKeys.user(user.id),
        {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        CACHE_TTL.LONG
      )

      // 设置Cookie
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn * 1000
      })

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000 // 30天或7天
      })

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: new Date().toISOString()
        },
        accessToken,
        refreshToken,
        expiresIn
      }
    } catch (error) {
      fastify.log.error('登录失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '登录失败，请稍后重试'
      })
    }
  })

  // 注册
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      description: '用户注册',
      body: RegisterSchema,
      response: {
        201: Type.Object({
          message: Type.String(),
          user: Type.Object({
            id: Type.String(),
            username: Type.String(),
            email: Type.String()
          })
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        })
      }
    },
    preHandler: [rateLimiter({ max: 3, timeWindow: '1 hour' })]
  }, async (request, reply) => {
    const { username, email, password, confirmPassword } = request.body

    try {
      // 验证密码确认
      if (password !== confirmPassword) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: '两次输入的密码不一致'
        })
      }

      // 检查用户名是否已存在
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      })

      if (existingUser) {
        const field = existingUser.email === email ? '邮箱' : '用户名'
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: `${field}已被使用`
        })
      }

      // 加密密码
      const passwordHash = await bcrypt.hash(password, 12)

      // 创建用户
      const user = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        },
        select: {
          id: true,
          username: true,
          email: true
        }
      })

      // 发送邮箱验证邮件
      try {
        await sendVerificationEmail(email, user.id)
      } catch (error) {
        fastify.log.error('发送验证邮件失败:', error)
      }

      reply.code(201)
      return {
        message: '注册成功，请查收邮箱验证邮件',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    } catch (error) {
      fastify.log.error('注册失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '注册失败，请稍后重试'
      })
    }
  })

  // 忘记密码
  fastify.post('/forgot-password', {
    schema: {
      tags: ['Authentication'],
      description: '忘记密码',
      body: ForgotPasswordSchema,
      response: {
        200: Type.Object({
          message: Type.String()
        })
      }
    },
    preHandler: [rateLimiter({ max: 3, timeWindow: '1 hour' })]
  }, async (request, reply) => {
    const { email } = request.body

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, username: true }
      })

      // 无论用户是否存在都返回成功，避免信息泄露
      if (user) {
        await sendPasswordResetEmail(email, user.id)
      }

      return {
        message: '如果该邮箱已注册，您将收到密码重置邮件'
      }
    } catch (error) {
      fastify.log.error('忘记密码失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '处理失败，请稍后重试'
      })
    }
  })

  // 重置密码
  fastify.post('/reset-password', {
    schema: {
      tags: ['Authentication'],
      description: '重置密码',
      body: ResetPasswordSchema,
      response: {
        200: Type.Object({
          message: Type.String()
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { token, password, confirmPassword } = request.body

    try {
      if (password !== confirmPassword) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: '两次输入的密码不一致'
        })
      }

      // 验证重置令牌
      const userId = await cache.get(CacheKeys.passwordReset(token))
      if (!userId) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: '重置链接无效或已过期'
        })
      }

      // 更新密码
      const passwordHash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: userId as string },
        data: { passwordHash }
      })

      // 删除重置令牌
      await cache.del(CacheKeys.passwordReset(token))

      // 清除用户相关缓存
      await cache.deletePattern(`${CacheKeys.user(userId as string)}*`)

      return {
        message: '密码重置成功'
      }
    } catch (error) {
      fastify.log.error('重置密码失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '重置失败，请稍后重试'
      })
    }
  })

  // 刷新令牌
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      description: '刷新访问令牌',
      body: RefreshTokenSchema,
      response: {
        200: Type.Object({
          accessToken: Type.String(),
          expiresIn: Type.Number()
        }),
        401: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { refreshToken } = request.body

    try {
      const payload = await verifyRefreshToken(refreshToken)
      if (!payload) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: '刷新令牌无效'
        })
      }

      const { accessToken, expiresIn } = await generateTokens(payload.userId)

      // 设置新的访问令牌Cookie
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expiresIn * 1000
      })

      return {
        accessToken,
        expiresIn
      }
    } catch (error) {
      fastify.log.error('刷新令牌失败:', error)
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: '刷新令牌无效'
      })
    }
  })

  // 邮箱验证
  fastify.post('/verify-email', {
    schema: {
      tags: ['Authentication'],
      description: '验证邮箱',
      body: VerifyEmailSchema,
      response: {
        200: Type.Object({
          message: Type.String()
        }),
        400: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    const { token } = request.body

    try {
      const userId = await cache.get(CacheKeys.emailVerification(token))
      if (!userId) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: '验证链接无效或已过期'
        })
      }

      await prisma.user.update({
        where: { id: userId as string },
        data: { isEmailVerified: true }
      })

      // 删除验证令牌
      await cache.del(CacheKeys.emailVerification(token))

      // 清除用户缓存
      await cache.del(CacheKeys.user(userId as string))

      return {
        message: '邮箱验证成功'
      }
    } catch (error) {
      fastify.log.error('邮箱验证失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '验证失败，请稍后重试'
      })
    }
  })

  // 登出
  fastify.post('/logout', {
    schema: {
      tags: ['Authentication'],
      description: '用户登出',
      response: {
        200: Type.Object({
          message: Type.String()
        })
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      // 清除Cookie
      reply.clearCookie('accessToken')
      reply.clearCookie('refreshToken')

      // 可以在这里实现令牌黑名单机制
      // 暂时简单返回成功

      return {
        message: '登出成功'
      }
    } catch (error) {
      fastify.log.error('登出失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '登出失败'
      })
    }
  })

  // 获取当前用户信息
  fastify.get('/me', {
    schema: {
      tags: ['Authentication'],
      description: '获取当前用户信息',
      response: {
        200: UserResponseSchema,
        401: Type.Object({
          statusCode: Type.Number(),
          error: Type.String(),
          message: Type.String()
        })
      }
    },
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id

      // 尝试从缓存获取
      let user = await cache.get(CacheKeys.user(userId))
      
      if (!user) {
        // 从数据库获取
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            bio: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            lastLoginAt: true
          }
        })

        if (!dbUser) {
          return reply.code(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: '用户不存在'
          })
        }

        user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          avatar: dbUser.avatar,
          bio: dbUser.bio,
          role: dbUser.role,
          isEmailVerified: dbUser.isEmailVerified,
          createdAt: dbUser.createdAt.toISOString(),
          lastLoginAt: dbUser.lastLoginAt?.toISOString() || null
        }

        // 缓存用户信息
        await cache.set(CacheKeys.user(userId), user, CACHE_TTL.LONG)
      }

      return user
    } catch (error) {
      fastify.log.error('获取用户信息失败:', error)
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: '获取用户信息失败'
      })
    }
  })
}