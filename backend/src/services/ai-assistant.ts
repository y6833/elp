import { FastifyInstance } from 'fastify'
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'
import { PrismaClient } from '@prisma/client'
import { redisClient } from '../utils/cache'

const prisma = new PrismaClient()

// AI配置
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || '',
  basePath: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
})
const openai = new OpenAIApi(configuration)

// AI助手类型定义
export interface AIAssistantRequest {
  userId: string
  message: string
  context?: {
    currentLevel?: number
    lastError?: string
    codeSnippet?: string
    learningGoal?: string
  }
}

export interface AIAssistantResponse {
  reply: string
  suggestions?: string[]
  resources?: {
    title: string
    url: string
    type: 'documentation' | 'tutorial' | 'example'
  }[]
  nextSteps?: string[]
  confidence: number
}

// AI助手服务类
export class AIAssistantService {
  private systemPrompt = `你是ELP前端工程化学习平台的AI学习助手。你的职责是：

1. 回答前端工程化相关问题（Webpack、Vite、Rollup、Parcel、ESBuild等）
2. 分析用户代码并提供改进建议
3. 根据用户的学习进度提供个性化指导
4. 解释错误信息并提供解决方案
5. 推荐相关学习资源

回答要求：
- 使用中文回答
- 简洁明了，重点突出
- 提供具体的代码示例
- 给出循序渐进的学习建议
- 保持友好和鼓励的语调`

  // 获取AI回复
  async getAssistantReply(request: AIAssistantRequest): Promise<AIAssistantResponse> {
    try {
      // 构建对话上下文
      const messages = await this.buildConversationContext(request)
      
      // 调用OpenAI API
      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const aiReply = completion.data.choices[0]?.message?.content || ''
      
      // 解析AI回复，提取结构化信息
      const response = this.parseAIResponse(aiReply)
      
      // 保存对话记录
      await this.saveConversation(request, response)
      
      // 缓存常用回复
      await this.cacheResponse(request.message, response)
      
      return response
    } catch (error) {
      console.error('AI Assistant Error:', error)
      return this.getFallbackResponse(request)
    }
  }

  // 构建对话上下文
  private async buildConversationContext(request: AIAssistantRequest): Promise<ChatCompletionRequestMessage[]> {
    const messages: ChatCompletionRequestMessage[] = [
      { role: 'system', content: this.systemPrompt }
    ]

    // 添加用户学习上下文
    if (request.context) {
      let contextInfo = '用户当前学习情况：\n'
      
      if (request.context.currentLevel) {
        const level = await prisma.level.findUnique({
          where: { id: request.context.currentLevel }
        })
        if (level) {
          contextInfo += `- 当前关卡：${level.title} (${level.category})\n`
        }
      }
      
      if (request.context.lastError) {
        contextInfo += `- 最近遇到的错误：${request.context.lastError}\n`
      }
      
      if (request.context.codeSnippet) {
        contextInfo += `- 用户代码片段：\n\`\`\`\n${request.context.codeSnippet}\n\`\`\`\n`
      }
      
      if (request.context.learningGoal) {
        contextInfo += `- 学习目标：${request.context.learningGoal}\n`
      }
      
      messages.push({ role: 'user', content: contextInfo })
    }

    // 获取最近的对话历史
    const recentConversations = await prisma.aiConversation.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // 添加历史对话（倒序添加）
    recentConversations.reverse().forEach(conv => {
      messages.push(
        { role: 'user', content: conv.userMessage },
        { role: 'assistant', content: conv.aiResponse }
      )
    })

    // 添加当前用户消息
    messages.push({ role: 'user', content: request.message })

    return messages
  }

