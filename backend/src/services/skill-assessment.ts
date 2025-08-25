import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../utils/cache'

const prisma = new PrismaClient()

export interface SkillAssessment {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  timeLimit: number // 分钟
  questions: AssessmentQuestion[]
  passingScore: number
  certificateTemplate: string
}

export interface AssessmentQuestion {
  id: string
  type: 'multiple_choice' | 'code_challenge' | 'short_answer'
  question: string
  options?: string[]
  correctAnswer?: string
  codeTemplate?: string
  testCases?: TestCase[]
  points: number
}

export interface TestCase {
  input: string
  expectedOutput: string
  description?: string
}

export interface UserAssessmentResult {
  id: string
  userId: string
  assessmentId: string
  startedAt: Date
  completedAt?: Date
  score: number
  maxScore: number
  passed: boolean
  answers: AssessmentAnswer[]
  certificateId?: string
}

export interface AssessmentAnswer {
  questionId: string
  answer: string
  isCorrect: boolean
  points: number
  timeSpent: number
}

export interface Certificate {
  id: string
  userId: string
  assessmentId: string
  title: string
  category: string
  difficulty: string
  score: number
  issuedAt: Date
  validUntil?: Date
  certificateUrl: string
  verificationCode: string
}

export class SkillAssessmentService {
  // 创建评估
  async createAssessment(data: Partial<SkillAssessment>) {
    const assessment = await prisma.systemConfig.create({
      data: {
        key: `assessment_${Date.now()}`,
        value: {
          ...data,
          id: `assessment_${Date.now()}`,
          createdAt: new Date()
        }
      }
    })

    return assessment.value
  }

