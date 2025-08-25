import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../utils/cache'

const prisma = new PrismaClient()

export interface TeamCreateData {
  name: string
  description: string
  maxMembers: number
  isPrivate: boolean
  managerId: string
}

export interface TeamMember {
  userId: string
  role: 'MANAGER' | 'LEAD' | 'MEMBER'
  joinedAt: Date
  performance: {
    completedLevels: number
    averageScore: number
    totalHours: number
  }
}

export interface TeamProgress {
  teamId: string
  totalMembers: number
  averageProgress: number
  completionRate: number
  topPerformers: TeamMember[]
  strugglingMembers: TeamMember[]
}

export class TeamManagementService {
  // 创建团队
  async createTeam(data: TeamCreateData) {
    const team = await prisma.studyGroup.create({
      data: {
        name: data.name,
        description: data.description,
        maxMembers: data.maxMembers,
        isPrivate: data.isPrivate,
        members: {
          create: {
            userId: data.managerId,
            role: 'OWNER'
          }
        }
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    })

    return team
  }

  // 邀请成员加入团队
  async inviteMember(teamId: string, userId: string, inviterId: string) {
    // 检查邀请者权限
    const inviter = await prisma.studyGroupMember.findFirst({
      where: {
        groupId: teamId,
        userId: inviterId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!inviter) {
      throw new Error('没有权限邀请成员')
    }

    // 检查用户是否已经是成员
    const existingMember = await prisma.studyGroupMember.findFirst({
      where: {
        groupId: teamId,
        userId: userId
      }
    })

    if (existingMember) {
      throw new Error('用户已经是团队成员')
    }

    // 添加成员
    const member = await prisma.studyGroupMember.create({
      data: {
        groupId: teamId,
        userId: userId,
        role: 'MEMBER'
      },
      include: {
        user: true,
        group: true
      }
    })

    return member
  }

  // 获取团队进度报告
  async getTeamProgress(teamId: string): Promise<TeamProgress> {
    const team = await prisma.studyGroup.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              include: {
                progress: {
                  include: { level: true }
                }
              }
            }
          }
        }
      }
    })

    if (!team) {
      throw new Error('团队不存在')
    }

    const memberPerformances = await Promise.all(
      team.members.map(async (member) => {
        const progress = member.user.progress
        const completedLevels = progress.filter(p => p.status === 'COMPLETED').length
        const totalScore = progress.reduce((sum, p) => sum + p.bestScore, 0)
        const averageScore = progress.length > 0 ? totalScore / progress.length : 0
        const totalHours = progress.reduce((sum, p) => sum + p.timeSpent, 0) / 3600

        return {
          userId: member.userId,
          role: member.role as 'MANAGER' | 'LEAD' | 'MEMBER',
          joinedAt: member.joinedAt,
          performance: {
            completedLevels,
            averageScore,
            totalHours
          },
          user: member.user
        }
      })
    )

    // 计算团队统计
    const totalMembers = memberPerformances.length
    const totalProgress = memberPerformances.reduce((sum, m) => sum + m.performance.completedLevels, 0)
    const averageProgress = totalMembers > 0 ? totalProgress / totalMembers : 0

    const totalLevels = await prisma.level.count({ where: { isActive: true } })
    const completionRate = totalLevels > 0 ? (averageProgress / totalLevels) * 100 : 0

    // 找出表现最好和需要帮助的成员
    const sortedByPerformance = memberPerformances.sort((a, b) => 
      b.performance.averageScore - a.performance.averageScore
    )

    const topPerformers = sortedByPerformance.slice(0, 3)
    const strugglingMembers = sortedByPerformance.slice(-3).reverse()

    return {
      teamId,
      totalMembers,
      averageProgress,
      completionRate,
      topPerformers,
      strugglingMembers
    }
  }

  // 设置团队学习目标
  async setTeamGoal(teamId: string, goalData: any) {
    const goal = await prisma.systemConfig.upsert({
      where: { key: `team_goal_${teamId}` },
      update: { value: goalData },
      create: {
        key: `team_goal_${teamId}`,
        value: goalData
      }
    })

    return goal
  }

  // 获取团队排行榜
  async getTeamLeaderboard(teamId: string) {
    const members = await prisma.studyGroupMember.findMany({
      where: { groupId: teamId },
      include: {
        user: {
          include: {
            progress: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      }
    })

    const leaderboard = members.map(member => {
      const completedLevels = member.user.progress.length
      const totalScore = member.user.progress.reduce((sum, p) => sum + p.bestScore, 0)
      const averageScore = completedLevels > 0 ? totalScore / completedLevels : 0

      return {
        userId: member.userId,
        username: member.user.username,
        avatar: member.user.avatar,
        completedLevels,
        averageScore,
        totalScore
      }
    }).sort((a, b) => b.totalScore - a.totalScore)

    return leaderboard
  }

  // 分配学习任务
  async assignLearningTask(teamId: string, assignerId: string, taskData: any) {
    // 检查分配者权限
    const assigner = await prisma.studyGroupMember.findFirst({
      where: {
        groupId: teamId,
        userId: assignerId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!assigner) {
      throw new Error('没有权限分配任务')
    }

    // 创建任务记录
    const task = await prisma.systemConfig.create({
      data: {
        key: `team_task_${teamId}_${Date.now()}`,
        value: {
          ...taskData,
          assignerId,
          assignedAt: new Date(),
          status: 'ASSIGNED'
        }
      }
    })

    // 通知团队成员
    await this.notifyTeamMembers(teamId, 'new_task', taskData)

    return task
  }

  // 通知团队成员
  private async notifyTeamMembers(teamId: string, type: string, data: any) {
    const members = await prisma.studyGroupMember.findMany({
      where: { groupId: teamId }
    })

    const notifications = members.map(member => ({
      userId: member.userId,
      type: 'TEAM_NOTIFICATION' as any,
      title: '团队通知',
      content: `团队有新的${type === 'new_task' ? '学习任务' : '更新'}`,
      data: { teamId, type, ...data }
    }))

    await prisma.notification.createMany({
      data: notifications
    })
  }

  // 生成团队报告
  async generateTeamReport(teamId: string, period: 'week' | 'month' | 'quarter') {
    const team = await prisma.studyGroup.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              include: {
                progress: {
                  include: { level: true }
                }
              }
            }
          }
        }
      }
    })

    if (!team) {
      throw new Error('团队不存在')
    }

    // 计算时间范围
    const now = new Date()
    const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // 统计团队在该期间的学习数据
    const periodProgress = await prisma.learningProgress.findMany({
      where: {
        userId: { in: team.members.map(m => m.userId) },
        lastAttemptAt: { gte: startDate }
      },
      include: { level: true, user: true }
    })

    // 生成报告数据
    const report = {
      teamId,
      teamName: team.name,
      period,
      startDate,
      endDate: now,
      summary: {
        totalMembers: team.members.length,
        activeMembers: new Set(periodProgress.map(p => p.userId)).size,
        completedLevels: periodProgress.filter(p => p.status === 'COMPLETED').length,
        totalTimeSpent: periodProgress.reduce((sum, p) => sum + p.timeSpent, 0),
        averageScore: periodProgress.length > 0 
          ? periodProgress.reduce((sum, p) => sum + p.bestScore, 0) / periodProgress.length 
          : 0
      },
      memberDetails: team.members.map(member => {
        const memberProgress = periodProgress.filter(p => p.userId === member.userId)
        return {
          userId: member.userId,
          username: member.user.username,
          role: member.role,
          completedLevels: memberProgress.filter(p => p.status === 'COMPLETED').length,
          timeSpent: memberProgress.reduce((sum, p) => sum + p.timeSpent, 0),
          averageScore: memberProgress.length > 0 
            ? memberProgress.reduce((sum, p) => sum + p.bestScore, 0) / memberProgress.length 
            : 0
        }
      }),
      categoryBreakdown: this.generateCategoryBreakdown(periodProgress),
      recommendations: this.generateTeamRecommendations(team, periodProgress)
    }

    return report
  }

  private generateCategoryBreakdown(progress: any[]) {
    const categoryStats: Record<string, any> = {}
    
    progress.forEach(p => {
      const category = p.level.category
      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          completed: 0,
          avgScore: 0,
          totalScore: 0
        }
      }
      
      categoryStats[category].total++
      if (p.status === 'COMPLETED') {
        categoryStats[category].completed++
        categoryStats[category].totalScore += p.bestScore
      }
    })

    // 计算平均分
    Object.values(categoryStats).forEach((stats: any) => {
      stats.avgScore = stats.completed > 0 ? stats.totalScore / stats.completed : 0
      stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    })

    return categoryStats
  }

  private generateTeamRecommendations(team: any, progress: any[]) {
    const recommendations = []

    // 基于完成率的建议
    const completionRate = progress.filter(p => p.status === 'COMPLETED').length / progress.length
    if (completionRate < 0.6) {
      recommendations.push('团队整体完成率较低，建议调整学习计划或增加学习时间')
    }

    // 基于活跃度的建议
    const activeMembers = new Set(progress.map(p => p.userId)).size
    const inactiveRate = (team.members.length - activeMembers) / team.members.length
    if (inactiveRate > 0.3) {
      recommendations.push('部分成员学习活跃度较低，建议加强团队激励措施')
    }

    // 基于分数的建议
    const avgScore = progress.reduce((sum, p) => sum + p.bestScore, 0) / progress.length
    if (avgScore < 70) {
      recommendations.push('团队平均分数偏低，建议增加练习时间或寻求导师指导')
    }

    return recommendations
  }
}

