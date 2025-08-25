import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ThemeConfig } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const isDark = ref(false)
  const primaryColor = ref('#1890ff')
  const fontSize = ref<'small' | 'medium' | 'large'>('medium')
  const language = ref<'zh-CN' | 'en-US'>('zh-CN')
  
  // 计算属性
  const themeConfig = computed((): ThemeConfig => ({
    isDark: isDark.value,
    primaryColor: primaryColor.value,
    fontSize: fontSize.value,
    language: language.value
  }))
  
  const cssVariables = computed(() => ({
    '--primary-color': primaryColor.value,
    '--font-size-base': getFontSizeValue(fontSize.value)
  }))
  
  // 预设主题颜色
  const presetColors = [
    { name: '拂晓蓝', value: '#1890ff' },
    { name: '薄暮', value: '#722ed1' },
    { name: '火山', value: '#fa541c' },
    { name: '日暮', value: '#faad14' },
    { name: '明青', value: '#13c2c2' },
    { name: '极光绿', value: '#52c41a' },
    { name: '极客蓝', value: '#2f54eb' },
    { name: '酱紫', value: '#eb2f96' }
  ]
  
  // 方法
  const toggleDarkMode = () => {
    isDark.value = !isDark.value
    updateDocumentClass()
  }
  
  const setDarkMode = (dark: boolean) => {
    isDark.value = dark
    updateDocumentClass()
  }
  
  const setPrimaryColor = (color: string) => {
    primaryColor.value = color
    updateCSSVariables()
  }
  
  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    fontSize.value = size
    updateCSSVariables()
  }
  
  const setLanguage = (lang: 'zh-CN' | 'en-US') => {
    language.value = lang
  }
  
  const resetTheme = () => {
    isDark.value = false
    primaryColor.value = '#1890ff'
    fontSize.value = 'medium'
    language.value = 'zh-CN'
    updateDocumentClass()
    updateCSSVariables()
  }
  
  const initTheme = () => {
    // 检测系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (!localStorage.getItem('elp-theme-store')) {
      isDark.value = prefersDark
    }
    
    updateDocumentClass()
    updateCSSVariables()
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('elp-theme-store')) {
        setDarkMode(e.matches)
      }
    })
  }
  
  // 工具函数
  function updateDocumentClass() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  
  function updateCSSVariables() {
    const root = document.documentElement
    root.style.setProperty('--primary-color', primaryColor.value)
    root.style.setProperty('--font-size-base', getFontSizeValue(fontSize.value))
  }
  
  function getFontSizeValue(size: 'small' | 'medium' | 'large'): string {
    const sizeMap = {
      small: '13px',
      medium: '14px',
      large: '16px'
    }
    return sizeMap[size]
  }
  
  return {
    // 状态
    isDark: readonly(isDark),
    primaryColor: readonly(primaryColor),
    fontSize: readonly(fontSize),
    language: readonly(language),
    
    // 计算属性
    themeConfig,
    cssVariables,
    presetColors,
    
    // 方法
    toggleDarkMode,
    setDarkMode,
    setPrimaryColor,
    setFontSize,
    setLanguage,
    resetTheme,
    initTheme
  }
}, {
  persist: {
    key: 'elp-theme-store',
    storage: localStorage
  }
})