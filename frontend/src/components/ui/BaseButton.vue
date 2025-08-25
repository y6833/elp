<template>
  <button
    :class="buttonClasses"
    :disabled="loading || disabled"
    :type="htmlType"
    @click="handleClick"
  >
    <!-- 加载图标 -->
    <Icon 
      v-if="loading" 
      name="loading" 
      class="animate-spin mr-2" 
      :size="iconSize" 
    />
    
    <!-- 前置图标 -->
    <Icon 
      v-else-if="icon && iconPosition === 'left'" 
      :name="icon" 
      class="mr-2" 
      :size="iconSize" 
    />
    
    <!-- 按钮内容 -->
    <span v-if="$slots.default || label" class="flex-1">
      <slot>{{ label }}</slot>
    </span>
    
    <!-- 后置图标 -->
    <Icon 
      v-if="icon && iconPosition === 'right' && !loading" 
      :name="icon" 
      class="ml-2" 
      :size="iconSize" 
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

export interface ButtonProps {
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost'
  /** 按钮尺寸 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 按钮形状 */
  shape?: 'default' | 'round' | 'circle'
  /** 是否为块级按钮 */
  block?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 图标名称 */
  icon?: string
  /** 图标位置 */
  iconPosition?: 'left' | 'right'
  /** 按钮文本 */
  label?: string
  /** HTML按钮类型 */
  htmlType?: 'button' | 'submit' | 'reset'
  /** 是否为虚线边框 */
  dashed?: boolean
  /** 是否为文本按钮 */
  text?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'primary',
  size: 'md',
  shape: 'default',
  block: false,
  loading: false,
  disabled: false,
  iconPosition: 'left',
  htmlType: 'button',
  dashed: false,
  text: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 计算按钮样式类
const buttonClasses = computed(() => {
  const classes = [
    'btn',
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ]
  
  // 尺寸样式
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs min-h-[24px]',
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[36px]',
    lg: 'px-6 py-3 text-base min-h-[44px]',
    xl: 'px-8 py-4 text-lg min-h-[52px]'
  }
  classes.push(sizeClasses[props.size])
  
  // 形状样式
  const shapeClasses = {
    default: 'rounded-lg',
    round: 'rounded-full',
    circle: 'rounded-full aspect-square p-0'
  }
  classes.push(shapeClasses[props.shape])
  
  // 块级按钮
  if (props.block) {
    classes.push('w-full')
  }
  
  // 圆形按钮特殊处理
  if (props.shape === 'circle') {
    const circleSize = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8', 
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14'
    }
    classes.push(circleSize[props.size])
  }
  
  // 类型样式
  if (props.text) {
    // 文本按钮
    const textClasses = {
      primary: 'text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-300 dark:hover:bg-primary-900/20',
      secondary: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
      success: 'text-success-600 hover:text-success-700 hover:bg-success-50 dark:text-success-400 dark:hover:text-success-300 dark:hover:bg-success-900/20',
      warning: 'text-warning-600 hover:text-warning-700 hover:bg-warning-50 dark:text-warning-400 dark:hover:text-warning-300 dark:hover:bg-warning-900/20',
      error: 'text-error-600 hover:text-error-700 hover:bg-error-50 dark:text-error-400 dark:hover:text-error-300 dark:hover:bg-error-900/20',
      ghost: 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
    }
    classes.push(textClasses[props.type])
    classes.push('border-transparent')
  } else {
    // 实心按钮
    const typeClasses = {
      primary: `btn-primary ${props.dashed ? 'border-dashed border-primary-600 bg-transparent text-primary-600 hover:bg-primary-50' : ''}`,
      secondary: `btn-secondary ${props.dashed ? 'border-dashed border-gray-600 bg-transparent text-gray-600 hover:bg-gray-50' : ''}`,
      success: `btn-success ${props.dashed ? 'border-dashed border-success-600 bg-transparent text-success-600 hover:bg-success-50' : ''}`,
      warning: `btn-warning ${props.dashed ? 'border-dashed border-warning-600 bg-transparent text-warning-600 hover:bg-warning-50' : ''}`,
      error: `btn-error ${props.dashed ? 'border-dashed border-error-600 bg-transparent text-error-600 hover:bg-error-50' : ''}`,
      ghost: 'btn-ghost'
    }
    classes.push(typeClasses[props.type])
  }
  
  return classes.join(' ')
})

// 图标尺寸
const iconSize = computed(() => {
  const sizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  }
  return sizes[props.size]
})

// 点击处理
const handleClick = (event: MouseEvent) => {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* 按钮特殊效果 */
.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  transform: none !important;
}

/* 加载状态特殊样式 */
.btn .animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>