import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../utils/cache'

const prisma = new PrismaClient()

// 学习分析数据接口
export interface LearningAnalytics {
  userId: string
  totalTime: number // 总学习时间（秒）
  completedLevels: number
  averageScore: number
  streakDays: number // 连续学习天数
  strongCategories: string[] // 擅长分类
  weakCategories: string[] // 薄弱分类
  learningVelocity: number // 学习速度（关卡/天）
  predictedCompletion: Date // 预测完成时间
  confidence: number
}

// 进度预测接口
export interface ProgressPrediction {
  userId: string
  targetLevelId?: string
  estimatedDays: number
  estimatedHours: number
  confidence: number
  milestones: ProgressMilestone[]
  recommendations: string[]
}

// 学习里程碑
export interface ProgressMilestone {
  date: Date
  description: string
  levelsCompleted: number
  cumulativeScore: number
}

// 学习模式分析
export interface LearningPattern {
  userId: string
  preferredTimeSlots: string[] // 偏好学习时间段
  sessionDuration: number // 平均学习时长（分钟）
  breakFrequency: number // 休息频率
  peakPerformanceTime: string // 最佳表现时间
  difficultyPreference: string // 难度偏好
  learningStyle: 'sequential' | 'exploratory' | 'mixed'
}

export class ProgressAnalyticsService {
  // 生成用户学习分析报告
  async generateLearningAnalytics(userId: string): Promise<LearningAnalytics> {
    const cacheKey = `analytics:${userId}`
    
    // 检查缓存
    const cached = await redisClient.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    // 获取用户学习数据
    const progress = await prisma.learningProgress.findMany({
      where: { userId },
      include: { level: true },
      orderBy: { lastAttemptAt: 'desc' }
    })

    if (progress.length === 0) {
      const emptyAnalytics: LearningAnalytics = {
        userId,
        totalTime: 0,
        completedLevels: 0,
        averageScore: 0,
        streakDays: 0,
        strongCategories: [],
        weakCategories: [],
        learningVelocity: 0,
        predictedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        confidence: 0
      }
      return emptyAnalytics
    }

    // 计算基础统计
    const totalTime = progress.reduce((sum, p) => sum + p.timeSpent, 0)
    const completedProgress = progress.filter(p => p.status === 'COMPLETED')
    const completedLevels = completedProgress.length
    const averageScore = completedProgress.length > 0 
      ? completedProgress.reduce((sum, p) => sum + p.bestScore, 0) / completedProgress.length 
      : 0

    // 计算学习连续天数
    const streakDays = await this.calculateStreakDays(userId)

    // 分析强项和弱项分类
    const { strongCategories, weakCategories } = this.analyzeCategoryStrengths(progress)

    // 计算学习速度
    const learningVelocity = this.calculateLearningVelocity(completedProgress)

    // 预测完成时间
    const { predictedCompletion, confidence } = await this.predictCompletionTime(userId, learningVelocity)

    const analytics: LearningAnalytics = {
      userId,
      totalTime,
      completedLevels,
      averageScore,
      streakDays,
      strongCategories,
      weakCategories,
      learningVelocity,
      predictedCompletion,
      confidence
    }

    // 缓存结果
    await redisClient.setex(cacheKey, 3600, JSON.stringify(analytics)) // 1小时缓存

    return analytics
  }

  // 计算连续学习天数
  private async calculateStreakDays(userId: string): Promise<number> {
    const recentProgress = await prisma.learningProgress.findMany({
      where: { 
        userId,
        lastAttemptAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      },
      orderBy: { lastAttemptAt: 'desc' }
    })

    if (recentProgress.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streakDays = 0
    let currentDate = new Date(today)

    // 从今天开始往前计算连续天数
    while (true) {
      const dayProgress = recentProgress.filter(p => {
        const progressDate = new Date(p.lastAttemptAt)
        progressDate.setHours(0, 0, 0, 0)
        return progressDate.getTime() === currentDate.getTime()
      })

      if (dayProgress.length === 0) break

      streakDays++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streakDays
  }

  // 分析分类强弱项
  private analyzeCategoryStrengths(progress: any[]): { strongCategories: string[], weakCategories: string[] } {
    const categoryStats: Record<string, { total: number, completed: number, avgScore: number }> = {}

    progress.forEach(p => {
      const category = p.level.category
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, completed: 0, avgScore: 0 }
      }
      
      categoryStats[category].total++
      if (p.status === 'COMPLETED') {
        categoryStats[category].completed++
        categoryStats[category].avgScore += p.bestScore
      }
    })

    // 计算每个分类的表现指标
    const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => {
      const completionRate = stats.completed / stats.total
      const avgScore = stats.completed > 0 ? stats.avgScore / stats.completed : 0
      const performanceScore = (completionRate * 0.6 + avgScore / 100 * 0.4) * 100

      return { category, performanceScore, completionRate, avgScore }
    }).sort((a, b) => b.performanceScore - a.performanceScore)