  // 解析AI回复
  private parseAIResponse(aiReply: string): AIAssistantResponse {
    const response: AIAssistantResponse = {
      reply: aiReply,
      confidence: 0.8
    }

    // 尝试提取结构化信息
    try {
      // 提取建议（寻找列表格式）
      const suggestionMatch = aiReply.match(/建议[：:]\s*\n?([\s\S]*?)(?=\n\n|\n[资源链接|下一步|$])/i)
      if (suggestionMatch) {
        const suggestions = suggestionMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .map(line => line.replace(/^[-\d.\s]+/, '').trim())
          .filter(s => s.length > 0)
        
        if (suggestions.length > 0) {
          response.suggestions = suggestions
        }
      }

      // 提取下一步操作
      const nextStepsMatch = aiReply.match(/下一步[：:]\s*\n?([\s\S]*?)(?=\n\n|$)/i)
      if (nextStepsMatch) {
        const nextSteps = nextStepsMatch[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
          .map(line => line.replace(/^[-\d.\s]+/, '').trim())
          .filter(s => s.length > 0)
        
        if (nextSteps.length > 0) {
          response.nextSteps = nextSteps
        }
      }

      // 提取资源链接（这里可以根据内容匹配预定义的资源）
      response.resources = this.extractResources(aiReply)
      
    } catch (error) {
      console.warn('解析AI回复时出错:', error)
    }

    return response
  }

  // 提取相关资源
  private extractResources(content: string): AIAssistantResponse['resources'] {
    const resources: AIAssistantResponse['resources'] = []
    
    // 预定义的资源映射
    const resourceMap = {
      'webpack': [
        { title: 'Webpack官方文档', url: 'https://webpack.js.org/', type: 'documentation' as const },
        { title: 'Webpack配置指南', url: 'https://webpack.js.org/configuration/', type: 'tutorial' as const }
      ],
      'vite': [
        { title: 'Vite官方文档', url: 'https://vitejs.dev/', type: 'documentation' as const },
        { title: 'Vite配置参考', url: 'https://vitejs.dev/config/', type: 'tutorial' as const }
      ],
      'rollup': [
        { title: 'Rollup官方文档', url: 'https://rollupjs.org/', type: 'documentation' as const }
      ],
      'typescript': [
        { title: 'TypeScript官方文档', url: 'https://www.typescriptlang.org/', type: 'documentation' as const }
      ],
      'eslint': [
        { title: 'ESLint官方文档', url: 'https://eslint.org/', type: 'documentation' as const }
      ]
    }

    // 根据内容匹配资源
    Object.entries(resourceMap).forEach(([keyword, keywordResources]) => {
      if (content.toLowerCase().includes(keyword)) {
        resources.push(...keywordResources)
      }
    })

    return resources.slice(0, 3) // 最多返回3个资源
  }

  // 保存对话记录
  private async saveConversation(request: AIAssistantRequest, response: AIAssistantResponse): Promise<void> {
    try {
      await prisma.aiConversation.create({
        data: {
          userId: request.userId,
          userMessage: request.message,
          aiResponse: response.reply,
          context: request.context as any,
          confidence: response.confidence
        }
      })
    } catch (error) {
      console.error('保存对话记录失败:', error)
    }
  }

  // 缓存回复
  private async cacheResponse(question: string, response: AIAssistantResponse): Promise<void> {
    try {
      const cacheKey = `ai_response:${Buffer.from(question).toString('base64')}`
      await redisClient.setex(cacheKey, 3600, JSON.stringify(response)) // 缓存1小时
    } catch (error) {
      console.error('缓存AI回复失败:', error)
    }
  }

  // 获取缓存的回复
  async getCachedResponse(question: string): Promise<AIAssistantResponse | null> {
    try {
      const cacheKey = `ai_response:${Buffer.from(question).toString('base64')}`
      const cached = await redisClient.get(cacheKey)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('获取缓存AI回复失败:', error)
      return null
    }
  }

  // 备用回复
  private getFallbackResponse(request: AIAssistantRequest): AIAssistantResponse {
    return {
      reply: '抱歉，AI助手暂时无法回答您的问题。请稍后再试，或者查看我们的学习资料。',
      suggestions: [
        '检查当前关卡的提示信息',
        '查看相关文档和示例',
        '在社区中寻求帮助'
      ],
      confidence: 0.1
    }
  }

  // 分析用户学习模式
  async analyzeUserLearningPattern(userId: string): Promise<{
    preferredTopics: string[]
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
    learningStyle: 'visual' | 'practical' | 'theoretical'
    commonQuestions: string[]
  }> {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const userProgress = await prisma.userProgress.findMany({
      where: { userId },
      include: { level: true }
    })

    // 分析偏好主题
    const topicCounts: Record<string, number> = {}
    conversations.forEach(conv => {
      // 简单的关键词分析
      const keywords = ['webpack', 'vite', 'rollup', 'typescript', 'babel', 'eslint']
      keywords.forEach(keyword => {
        if (conv.userMessage.toLowerCase().includes(keyword)) {
          topicCounts[keyword] = (topicCounts[keyword] || 0) + 1
        }
      })
    })

    const preferredTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic)

    // 分析难度水平
    const completedLevels = userProgress.filter(p => p.completed).length
    const totalLevels = userProgress.length
    const completionRate = totalLevels > 0 ? completedLevels / totalLevels : 0

    let difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
    if (completionRate < 0.3) {
      difficultyLevel = 'beginner'
    } else if (completionRate < 0.7) {
      difficultyLevel = 'intermediate'
    } else {
      difficultyLevel = 'advanced'
    }

    // 分析学习风格（基于问题类型）
    const practicalQuestions = conversations.filter(c => 
      c.userMessage.includes('怎么做') || c.userMessage.includes('如何') || c.userMessage.includes('代码')
    ).length

    const theoreticalQuestions = conversations.filter(c =>
      c.userMessage.includes('为什么') || c.userMessage.includes('原理') || c.userMessage.includes('区别')
    ).length

    let learningStyle: 'visual' | 'practical' | 'theoretical'
    if (practicalQuestions > theoreticalQuestions) {
      learningStyle = 'practical'
    } else if (theoreticalQuestions > practicalQuestions) {
      learningStyle = 'theoretical'
    } else {
      learningStyle = 'visual'
    }

    // 常见问题
    const commonQuestions = conversations
      .slice(0, 10)
      .map(c => c.userMessage)

    return {
      preferredTopics,
      difficultyLevel,
      learningStyle,
      commonQuestions
    }
  }
}