  // 获取可用评估列表
  async getAvailableAssessments(userId: string) {
    // 获取所有评估
    const assessmentConfigs = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'assessment_' }
      }
    })

    // 获取用户已完成的评估
    const userResults = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: `user_assessment_${userId}_` }
      }
    })

    const completedAssessmentIds = new Set(
      userResults.map(r => r.value.assessmentId)
    )

    return assessmentConfigs
      .map(config => config.value)
      .filter(assessment => !completedAssessmentIds.has(assessment.id))
  }

  // 开始评估
  async startAssessment(userId: string, assessmentId: string) {
    // 检查是否已经有进行中的评估
    const existingSession = await this.getActiveAssessmentSession(userId, assessmentId)
    if (existingSession) {
      return existingSession
    }

    // 获取评估配置
    const assessmentConfig = await prisma.systemConfig.findFirst({
      where: { key: `assessment_${assessmentId.split('_')[1]}` }
    })

    if (!assessmentConfig) {
      throw new Error('评估不存在')
    }

    const assessment = assessmentConfig.value as SkillAssessment

    // 创建用户评估会话
    const session = {
      id: `session_${Date.now()}`,
      userId,
      assessmentId,
      startedAt: new Date(),
      timeLimit: assessment.timeLimit,
      questions: assessment.questions.map(q => ({
        ...q,
        // 隐藏正确答案
        correctAnswer: undefined,
        testCases: q.testCases?.map(tc => ({
          input: tc.input,
          description: tc.description
          // 隐藏期望输出
        }))
      })),
      answers: [],
      score: 0
    }

    // 保存会话
    await redisClient.setex(
      `assessment_session_${userId}_${assessmentId}`,
      assessment.timeLimit * 60, // 转换为秒
      JSON.stringify(session)
    )

    return session
  }

  // 提交答案
  async submitAnswer(userId: string, assessmentId: string, questionId: string, answer: string) {
    const sessionKey = `assessment_session_${userId}_${assessmentId}`
    const sessionData = await redisClient.get(sessionKey)

    if (!sessionData) {
      throw new Error('评估会话已过期')
    }

    const session = JSON.parse(sessionData)

    // 获取原始评估配置
    const assessmentConfig = await prisma.systemConfig.findFirst({
      where: { key: `assessment_${assessmentId.split('_')[1]}` }
    })

    const assessment = assessmentConfig.value as SkillAssessment
    const question = assessment.questions.find(q => q.id === questionId)

    if (!question) {
      throw new Error('问题不存在')
    }

    // 评分
    const result = await this.gradeAnswer(question, answer)

    // 更新会话
    const existingAnswerIndex = session.answers.findIndex(a => a.questionId === questionId)
    const answerData = {
      questionId,
      answer,
      isCorrect: result.isCorrect,
      points: result.points,
      timeSpent: result.timeSpent || 0
    }

    if (existingAnswerIndex >= 0) {
      session.answers[existingAnswerIndex] = answerData
    } else {
      session.answers.push(answerData)
    }

    // 更新总分
    session.score = session.answers.reduce((sum, a) => sum + a.points, 0)

    // 保存更新后的会话
    await redisClient.setex(sessionKey, assessment.timeLimit * 60, JSON.stringify(session))

    return {
      isCorrect: result.isCorrect,
      points: result.points,
      feedback: result.feedback
    }
  }

  // 完成评估
  async completeAssessment(userId: string, assessmentId: string) {
    const sessionKey = `assessment_session_${userId}_${assessmentId}`
    const sessionData = await redisClient.get(sessionKey)

    if (!sessionData) {
      throw new Error('评估会话已过期')
    }

    const session = JSON.parse(sessionData)

    // 获取评估配置
    const assessmentConfig = await prisma.systemConfig.findFirst({
      where: { key: `assessment_${assessmentId.split('_')[1]}` }
    })

    const assessment = assessmentConfig.value as SkillAssessment

    // 计算最终结果
    const maxScore = assessment.questions.reduce((sum, q) => sum + q.points, 0)
    const passed = session.score >= assessment.passingScore

    const result: UserAssessmentResult = {
      id: `result_${Date.now()}`,
      userId,
      assessmentId,
      startedAt: new Date(session.startedAt),
      completedAt: new Date(),
      score: session.score,
      maxScore,
      passed,
      answers: session.answers
    }

    // 如果通过，生成证书
    if (passed) {
      const certificate = await this.generateCertificate(userId, assessment, result)
      result.certificateId = certificate.id
    }

    // 保存结果
    await prisma.systemConfig.create({
      data: {
        key: `user_assessment_${userId}_${assessmentId}`,
        value: result
      }
    })

    // 清除会话
    await redisClient.del(sessionKey)

    return result
  }

  // 获取活跃评估会话
  async getActiveAssessmentSession(userId: string, assessmentId: string) {
    const sessionKey = `assessment_session_${userId}_${assessmentId}`
    const sessionData = await redisClient.get(sessionKey)
    
    return sessionData ? JSON.parse(sessionData) : null
  }

  // 评分答案
  private async gradeAnswer(question: AssessmentQuestion, answer: string) {
    switch (question.type) {
      case 'multiple_choice':
        return {
          isCorrect: answer === question.correctAnswer,
          points: answer === question.correctAnswer ? question.points : 0,
          feedback: answer === question.correctAnswer ? '回答正确！' : '回答错误，请再试试。'
        }

      case 'code_challenge':
        return await this.gradeCodeChallenge(question, answer)

      case 'short_answer':
        return await this.gradeShortAnswer(question, answer)

      default:
        return {
          isCorrect: false,
          points: 0,
          feedback: '未知题型'
        }
    }
  }

  // 代码挑战评分
  private async gradeCodeChallenge(question: AssessmentQuestion, code: string) {
    try {
      if (!question.testCases) {
        return {
          isCorrect: false,
          points: 0,
          feedback: '没有测试用例'
        }
      }

      let passedTests = 0
      const results = []

      for (const testCase of question.testCases) {
        try {
          // 这里应该在安全的沙箱环境中执行代码
          // 简化实现：只检查代码是否包含关键词
          const result = this.executeCodeSafely(code, testCase.input)
          const passed = result === testCase.expectedOutput

          if (passed) passedTests++

          results.push({
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual: result,
            passed
          })
        } catch (error) {
          results.push({
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual: 'Error: ' + error.message,
            passed: false
          })
        }
      }

      const scoreRatio = passedTests / question.testCases.length
      const points = Math.floor(question.points * scoreRatio)

      return {
        isCorrect: passedTests === question.testCases.length,
        points,
        feedback: `通过了 ${passedTests}/${question.testCases.length} 个测试用例`,
        testResults: results
      }
    } catch (error) {
      return {
        isCorrect: false,
        points: 0,
        feedback: '代码执行错误: ' + error.message
      }
    }
  }

  // 简化的代码执行（实际应该使用安全沙箱）
  private executeCodeSafely(code: string, input: string): string {
    // 这是一个简化的实现，实际应该使用Docker容器或其他沙箱技术
    try {
      // 检查危险操作
      const dangerousPatterns = [
        'fs.', 'require(', 'process.', 'eval(', 'Function(',
        'import(', '__dirname', '__filename'
      ]

      for (const pattern of dangerousPatterns) {
        if (code.includes(pattern)) {
          throw new Error('代码包含不允许的操作')
        }
      }

      // 简单的函数执行模拟
      const func = new Function('input', `
        ${code}
        return typeof solution === 'function' ? solution(input) : solution;
      `)

      return String(func(input))
    } catch (error) {
      throw new Error('代码执行失败: ' + error.message)
    }
  }

  // 简答题评分
  private async gradeShortAnswer(question: AssessmentQuestion, answer: string) {
    // 简化实现：基于关键词匹配
    const keywords = question.correctAnswer?.toLowerCase().split(' ') || []
    const userAnswer = answer.toLowerCase()

    let matchedKeywords = 0
    for (const keyword of keywords) {
      if (userAnswer.includes(keyword)) {
        matchedKeywords++
      }
    }

    const scoreRatio = keywords.length > 0 ? matchedKeywords / keywords.length : 0
    const points = Math.floor(question.points * scoreRatio)

    return {
      isCorrect: scoreRatio >= 0.7, // 70%的关键词匹配认为正确
      points,
      feedback: scoreRatio >= 0.7 ? '回答较为准确' : '回答需要更完善'
    }
  }

  // 生成证书
  private async generateCertificate(userId: string, assessment: SkillAssessment, result: UserAssessmentResult): Promise<Certificate> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    const certificate: Certificate = {
      id: `cert_${Date.now()}`,
      userId,
      assessmentId: assessment.id,
      title: `${assessment.title} 认证证书`,
      category: assessment.category,
      difficulty: assessment.difficulty,
      score: result.score,
      issuedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年有效期
      certificateUrl: `/certificates/${Date.now()}.pdf`,
      verificationCode: this.generateVerificationCode()
    }

    // 保存证书
    await prisma.systemConfig.create({
      data: {
        key: `certificate_${certificate.id}`,
        value: certificate
      }
    })

    return certificate
  }

  // 生成验证码
  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  // 获取用户证书
  async getUserCertificates(userId: string) {
    const certificates = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'certificate_' }
      }
    })

    return certificates
      .map(cert => cert.value)
      .filter(cert => cert.userId === userId)
  }

  // 验证证书
  async verifyCertificate(verificationCode: string) {
    const certificates = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: 'certificate_' }
      }
    })

    const certificate = certificates
      .map(cert => cert.value)
      .find(cert => cert.verificationCode === verificationCode)

    if (!certificate) {
      return { valid: false, message: '证书不存在' }
    }

    if (certificate.validUntil && new Date() > new Date(certificate.validUntil)) {
      return { valid: false, message: '证书已过期' }
    }

    return { valid: true, certificate }
  }

  // 获取用户技能档案
  async getUserSkillProfile(userId: string) {
    // 获取用户所有评估结果
    const assessmentResults = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: `user_assessment_${userId}_` }
      }
    })

    const results = assessmentResults.map(r => r.value)
    
    // 按分类统计技能水平
    const skillsByCategory: Record<string, any> = {}

    for (const result of results) {
      // 获取评估配置
      const assessmentConfig = await prisma.systemConfig.findFirst({
        where: { key: `assessment_${result.assessmentId.split('_')[1]}` }
      })

      if (assessmentConfig) {
        const assessment = assessmentConfig.value
        const category = assessment.category

        if (!skillsByCategory[category]) {
          skillsByCategory[category] = {
            category,
            assessments: [],
            averageScore: 0,
            maxDifficulty: 'BEGINNER',
            certificates: 0
          }
        }

        skillsByCategory[category].assessments.push({
          title: assessment.title,
          difficulty: assessment.difficulty,
          score: result.score,
          maxScore: result.maxScore,
          passed: result.passed,
          completedAt: result.completedAt
        })

        if (result.passed) {
          skillsByCategory[category].certificates++
        }
      }
    }

    // 计算每个分类的平均分和最高难度
    Object.values(skillsByCategory).forEach((skill: any) => {
      const passedAssessments = skill.assessments.filter(a => a.passed)
      skill.averageScore = passedAssessments.length > 0
        ? passedAssessments.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / passedAssessments.length
        : 0

      const difficultyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
      skill.maxDifficulty = passedAssessments.reduce((max, a) => {
        const currentLevel = difficultyLevels.indexOf(a.difficulty)
        const maxLevel = difficultyLevels.indexOf(max)
        return currentLevel > maxLevel ? a.difficulty : max
      }, 'BEGINNER')
    })

    return {
      userId,
      skillsByCategory,
      totalCertificates: Object.values(skillsByCategory).reduce((sum: number, skill: any) => sum + skill.certificates, 0),
      overallScore: Object.values(skillsByCategory).length > 0
        ? Object.values(skillsByCategory).reduce((sum: number, skill: any) => sum + skill.averageScore, 0) / Object.values(skillsByCategory).length
        : 0
    }
  }
}