    const strongCategories = categoryPerformance
      .filter(cp => cp.performanceScore >= 70)
      .slice(0, 3)
      .map(cp => cp.category)

    const weakCategories = categoryPerformance
      .filter(cp => cp.performanceScore < 50)
      .slice(-3)
      .map(cp => cp.category)

    return { strongCategories, weakCategories }
  }

  // 计算学习速度
  private calculateLearningVelocity(completedProgress: any[]): number {
    if (completedProgress.length < 2) return 0

    const sortedProgress = completedProgress.sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )

    const firstCompletion = new Date(sortedProgress[0].completedAt)
    const lastCompletion = new Date(sortedProgress[sortedProgress.length - 1].completedAt)
    const daysDifference = (lastCompletion.getTime() - firstCompletion.getTime()) / (1000 * 60 * 60 * 24)

    return daysDifference > 0 ? completedProgress.length / daysDifference : 0
  }

  // 预测完成时间
  private async predictCompletionTime(userId: string, learningVelocity: number): Promise<{ predictedCompletion: Date, confidence: number }> {
    const totalLevels = await prisma.level.count({ where: { isActive: true } })
    const completedLevels = await prisma.learningProgress.count({
      where: { userId, status: 'COMPLETED' }
    })

    const remainingLevels = totalLevels - completedLevels

    if (learningVelocity <= 0) {
      return {
        predictedCompletion: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后
        confidence: 0.1
      }
    }

    const estimatedDays = remainingLevels / learningVelocity
    const predictedCompletion = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)

    // 置信度基于数据量和学习一致性
    const dataPoints = Math.min(completedLevels, 20)
    const confidence = Math.min(0.9, 0.3 + (dataPoints / 20) * 0.6)

    return { predictedCompletion, confidence }
  }

  // 生成进度预测
  async generateProgressPrediction(userId: string, targetLevelId?: string): Promise<ProgressPrediction> {
    const analytics = await this.generateLearningAnalytics(userId)
    
    let targetLevels: any[]
    
    if (targetLevelId) {
      // 预测到特定关卡的时间
      const targetLevel = await prisma.level.findUnique({
        where: { id: targetLevelId }
      })
      if (!targetLevel) throw new Error('目标关卡不存在')
      
      targetLevels = [targetLevel]
    } else {
      // 预测完成所有剩余关卡的时间
      const completedLevelIds = await prisma.learningProgress.findMany({
        where: { userId, status: 'COMPLETED' },
        select: { levelId: true }
      }).then(progress => progress.map(p => p.levelId))

      targetLevels = await prisma.level.findMany({
        where: {
          isActive: true,
          id: { notIn: completedLevelIds }
        }
      })
    }

    const estimatedDays = analytics.learningVelocity > 0 
      ? targetLevels.length / analytics.learningVelocity 
      : 30 // 默认30天

    const estimatedHours = targetLevels.reduce((sum, level) => sum + level.estimatedTime, 0) / 60

    // 生成学习里程碑
    const milestones = this.generateMilestones(targetLevels, estimatedDays, analytics.averageScore)

    // 生成建议
    const recommendations = this.generateRecommendations(analytics, estimatedDays)

    return {
      userId,
      targetLevelId,
      estimatedDays: Math.ceil(estimatedDays),
      estimatedHours: Math.ceil(estimatedHours),
      confidence: analytics.confidence,
      milestones,
      recommendations
    }
  }

  // 生成学习里程碑
  private generateMilestones(targetLevels: any[], estimatedDays: number, averageScore: number): ProgressMilestone[] {
    const milestones: ProgressMilestone[] = []
    const levelsPerMilestone = Math.max(1, Math.ceil(targetLevels.length / 5)) // 最多5个里程碑

    for (let i = 0; i < targetLevels.length; i += levelsPerMilestone) {
      const milestoneDate = new Date(Date.now() + (i / targetLevels.length) * estimatedDays * 24 * 60 * 60 * 1000)
      const levelsInMilestone = Math.min(levelsPerMilestone, targetLevels.length - i)
      
      milestones.push({
        date: milestoneDate,
        description: `完成 ${levelsInMilestone} 个关卡`,
        levelsCompleted: i + levelsInMilestone,
        cumulativeScore: averageScore * (i + levelsInMilestone)
      })
    }

    return milestones
  }

  // 生成建议
  private generateRecommendations(analytics: LearningAnalytics, estimatedDays: number): string[] {
    const recommendations: string[] = []

    // 基于学习速度的建议
    if (analytics.learningVelocity < 0.2) {
      recommendations.push('建议增加学习频率，每天至少完成一个小练习')
    } else if (analytics.learningVelocity > 1) {
      recommendations.push('学习进度很好，保持当前节奏')
    }

    // 基于连续学习天数的建议
    if (analytics.streakDays < 3) {
      recommendations.push('尝试建立每日学习习惯，连续学习效果更佳')
    } else if (analytics.streakDays > 7) {
      recommendations.push('优秀的学习习惯！建议适当休息避免疲劳')
    }

    // 基于薄弱环节的建议
    if (analytics.weakCategories.length > 0) {
      recommendations.push(`重点加强 ${analytics.weakCategories.join('、')} 相关知识`)
    }

    // 基于预测时间的建议
    if (estimatedDays > 90) {
      recommendations.push('考虑制定更详细的学习计划，分阶段完成目标')
    }

    return recommendations
  }

  // 分析学习模式
  async analyzeLearningPattern(userId: string): Promise<LearningPattern> {
    const progress = await prisma.learningProgress.findMany({
      where: { 
        userId,
        lastAttemptAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      },
      orderBy: { lastAttemptAt: 'desc' }
    })

    // 分析偏好时间段
    const timeSlots = this.analyzeTimePreferences(progress)
    
    // 分析学习时长
    const sessionDuration = this.calculateAverageSessionDuration(progress)
    
    // 分析最佳表现时间
    const peakPerformanceTime = this.findPeakPerformanceTime(progress)
    
    // 分析学习风格
    const learningStyle = this.analyzeLearningStyle(progress)

    return {
      userId,
      preferredTimeSlots: timeSlots,
      sessionDuration,
      breakFrequency: 3, // 简化处理
      peakPerformanceTime,
      difficultyPreference: 'INTERMEDIATE', // 简化处理
      learningStyle
    }
  }

  private analyzeTimePreferences(progress: any[]): string[] {
    const hourCounts: Record<number, number> = {}
    
    progress.forEach(p => {
      const hour = new Date(p.lastAttemptAt).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => {
        const h = parseInt(hour)
        if (h < 12) return 'morning'
        if (h < 18) return 'afternoon'
        return 'evening'
      })

    return Array.from(new Set(sortedHours))
  }

  private calculateAverageSessionDuration(progress: any[]): number {
    const validSessions = progress.filter(p => p.timeSpent > 0 && p.timeSpent < 7200) // 0-2小时
    
    if (validSessions.length === 0) return 30 // 默认30分钟

    const avgSeconds = validSessions.reduce((sum, p) => sum + p.timeSpent, 0) / validSessions.length
    return Math.round(avgSeconds / 60) // 转换为分钟
  }

  private findPeakPerformanceTime(progress: any[]): string {
    const completedProgress = progress.filter(p => p.status === 'COMPLETED')
    const hourPerformance: Record<number, { count: number, totalScore: number }> = {}

    completedProgress.forEach(p => {
      const hour = new Date(p.lastAttemptAt).getHours()
      if (!hourPerformance[hour]) {
        hourPerformance[hour] = { count: 0, totalScore: 0 }
      }
      hourPerformance[hour].count++
      hourPerformance[hour].totalScore += p.bestScore
    })

    const bestHour = Object.entries(hourPerformance)
      .map(([hour, perf]) => ({
        hour: parseInt(hour),
        avgScore: perf.totalScore / perf.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)[0]

    if (!bestHour) return 'morning'

    if (bestHour.hour < 12) return 'morning'
    if (bestHour.hour < 18) return 'afternoon'
    return 'evening'
  }

  private analyzeLearningStyle(progress: any[]): 'sequential' | 'exploratory' | 'mixed' {
    // 简化分析：基于关卡完成的顺序模式
    const completedProgress = progress
      .filter(p => p.status === 'COMPLETED')
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())

    if (completedProgress.length < 3) return 'mixed'

    // 检查是否按顺序学习
    let sequentialCount = 0
    for (let i = 1; i < completedProgress.length; i++) {
      if (completedProgress[i].level.order === completedProgress[i-1].level.order + 1) {
        sequentialCount++
      }
    }

    const sequentialRate = sequentialCount / (completedProgress.length - 1)
    
    if (sequentialRate > 0.7) return 'sequential'
    if (sequentialRate < 0.3) return 'exploratory'
    return 'mixed'
  }
}

// 注册进度分析路由
export async function registerProgressAnalyticsRoutes(fastify: FastifyInstance) {
  const analyticsService = new ProgressAnalyticsService()

  // 获取学习分析报告
  fastify.get('/api/analytics/learning/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    try {
      const analytics = await analyticsService.generateLearningAnalytics(userId)
      
      reply.send({
        success: true,
        data: analytics
      })
    } catch (error) {
      console.error('获取学习分析报告错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取学习分析报告'
      })
    }
  })

  // 获取进度预测
  fastify.get('/api/analytics/prediction/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }
    const { targetLevelId } = request.query as { targetLevelId?: string }

    try {
      const prediction = await analyticsService.generateProgressPrediction(userId, targetLevelId)
      
      reply.send({
        success: true,
        data: prediction
      })
    } catch (error) {
      console.error('获取进度预测错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取进度预测'
      })
    }
  })

  // 获取学习模式分析
  fastify.get('/api/analytics/pattern/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    try {
      const pattern = await analyticsService.analyzeLearningPattern(userId)
      
      reply.send({
        success: true,
        data: pattern
      })
    } catch (error) {
      console.error('获取学习模式分析错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取学习模式分析'
      })
    }
  })
}