// 注册AI助手路由
export async function registerAIAssistantRoutes(fastify: FastifyInstance) {
  const aiService = new AIAssistantService()

  // AI对话接口
  fastify.post('/api/ai/chat', async (request, reply) => {
    const { message, context } = request.body as {
      message: string
      context?: AIAssistantRequest['context']
    }

    // 这里应该从JWT token或session中获取用户ID
    const userId = 'user_1' // 临时硬编码

    if (!message?.trim()) {
      return reply.code(400).send({
        success: false,
        error: '消息内容不能为空'
      })
    }

    try {
      // 先检查缓存
      const cachedResponse = await aiService.getCachedResponse(message)
      if (cachedResponse) {
        return reply.send({
          success: true,
          data: { ...cachedResponse, cached: true }
        })
      }

      // 获取AI回复
      const response = await aiService.getAssistantReply({
        userId,
        message,
        context
      })

      reply.send({
        success: true,
        data: response
      })
    } catch (error) {
      console.error('AI助手错误:', error)
      reply.code(500).send({
        success: false,
        error: 'AI助手服务暂时不可用'
      })
    }
  })

  // 获取用户学习模式分析
  fastify.get('/api/ai/learning-pattern', async (request, reply) => {
    const userId = 'user_1' // 临时硬编码

    try {
      const pattern = await aiService.analyzeUserLearningPattern(userId)
      
      reply.send({
        success: true,
        data: pattern
      })
    } catch (error) {
      console.error('分析学习模式错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法分析学习模式'
      })
    }
  })

  // 获取对话历史
  fastify.get('/api/ai/conversations', async (request, reply) => {
    const userId = 'user_1' // 临时硬编码
    const { page = 1, limit = 20 } = request.query as { page?: number, limit?: number }

    try {
      const conversations = await prisma.aiConversation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })

      const total = await prisma.aiConversation.count({
        where: { userId }
      })

      reply.send({
        success: true,
        data: {
          conversations,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } catch (error) {
      console.error('获取对话历史错误:', error)
      reply.code(500).send({
        success: false,
        error: '无法获取对话历史'
      })
    }
  })
}