import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../utils/cache'

const prisma = new PrismaClient()

export interface MentorProfile {
  id: string
  userId: string
  bio: string
  expertise: string[]
  experience: string
  rating: number
  totalSessions: number
  isAvailable: boolean
  pricePerHour?: number
  timezone: string
}

export interface MentorSessionRequest {
  menteeId: string
  mentorId: string
  topic: string
  description?: string
  preferredTime?: Date
  duration: number // 分钟
}

export class MentorService {
  // 获取导师列表
  async getMentors(filters: any = {}) {
    const mentors = await prisma.user.findMany({
      where: {
        role: 'MENTOR',
        isActive: true,
        ...filters
      },
      include: {
        mentorSessions: {
          where: { status: 'COMPLETED' },
          select: { rating: true }
        }
      }
    })

    return mentors.map(mentor => ({
      id: mentor.id,
      username: mentor.username,
      avatar: mentor.avatar,
      bio: mentor.bio,
      rating: this.calculateRating(mentor.mentorSessions),
      totalSessions: mentor.mentorSessions.length
    }))
  }

  // 创建导师会话请求
  async createMentorSession(data: MentorSessionRequest) {
    const session = await prisma.mentorSession.create({
      data: {
        mentorId: data.mentorId,
        menteeId: data.menteeId,
        topic: data.topic,
        description: data.description,
        scheduledAt: data.preferredTime,
        duration: data.duration,
        status: 'REQUESTED'
      },
      include: {
        mentor: true,
        mentee: true
      }
    })

    // 发送通知给导师
    await this.notifyMentor(session.mentorId, session.id)

    return session
  }

  // 接受会话请求
  async acceptSession(sessionId: string, mentorId: string) {
    const session = await prisma.mentorSession.update({
      where: { 
        id: sessionId,
        mentorId: mentorId
      },
      data: { status: 'ACCEPTED' },
      include: {
        mentor: true,
        mentee: true
      }
    })

    // 通知学员
    await this.notifyMentee(session.menteeId, sessionId, 'accepted')

    return session
  }

  // 计算评分
  private calculateRating(sessions: any[]) {
    if (sessions.length === 0) return 0
    const totalRating = sessions.reduce((sum, s) => sum + (s.rating || 0), 0)
    return totalRating / sessions.length
  }

  // 通知导师
  private async notifyMentor(mentorId: string, sessionId: string) {
    // 实现通知逻辑
  }

  // 通知学员
  private async notifyMentee(menteeId: string, sessionId: string, type: string) {
    // 实现通知逻辑
  }
}

// 注册导师系统路由
export async function registerMentorRoutes(fastify: FastifyInstance) {
  const mentorService = new MentorService()

  // 获取导师列表
  fastify.get('/api/mentors', async (request, reply) => {
    try {
      const mentors = await mentorService.getMentors()
      reply.send({ success: true, data: mentors })
    } catch (error) {
      reply.code(500).send({ success: false, error: '获取导师列表失败' })
    }
  })

  // 创建导师会话
  fastify.post('/api/mentor/sessions', async (request, reply) => {
    try {
      const session = await mentorService.createMentorSession(request.body as any)
      reply.send({ success: true, data: session })
    } catch (error) {
      reply.code(500).send({ success: false, error: '创建会话失败' })
    }
  })
}