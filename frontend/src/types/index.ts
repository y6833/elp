// 用户相关类型
export interface User {
  id: string
  username: string
  email?: string
  avatar?: string
  createdAt: string
  lastLoginAt?: string
  role: 'student' | 'mentor' | 'admin'
}

// 关卡相关类型
export interface Level {
  id: string
  title: string
  description: string
  category: LevelCategory
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  estimatedTime: number // 分钟
  prerequisites: string[] // 前置关卡ID
  objectives: string[] // 学习目标
  resources: LevelResource[]
  hints: Hint[]
  solution?: string
  validation: ValidationConfig
  createdAt: string
  updatedAt: string
}

export type LevelCategory = 
  | 'webpack' 
  | 'vite' 
  | 'build-tools' 
  | 'package-managers' 
  | 'ci-cd' 
  | 'testing' 
  | 'performance' 
  | 'deployment'

export interface LevelResource {
  type: 'documentation' | 'video' | 'article' | 'example'
  title: string
  url: string
  description?: string
}

export interface Hint {
  id: string
  content: string
  type: 'tip' | 'warning' | 'error' | 'info'
  unlockCondition?: string // 解锁条件
}

export interface ValidationConfig {
  type: 'webpack' | 'vite' | 'generic'
  rules: ValidationRule[]
  timeout: number // 超时时间(秒)
}

export interface ValidationRule {
  name: string
  description: string
  validator: string // 验证函数名
  weight: number // 权重
}

// 学习进度相关类型
export interface LearningProgress {
  userId: string
  levelId: string
  status: ProgressStatus
  attempts: number
  timeSpent: number // 花费时间(分钟)
  score: number // 得分 (0-100)
  completedAt?: string
  lastAttemptAt: string
  code?: string // 用户提交的代码
  feedback?: string // 反馈
}

export type ProgressStatus = 
  | 'not-started'
  | 'in-progress' 
  | 'completed' 
  | 'stuck'

// 代码验证相关类型
export interface ValidationResult {
  success: boolean
  score: number
  message: string
  details: ValidationDetail[]
  suggestions?: string[]
  executionTime: number
}

export interface ValidationDetail {
  rule: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
}

// 学习统计类型
export interface LearningStats {
  totalLevels: number
  completedLevels: number
  inProgressLevels: number
  totalTimeSpent: number
  averageScore: number
  streakDays: number
  categoryProgress: Record<LevelCategory, CategoryProgress>
}

export interface CategoryProgress {
  total: number
  completed: number
  timeSpent: number
  averageScore: number
}

// 成就系统类型
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  type: AchievementType
  condition: AchievementCondition
  reward?: AchievementReward
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export type AchievementType = 
  | 'completion' 
  | 'streak' 
  | 'performance' 
  | 'exploration' 
  | 'social'

export interface AchievementCondition {
  type: string
  target: number
  category?: LevelCategory
}

export interface AchievementReward {
  type: 'badge' | 'title' | 'avatar' | 'theme'
  value: string
}

export interface UserAchievement {
  achievementId: string
  unlockedAt: string
  progress: number
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 组件Props类型
export interface BaseComponentProps {
  loading?: boolean
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
}

// 路由元信息类型
export interface RouteMeta {
  title: string
  requiresAuth?: boolean
  roles?: string[]
  layout?: 'default' | 'fullscreen' | 'minimal'
}

// 主题相关类型
export interface ThemeConfig {
  isDark: boolean
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  language: 'zh-CN' | 'en-US'
}

// 代码编辑器类型
export interface CodeEditorConfig {
  language: string
  theme: 'vs' | 'vs-dark' | 'hc-black'
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
}

// 文件系统类型
export interface FileNode {
  name: string
  type: 'file' | 'directory'
  path: string
  content?: string
  children?: FileNode[]
}

// 学习推荐类型
export interface LearningRecommendation {
  levelId: string
  reason: string
  priority: number
  type: 'next-step' | 'review' | 'challenge' | 'prerequisite'
}