// 注册技能评估路由
export async function registerSkillAssessmentRoutes(fastify: FastifyInstance) {
  const assessmentService = new SkillAssessmentService()

  // 获取可用评估
  fastify.get('/api/assessments', async (request, reply) => {
    const userId = 'user_1' // 临时硬编码

    try {
      const assessments = await assessmentService.getAvailableAssessments(userId)
      reply.send({ success: true, data: assessments })
    } catch (error) {
      reply.code(500).send({ success: false, error: '获取评估列表失败' })
    }
  })

  // 开始评估
  fastify.post('/api/assessments/:assessmentId/start', async (request, reply) => {
    const { assessmentId } = request.params as { assessmentId: string }
    const userId = 'user_1' // 临时硬编码

    try {
      const session = await assessmentService.startAssessment(userId, assessmentId)
      reply.send({ success: true, data: session })
    } catch (error) {
      reply.code(400).send({ success: false, error: error.message })
    }
  })

  // 提交答案
  fastify.post('/api/assessments/:assessmentId/answer', async (request, reply) => {
    const { assessmentId } = request.params as { assessmentId: string }
    const { questionId, answer } = request.body as { questionId: string, answer: string }
    const userId = 'user_1' // 临时硬编码

    try {
      const result = await assessmentService.submitAnswer(userId, assessmentId, questionId, answer)
      reply.send({ success: true, data: result })
    } catch (error) {
      reply.code(400).send({ success: false, error: error.message })
    }
  })

  // 完成评估
  fastify.post('/api/assessments/:assessmentId/complete', async (request, reply) => {
    const { assessmentId } = request.params as { assessmentId: string }
    const userId = 'user_1' // 临时硬编码

    try {
      const result = await assessmentService.completeAssessment(userId, assessmentId)
      reply.send({ success: true, data: result })
    } catch (error) {
      reply.code(400).send({ success: false, error: error.message })
    }
  })

  // 获取用户证书
  fastify.get('/api/certificates', async (request, reply) => {
    const userId = 'user_1' // 临时硬编码

    try {
      const certificates = await assessmentService.getUserCertificates(userId)
      reply.send({ success: true, data: certificates })
    } catch (error) {
      reply.code(500).send({ success: false, error: '获取证书失败' })
    }
  })

  // 验证证书
  fastify.get('/api/certificates/verify/:code', async (request, reply) => {
    const { code } = request.params as { code: string }

    try {
      const verification = await assessmentService.verifyCertificate(code)
      reply.send({ success: true, data: verification })
    } catch (error) {
      reply.code(500).send({ success: false, error: '验证证书失败' })
    }
  })

  // 获取用户技能档案
  fastify.get('/api/skills/profile', async (request, reply) => {
    const userId = 'user_1' // 临时硬编码

    try {
      const profile = await assessmentService.getUserSkillProfile(userId)
      reply.send({ success: true, data: profile })
    } catch (error) {
      reply.code(500).send({ success: false, error: '获取技能档案失败' })
    }
  })
}