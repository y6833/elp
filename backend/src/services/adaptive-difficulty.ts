import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../utils/cache'

const prisma = new PrismaClient()

// 用户能力评估接口
export interface UserAbility {
  userId: string
  category: string // WEBPACK, VITE, BUILD_TOOLS, etc.
  skill: number // 0-100 技能水平
  confidence: number // 0-1 置信度
  lastAssessed: Date
}

// 难度调整建议
export interface DifficultyAdjustment {
  levelId: string
  currentDifficulty: string
  suggestedDifficulty: string
  reason: string
  confidence: number
}

// 学习路径推荐
export interface LearningPathRecommendation {
  userId: string
  nextLevels: string[]
  skipLevels: string[]
  reviewLevels: string[]
  estimatedTime: number // 分钟
  confidence: number
}

export class AdaptiveDifficultyService {
  // 评估用户能力
  async assessUserAbility(userId: string): Promise<UserAbility[]> {
    const cacheKey = `user_ability:${userId}`
    
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

    const abilities: UserAbility[] = []
    const categories = ['WEBPACK', 'VITE', 'BUILD_TOOLS', 'PACKAGE_MANAGERS', 'CI_CD', 'TESTING']

    for (const category of categories) {
      const categoryProgress = progress.filter(p => p.level.category === category)
      
      if (categoryProgress.length === 0) {
        abilities.push({
          userId,
          category,
          skill: 0,
          confidence: 0,
          lastAssessed: new Date()
        })
        continue
      }

      // 计算技能水平
      const skill = this.calculateSkillLevel(categoryProgress)
      const confidence = this.calculateConfidence(categoryProgress)

      abilities.push({
        userId,
        category,
        skill,
        confidence,
        lastAssessed: new Date()
      })
    }

    // 缓存结果
    await redisClient.setex(cacheKey, 1800, JSON.stringify(abilities)) // 30分钟缓存

    return abilities
  }

  // 计算技能水平
  private calculateSkillLevel(progress: any[]): number {
    let totalScore = 0
    let totalWeight = 0

    progress.forEach(p => {
      const difficultyWeight = this.getDifficultyWeight(p.level.difficulty)
      const timeBonus = this.getTimeBonus(p.timeSpent, p.level.estimatedTime)
      const attemptPenalty = this.getAttemptPenalty(p.attempts)
      
      const score = (p.bestScore * difficultyWeight * timeBonus * attemptPenalty)
      totalScore += score
      totalWeight += difficultyWeight
    })

    return totalWeight > 0 ? Math.min(100, (totalScore / totalWeight)) : 0
  }

  // 获取难度权重
  private getDifficultyWeight(difficulty: string): number {
    switch (difficulty) {
      case 'BEGINNER': return 1.0
      case 'INTERMEDIATE': return 1.5
      case 'ADVANCED': return 2.0
      default: return 1.0
    }
  }

  // 获取时间奖励
  private getTimeBonus(actualTime: number, estimatedTime: number): number {
    if (actualTime <= estimatedTime * 60) return 1.2 // 20% 奖励
    if (actualTime <= estimatedTime * 90) return 1.0 // 无奖励无惩罚
    return 0.8 // 20% 惩罚
  }

  // 获取尝试次数惩罚
  private getAttemptPenalty(attempts: number): number {
    return Math.max(0.5, 1 - (attempts - 1) * 0.1)
  }

  // 计算置信度
  private calculateConfidence(progress: any[]): number {
    if (progress.length < 3) return 0.3 // 数据不足
    
    const completedCount = progress.filter(p => p.status === 'COMPLETED').length
    const completionRate = completedCount / progress.length
    
    const scoreVariance = this.calculateScoreVariance(progress)
    const consistencyScore = 1 - Math.min(0.5, scoreVariance / 100)
    
    return Math.min(1, completionRate * 0.7 + consistencyScore * 0.3)
  }

  // 计算分数方差
  private calculateScoreVariance(progress: any[]): number {
    const scores = progress.map(p => p.bestScore).filter(s => s > 0)
    if (scores.length < 2) return 0
    
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    
    return Math.sqrt(variance)
  }

