import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Level, 
  LevelCategory, 
  ValidationResult,
  LearningProgress,
  LearningRecommendation
} from '@/types'
import { api } from '@/utils/api'

export const useLevelStore = defineStore('levels', () => {
  // 状态
  const levels = ref<Level[]>([])
  const currentLevel = ref<Level | null>(null)
  const userProgress = ref<Map<string, LearningProgress>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 计算属性
  const levelsByCategory = computed(() => {
    const categories = new Map<LevelCategory, Level[]>()
    
    levels.value.forEach(level => {
      const category = level.category
      if (!categories.has(category)) {
        categories.set(category, [])
      }
      categories.get(category)!.push(level)
    })
    
    // 按难度排序
    categories.forEach(levelList => {
      levelList.sort((a, b) => {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 }
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      })
    })
    
    return categories
  })
  
  const completedLevels = computed(() =>
    levels.value.filter(level => {
      const progress = userProgress.value.get(level.id)
      return progress?.status === 'completed'
    })
  )
  
  const inProgressLevels = computed(() =>
    levels.value.filter(level => {
      const progress = userProgress.value.get(level.id)
      return progress?.status === 'in-progress'
    })
  )
  
  const overallProgress = computed(() => {
    const total = levels.value.length
    const completed = completedLevels.value.length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  })
  
  const categoryProgress = computed(() => {
    const progress = new Map<LevelCategory, { total: number; completed: number; percentage: number }>()
    
    levelsByCategory.value.forEach((levelList, category) => {
      const total = levelList.length
      const completed = levelList.filter(level => {
        const prog = userProgress.value.get(level.id)
        return prog?.status === 'completed'
      }).length
      
      progress.set(category, {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      })
    })
    
    return progress
  })
  
  // 获取可用的下一关卡（基于前置条件）
  const availableLevels = computed(() =>
    levels.value.filter(level => {
      // 检查前置条件是否满足
      return level.prerequisites.every(prereqId => {
        const prereqProgress = userProgress.value.get(prereqId)
        return prereqProgress?.status === 'completed'
      })
    })
  )
  
  // 操作方法
  const fetchLevels = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get<Level[]>('/api/levels')
      levels.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取关卡失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const fetchLevelById = async (levelId: string): Promise<Level | null> => {
    try {
      const response = await api.get<Level>(`/api/levels/${levelId}`)
      const level = response.data
      
      // 更新本地缓存
      const index = levels.value.findIndex(l => l.id === levelId)
      if (index >= 0) {
        levels.value[index] = level
      } else {
        levels.value.push(level)
      }
      
      return level
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取关卡详情失败'
      return null
    }
  }
  
  const setCurrentLevel = (level: Level | null) => {
    currentLevel.value = level
  }
  
  const validateCode = async (
    levelId: string, 
    code: string, 
    files?: Record<string, string>
  ): Promise<ValidationResult> => {
    try {
      const response = await api.post<ValidationResult>(`/api/levels/${levelId}/validate`, {
        code,
        files
      })
      
      const result = response.data
      
      // 更新用户进度
      await updateProgress(levelId, result)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '代码验证失败'
      throw new Error(errorMessage)
    }
  }
  
  const updateProgress = async (levelId: string, validationResult: ValidationResult) => {
    const currentProgress = userProgress.value.get(levelId) || {
      userId: 'current-user', // TODO: 从用户store获取
      levelId,
      status: 'not-started' as const,
      attempts: 0,
      timeSpent: 0,
      score: 0,
      lastAttemptAt: new Date().toISOString()
    }
    
    // 更新进度
    const updatedProgress: LearningProgress = {
      ...currentProgress,
      attempts: currentProgress.attempts + 1,
      score: Math.max(currentProgress.score, validationResult.score),
      status: validationResult.success ? 'completed' : 'in-progress',
      lastAttemptAt: new Date().toISOString()
    }
    
    if (validationResult.success && !currentProgress.completedAt) {
      updatedProgress.completedAt = new Date().toISOString()
    }
    
    userProgress.value.set(levelId, updatedProgress)
    
    // 保存到后端
    try {
      await api.post('/api/progress', {
        progress: updatedProgress
      })
    } catch (err) {
      console.error('保存进度失败:', err)
    }
  }
  
  const getHint = async (levelId: string, hintIndex: number = 0): Promise<string> => {
    const level = levels.value.find(l => l.id === levelId) || currentLevel.value
    
    if (!level || !level.hints[hintIndex]) {
      throw new Error('提示不存在')
    }
    
    const hint = level.hints[hintIndex]
    
    // 检查解锁条件
    if (hint.unlockCondition) {
      const progress = userProgress.value.get(levelId)
      const canUnlock = progress && progress.attempts >= 2 // 示例条件
      
      if (!canUnlock) {
        throw new Error('提示尚未解锁，请尝试更多次后再查看')
      }
    }
    
    return hint.content
  }
  
  const resetLevel = (levelId: string) => {
    userProgress.value.delete(levelId)
  }
  
  const getRecommendations = async (): Promise<LearningRecommendation[]> => {
    try {
      const response = await api.get<LearningRecommendation[]>('/api/recommendations', {
        params: {
          userId: 'current-user' // TODO: 从用户store获取
        }
      })
      return response.data
    } catch (err) {
      console.error('获取学习推荐失败:', err)
      return []
    }
  }
  
  // 工具方法
  const getLevelById = (id: string): Level | undefined =>
    levels.value.find(level => level.id === id)
  
  const getProgressByLevelId = (levelId: string): LearningProgress | undefined =>
    userProgress.value.get(levelId)
  
  const getLevelsByCategory = (category: LevelCategory): Level[] =>
    levelsByCategory.value.get(category) || []
  
  const isLevelCompleted = (levelId: string): boolean => {
    const progress = userProgress.value.get(levelId)
    return progress?.status === 'completed'
  }
  
  const isLevelAvailable = (levelId: string): boolean => {
    const level = getLevelById(levelId)
    if (!level) return false
    
    return level.prerequisites.every(prereqId => isLevelCompleted(prereqId))
  }
  
  const getNextRecommendedLevel = (): Level | null => {
    // 找到第一个可用但未完成的关卡
    return availableLevels.value.find(level => !isLevelCompleted(level.id)) || null
  }
  
  return {
    // 状态
    levels: readonly(levels),
    currentLevel: readonly(currentLevel),
    userProgress: readonly(userProgress),
    loading: readonly(loading),
    error: readonly(error),
    
    // 计算属性
    levelsByCategory,
    completedLevels,
    inProgressLevels,
    overallProgress,
    categoryProgress,
    availableLevels,
    
    // 方法
    fetchLevels,
    fetchLevelById,
    setCurrentLevel,
    validateCode,
    updateProgress,
    getHint,
    resetLevel,
    getRecommendations,
    
    // 工具方法
    getLevelById,
    getProgressByLevelId,
    getLevelsByCategory,
    isLevelCompleted,
    isLevelAvailable,
    getNextRecommendedLevel
  }
}, {
  persist: {
    key: 'elp-level-store',
    storage: localStorage,
    paths: ['userProgress'] // 只持久化用户进度
  }
})