// 注册团队管理路由
export async function registerTeamManagementRoutes(fastify: FastifyInstance) {
  const teamService = new TeamManagementService()

  // 创建团队
  fastify.post('/api/teams', async (request, reply) => {
    try {
      const team = await teamService.createTeam(request.body as TeamCreateData)
      reply.send({ success: true, data: team })
    } catch (error) {
      console.error('创建团队失败:', error)
      reply.code(500).send({ success: false, error: '创建团队失败' })
    }
  })

  // 邀请成员
  fastify.post('/api/teams/:teamId/invite', async (request, reply) => {
    const { teamId } = request.params as { teamId: string }
    const { userId } = request.body as { userId: string }
    const inviterId = 'user_1' // 临时硬编码

    try {
      const member = await teamService.inviteMember(teamId, userId, inviterId)
      reply.send({ success: true, data: member })
    } catch (error) {
      console.error('邀请成员失败:', error)
      reply.code(400).send({ success: false, error: error.message })
    }
  })

  // 获取团队进度
  fastify.get('/api/teams/:teamId/progress', async (request, reply) => {
    const { teamId } = request.params as { teamId: string }

    try {
      const progress = await teamService.getTeamProgress(teamId)
      reply.send({ success: true, data: progress })
    } catch (error) {
      console.error('获取团队进度失败:', error)
      reply.code(500).send({ success: false, error: '获取团队进度失败' })
    }
  })

  // 获取团队排行榜
  fastify.get('/api/teams/:teamId/leaderboard', async (request, reply) => {
    const { teamId } = request.params as { teamId: string }

    try {
      const leaderboard = await teamService.getTeamLeaderboard(teamId)
      reply.send({ success: true, data: leaderboard })
    } catch (error) {
      console.error('获取团队排行榜失败:', error)
      reply.code(500).send({ success: false, error: '获取团队排行榜失败' })
    }
  })

  // 生成团队报告
  fastify.get('/api/teams/:teamId/report', async (request, reply) => {
    const { teamId } = request.params as { teamId: string }
    const { period = 'month' } = request.query as { period?: 'week' | 'month' | 'quarter' }

    try {
      const report = await teamService.generateTeamReport(teamId, period)
      reply.send({ success: true, data: report })
    } catch (error) {
      console.error('生成团队报告失败:', error)
      reply.code(500).send({ success: false, error: '生成团队报告失败' })
    }
  })

  // 分配学习任务
  fastify.post('/api/teams/:teamId/tasks', async (request, reply) => {
    const { teamId } = request.params as { teamId: string }
    const assignerId = 'user_1' // 临时硬编码

    try {
      const task = await teamService.assignLearningTask(teamId, assignerId, request.body)
      reply.send({ success: true, data: task })
    } catch (error) {
      console.error('分配学习任务失败:', error)
      reply.code(400).send({ success: false, error: error.message })
    }
  })

  // 设置团队目标
  fastify.post('/api/teams/:teamId/goals', async (request, reply) => {
    const { teamId } = request.params as { teamId: string }

    try {
      const goal = await teamService.setTeamGoal(teamId, request.body)
      reply.send({ success: true, data: goal })
    } catch (error) {
      console.error('设置团队目标失败:', error)
      reply.code(500).send({ success: false, error: '设置团队目标失败' })
    }
  })
}