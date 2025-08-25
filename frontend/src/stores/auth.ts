import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LearningStats, UserAchievement } from '@/types'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 学习统计
  const learningStats = ref<LearningStats | null>(null)
  const achievements = ref<UserAchievement[]>([])
  
  // 计算属性
  const isAuthenticated = computed(() => 
    !!user.value && !!token.value
  )
  
  const isAdmin = computed(() => 
    user.value?.role === 'admin'
  )
  
  const isMentor = computed(() => 
    user.value?.role === 'mentor' || user.value?.role === 'admin'
  )
  
  const userInitials = computed(() => {
    if (!user.value?.username) return 'U'
    return user.value.username
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  })
  
  // 登录相关方法
  const login = async (username: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post<{
        user: User
        token: string
      }>('/api/auth/login', {
        username,
        password
      })
      
      const { user: userData, token: authToken } = response.data
      
      user.value = userData
      token.value = authToken
      
      // 设置API默认认证头
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      // 加载用户数据
      await loadUserData()
      
      return userData
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const register = async (userData: {
    username: string
    email: string
    password: string
  }) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post<{
        user: User
        token: string
      }>('/api/auth/register', userData)
      
      const { user: newUser, token: authToken } = response.data
      
      user.value = newUser
      token.value = authToken
      
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      await loadUserData()
      
      return newUser
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const logout = async () => {
    try {
      if (token.value) {
        await api.post('/api/auth/logout')
      }
    } catch (err) {
      console.error('登出请求失败:', err)
    } finally {
      // 清理本地状态
      user.value = null
      token.value = null
      learningStats.value = null
      achievements.value = []
      
      // 清除API认证头
      delete api.defaults.headers.common['Authorization']
      
      // 清除持久化数据
      localStorage.removeItem('elp-auth-store')
    }
  }
  
  const refreshToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await api.post<{
        token: string
      }>('/api/auth/refresh', {
        token: token.value
      })
      
      token.value = response.data.token
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      return true
    } catch (err) {
      console.error('刷新token失败:', err)
      await logout()
      return false
    }
  }
  
  // 用户数据管理
  const loadUserData = async () => {
    if (!user.value) return
    
    try {
      // 并行加载统计数据和成就
      const [statsResponse, achievementsResponse] = await Promise.all([
        api.get<LearningStats>(`/api/users/${user.value.id}/stats`),
        api.get<UserAchievement[]>(`/api/users/${user.value.id}/achievements`)
      ])
      
      learningStats.value = statsResponse.data
      achievements.value = achievementsResponse.data
    } catch (err) {
      console.error('加载用户数据失败:', err)
    }
  }
  
  const updateProfile = async (updates: Partial<User>) => {
    if (!user.value) throw new Error('用户未登录')
    
    loading.value = true
    error.value = null
    
    try {
      const response = await api.put<User>(`/api/users/${user.value.id}`, updates)
      user.value = response.data
      return user.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新资料失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user.value) throw new Error('用户未登录')
    
    loading.value = true
    error.value = null
    
    try {
      await api.post(`/api/users/${user.value.id}/change-password`, {
        currentPassword,
        newPassword
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : '修改密码失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const uploadAvatar = async (file: File) => {
    if (!user.value) throw new Error('用户未登录')
    
    loading.value = true
    
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      
      const response = await api.post<{ avatarUrl: string }>(
        `/api/users/${user.value.id}/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      
      if (user.value) {
        user.value.avatar = response.data.avatarUrl
      }
      
      return response.data.avatarUrl
    } catch (err) {
      error.value = err instanceof Error ? err.message : '上传头像失败'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  // 初始化认证状态
  const initAuth = async () => {
    if (token.value && user.value) {
      // 设置API认证头
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      try {
        // 验证token是否有效
        const response = await api.get<User>('/api/auth/me')
        user.value = response.data
        await loadUserData()
        return true
      } catch (err) {
        console.error('验证token失败:', err)
        await logout()
        return false
      }
    }
    return false
  }
  
  // 工具方法
  const hasPermission = (permission: string): boolean => {
    if (!user.value) return false
    
    // 管理员拥有所有权限
    if (user.value.role === 'admin') return true
    
    // 导师权限检查
    if (user.value.role === 'mentor') {
      const mentorPermissions = ['view_stats', 'help_students', 'create_content']
      return mentorPermissions.includes(permission)
    }
    
    // 学生基础权限
    const studentPermissions = ['view_levels', 'submit_code', 'view_progress']
    return studentPermissions.includes(permission)
  }
  
  const getAchievementProgress = (achievementId: string): UserAchievement | undefined => {
    return achievements.value.find(a => a.achievementId === achievementId)
  }
  
  return {
    // 状态
    user: readonly(user),
    token: readonly(token),
    loading: readonly(loading),
    error: readonly(error),
    learningStats: readonly(learningStats),
    achievements: readonly(achievements),
    
    // 计算属性
    isAuthenticated,
    isAdmin,
    isMentor,
    userInitials,
    
    // 方法
    login,
    register,
    logout,
    refreshToken,
    loadUserData,
    updateProfile,
    changePassword,
    uploadAvatar,
    initAuth,
    
    // 工具方法
    hasPermission,
    getAchievementProgress
  }
}, {
  persist: {
    key: 'elp-auth-store',
    storage: localStorage,
    paths: ['user', 'token'] // 只持久化必要数据
  }
})