  // 推荐学习路径
  async recommendLearningPath(userId: string): Promise<LearningPathRecommendation> {
    const abilities = await this.assessUserAbility(userId)
    const userProgress = await prisma.learningProgress.findMany({
      where: { userId },
      include: { level: true }
    })

    const completedLevelIds = userProgress
      .filter(p => p.status === 'COMPLETED')
      .map(p => p.levelId)

    const allLevels = await prisma.level.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }]
    })

    const nextLevels: string[] = []
    const skipLevels: string[] = []
    const reviewLevels: string[] = []

    for (const level of allLevels) {
      if (completedLevelIds.includes(level.id)) continue

      const categoryAbility = abilities.find(a => a.category === level.category)
      if (!categoryAbility) continue

      // 检查前置条件
      const prereqsMet = level.prerequisites.every(prereq => 
        completedLevelIds.includes(prereq)
      )
      if (!prereqsMet) continue

      // 根据用户能力决定推荐策略
      const levelDifficultyScore = this.getDifficultyScore(level.difficulty)
      const userSkillScore = categoryAbility.skill

      if (userSkillScore >= levelDifficultyScore + 20) {
        // 用户能力远超关卡难度，可以跳过
        if (level.difficulty === 'BEGINNER') {
          skipLevels.push(level.id)
        } else {
          nextLevels.push(level.id)
        }
      } else if (userSkillScore >= levelDifficultyScore - 10) {
        // 用户能力匹配关卡难度
        nextLevels.push(level.id)
      } else {
        // 用户能力不足，需要先复习基础内容
        const basicLevels = allLevels.filter(l => 
          l.category === level.category &&
          l.difficulty === 'BEGINNER' &&
          completedLevelIds.includes(l.id)
        )
        reviewLevels.push(...basicLevels.map(l => l.id))
      }

      // 限制推荐数量
      if (nextLevels.length >= 5) break
    }

    // 计算预估学习时间
    const estimatedTime = await this.calculateEstimatedTime(
      userId, 
      [...nextLevels, ...reviewLevels]
    )

    // 计算推荐置信度
    const confidence = this.calculateRecommendationConfidence(abilities, nextLevels.length)

    return {
      userId,
      nextLevels: nextLevels.slice(0, 5),
      skipLevels: skipLevels.slice(0, 3),
      reviewLevels: Array.from(new Set(reviewLevels)).slice(0, 3),
      estimatedTime,
      confidence
    }
  }

  // 获取难度分数
  private getDifficultyScore(difficulty: string): number {
    switch (difficulty) {
      case 'BEGINNER': return 30
      case 'INTERMEDIATE': return 60
      case 'ADVANCED': return 90
      default: return 50
    }
  }

  // 计算预估学习时间
  private async calculateEstimatedTime(userId: string, levelIds: string[]): Promise<number> {
    const levels = await prisma.level.findMany({
      where: { id: { in: levelIds } }
    })

    const userHistory = await prisma.learningProgress.findMany({
      where: { userId },
      include: { level: true }
    })

    let totalTime = 0
    for (const level of levels) {
      // 基础估算时间
      let estimatedTime = level.estimatedTime

      // 根据用户历史表现调整
      const similarLevels = userHistory.filter(h => 
        h.level.category === level.category &&
        h.level.difficulty === level.difficulty
      )

      if (similarLevels.length > 0) {
        const avgTimeRatio = similarLevels.reduce((sum, l) => 
          sum + (l.timeSpent / (l.level.estimatedTime * 60)), 0
        ) / similarLevels.length

        estimatedTime *= Math.max(0.5, Math.min(2.0, avgTimeRatio))
      }

      totalTime += estimatedTime
    }

    return Math.round(totalTime)
  }

  // 计算推荐置信度
  private calculateRecommendationConfidence(abilities: UserAbility[], recommendationCount: number): number {
    const avgConfidence = abilities.reduce((sum, a) => sum + a.confidence, 0) / abilities.length
    const dataQuality = Math.min(1, recommendationCount / 5) // 推荐数量越多，置信度越高
    
    return Math.min(1, avgConfidence * 0.7 + dataQuality * 0.3)
  }

  // 动态调整关卡难度
  async adjustLevelDifficulty(levelId: string): Promise<DifficultyAdjustment | null> {
    const level = await prisma.level.findUnique({
      where: { id: levelId }
    })

    if (!level) return null

    // 获取最近的学习数据
    const recentProgress = await prisma.learningProgress.findMany({
      where: { 
        levelId,
        lastAttemptAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 最近30天
        }
      }
    })

    if (recentProgress.length < 10) return null // 数据不足

    // 分析通过率
    const completionRate = recentProgress.filter(p => p.status === 'COMPLETED').length / recentProgress.length
    
    // 分析平均尝试次数
    const avgAttempts = recentProgress.reduce((sum, p) => sum + p.attempts, 0) / recentProgress.length
    
    // 分析平均分数
    const avgScore = recentProgress.reduce((sum, p) => sum + p.bestScore, 0) / recentProgress.length

    // 分析平均完成时间
    const completedProgress = recentProgress.filter(p => p.status === 'COMPLETED')
    const avgTimeRatio = completedProgress.length > 0 
      ? completedProgress.reduce((sum, p) => sum + (p.timeSpent / (level.estimatedTime * 60)), 0) / completedProgress.length
      : 1

    // 决定是否需要调整难度
    let suggestedDifficulty = level.difficulty
    let reason = ''
    let confidence = 0

    if (completionRate < 0.3 && avgAttempts > 5) {
      // 通过率过低，尝试次数过多 -> 降低难度
      if (level.difficulty === 'ADVANCED') {
        suggestedDifficulty = 'INTERMEDIATE'
        reason = '通过率过低，建议降低难度'
        confidence = 0.8
      } else if (level.difficulty === 'INTERMEDIATE') {
        suggestedDifficulty = 'BEGINNER'
        reason = '通过率过低，建议降低难度'
        confidence = 0.8
      }
    } else if (completionRate > 0.8 && avgScore > 90 && avgTimeRatio < 0.7) {
      // 通过率过高，分数很好，时间很短 -> 提高难度
      if (level.difficulty === 'BEGINNER') {
        suggestedDifficulty = 'INTERMEDIATE'
        reason = '通过率过高且完成质量很好，建议提高难度'
        confidence = 0.7
      } else if (level.difficulty === 'INTERMEDIATE') {
        suggestedDifficulty = 'ADVANCED'
        reason = '通过率过高且完成质量很好，建议提高难度'
        confidence = 0.7
      }
    }

    return suggestedDifficulty !== level.difficulty ? {
      levelId,
      currentDifficulty: level.difficulty,
      suggestedDifficulty,
      reason,
      confidence
    } : null
  }

  // 个性化关卡推荐
  async getPersonalizedRecommendations(userId: string, limit: number = 5): Promise<any[]> {
    const abilities = await this.assessUserAbility(userId)
    const learningPath = await this.recommendLearningPath(userId)
    
    const recommendations = []

    // 基于能力差距推荐
    for (const ability of abilities) {
      if (ability.skill < 70) { // 技能水平较低
        const categoryLevels = await prisma.level.findMany({
          where: {
            category: ability.category as any,
            isActive: true
          },
          orderBy: { order: 'asc' },
          take: 2
        })

        for (const level of categoryLevels) {
          recommendations.push({
            type: 'skill_improvement',
            levelId: level.id,
            level,
            reason: `提升 ${ability.category} 技能（当前: ${Math.round(ability.skill)}%）`,
            priority: 100 - ability.skill,
            category: ability.category
          })
        }
      }
    }

    // 基于学习路径推荐
    for (const levelId of learningPath.nextLevels) {
      const level = await prisma.level.findUnique({
        where: { id: levelId }
      })

      if (level) {
        recommendations.push({
          type: 'learning_path',
          levelId,
          level,
          reason: '根据您的学习进度推荐',
          priority: 80,
          category: level.category
        })
      }
    }

    // 基于复习需求推荐
    for (const levelId of learningPath.reviewLevels) {
      const level = await prisma.level.findUnique({
        where: { id: levelId }
      })

      if (level) {
        recommendations.push({
          type: 'review',
          levelId,
          level,
          reason: '建议复习以巩固基础',
          priority: 60,
          category: level.category
        })
      }
    }

    // 排序并返回
    return recommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
  }
}

// 注册自适应难度路由
export async function registerAdaptiveDifficultyRoutes(fastify: FastifyInstance) {
  const adaptiveService = new AdaptiveDifficultyService()

  // 获取用户能力评估
  fastify.get('/api/adaptive/ability/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    try {
      const abilities = await adaptiveService.assessUserAbility(userId)
      
      reply.send({
        success: true,
        data: abilities
      })
    } catch (error) {
      console.error('获取用户能力评估错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取用户能力评估'
      })
    }
  })

  // 获取学习路径推荐
  fastify.get('/api/adaptive/learning-path/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }

    try {
      const recommendation = await adaptiveService.recommendLearningPath(userId)
      
      reply.send({
        success: true,
        data: recommendation
      })
    } catch (error) {
      console.error('获取学习路径推荐错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取学习路径推荐'
      })
    }
  })

  // 获取个性化推荐
  fastify.get('/api/adaptive/recommendations/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }
    const { limit = 5 } = request.query as { limit?: number }

    try {
      const recommendations = await adaptiveService.getPersonalizedRecommendations(userId, limit)
      
      reply.send({
        success: true,
        data: recommendations
      })
    } catch (error) {
      console.error('获取个性化推荐错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取个性化推荐'
      })
    }
  })

  // 分析关卡难度调整建议
  fastify.get('/api/adaptive/difficulty-analysis/:levelId', async (request, reply) => {
    const { levelId } = request.params as { levelId: string }

    try {
      const adjustment = await adaptiveService.adjustLevelDifficulty(levelId)
      
      reply.send({
        success: true,
        data: adjustment
      })
    } catch (error) {
      console.error('分析关卡难度错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法分析关卡难度'
      })
    }
  })
}