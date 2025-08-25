<template>
  <div class="monaco-editor-container" :class="containerClasses">
    <!-- 编辑器工具栏 -->
    <div v-if="showToolbar" class="editor-toolbar">
      <div class="toolbar-left">
        <!-- 语言选择 -->
        <n-select
          v-model:value="currentLanguage"
          :options="languageOptions"
          size="small"
          style="width: 120px"
          @update:value="handleLanguageChange"
        />
        
        <!-- 主题切换 -->
        <n-select
          v-model:value="currentTheme"
          :options="themeOptions"
          size="small"
          style="width: 100px"
          @update:value="handleThemeChange"
        />
      </div>
      
      <div class="toolbar-right">
        <!-- 格式化代码 -->
        <n-button
          size="small"
          quaternary
          :disabled="!editorInstance"
          @click="formatDocument"
        >
          <template #icon>
            <Icon name="code" />
          </template>
          格式化
        </n-button>
        
        <!-- 查找替换 -->
        <n-button
          size="small"
          quaternary
          :disabled="!editorInstance"
          @click="openFindWidget"
        >
          <template #icon>
            <Icon name="search" />
          </template>
          查找
        </n-button>
        
        <!-- 设置 -->
        <n-dropdown
          :options="settingsOptions"
          @select="handleSettingSelect"
        >
          <n-button size="small" quaternary>
            <template #icon>
              <Icon name="settings" />
            </template>
          </n-button>
        </n-dropdown>
        
        <!-- 全屏 -->
        <n-button
          size="small"
          quaternary
          @click="toggleFullscreen"
        >
          <template #icon>
            <Icon :name="isFullscreen ? 'minimize' : 'maximize'" />
          </template>
        </n-button>
      </div>
    </div>
    
    <!-- 编辑器主体 -->
    <div
      ref="editorContainer"
      class="editor-content"
      :style="editorStyle"
    />
    
    <!-- 状态栏 -->
    <div v-if="showStatusBar" class="editor-status-bar">
      <div class="status-left">
        <span class="status-item">
          行 {{ cursorPosition.lineNumber }}, 列 {{ cursorPosition.column }}
        </span>
        <span v-if="selectedText" class="status-item">
          选中 {{ selectedText.length }} 字符
        </span>
      </div>
      
      <div class="status-right">
        <span class="status-item">{{ currentLanguage.toUpperCase() }}</span>
        <span class="status-item">{{ encoding }}</span>
        <span class="status-item">{{ lineEnding }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/loader'
import { useThemeStore } from '@/stores/theme'
import Icon from '@/components/ui/Icon.vue'
import type { CodeEditorConfig } from '@/types'

// 配置Monaco Editor加载
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
  }
})

export interface MonacoEditorProps {
  /** 编辑器内容 */
  modelValue: string
  /** 编程语言 */
  language?: string
  /** 编辑器主题 */
  theme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light'
  /** 编辑器高度 */
  height?: number | string
  /** 是否只读 */
  readonly?: boolean
  /** 是否显示行号 */
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval'
  /** 是否显示小地图 */
  minimap?: boolean
  /** 字体大小 */
  fontSize?: number
  /** Tab大小 */
  tabSize?: number
  /** 是否自动换行 */
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  /** 是否显示工具栏 */
  showToolbar?: boolean
  /** 是否显示状态栏 */
  showStatusBar?: boolean
  /** 编辑器选项 */
  options?: monaco.editor.IStandaloneEditorOptions
}

const props = withDefaults(defineProps<MonacoEditorProps>(), {
  language: 'javascript',
  theme: 'vs',
  height: 400,
  readonly: false,
  lineNumbers: 'on',
  minimap: true,
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  showToolbar: true,
  showStatusBar: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string, event: monaco.editor.IModelContentChangedEvent]
  'blur': [event: monaco.editor.IFocusEvent]
  'focus': [event: monaco.editor.IFocusEvent]
  'ready': [editor: monaco.editor.IStandaloneCodeEditor]
  'selection-change': [selection: monaco.Selection]
  'cursor-change': [position: monaco.Position]
}>()

// 引用和状态
const editorContainer = ref<HTMLElement>()
const editorInstance = ref<monaco.editor.IStandaloneCodeEditor>()
const themeStore = useThemeStore()

// 编辑器状态
const currentLanguage = ref(props.language)
const currentTheme = ref(props.theme)
const cursorPosition = ref({ lineNumber: 1, column: 1 })
const selectedText = ref('')
const encoding = ref('UTF-8')
const lineEnding = ref('LF')
const isFullscreen = ref(false)

// 计算属性
const containerClasses = computed(() => [
  'relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
  {
    'fixed inset-0 z-50 bg-white dark:bg-gray-900': isFullscreen.value
  }
])

const editorStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))

// 语言选项
const languageOptions = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'SCSS', value: 'scss' },
  { label: 'LESS', value: 'less' },
  { label: 'Vue', value: 'vue' },
  { label: 'React (JSX)', value: 'jsx' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'YAML', value: 'yaml' },
  { label: 'XML', value: 'xml' },
  { label: 'Shell', value: 'shell' },
  { label: 'Dockerfile', value: 'dockerfile' }
]

// 主题选项
const themeOptions = [
  { label: '浅色', value: 'vs' },
  { label: '深色', value: 'vs-dark' },
  { label: '高对比度', value: 'hc-black' },
  { label: '高对比度浅色', value: 'hc-light' }
]

// 设置选项
const settingsOptions = [
  {
    label: '编辑器设置',
    key: 'editor-settings',
    children: [
      { label: '显示/隐藏小地图', key: 'toggle-minimap' },
      { label: '切换自动换行', key: 'toggle-word-wrap' },
      { label: '切换行号显示', key: 'toggle-line-numbers' },
      { label: '增大字体', key: 'increase-font-size' },
      { label: '减小字体', key: 'decrease-font-size' }
    ]
  },
  {
    label: '高级功能',
    key: 'advanced',
    children: [
      { label: '启用代码折叠', key: 'toggle-folding' },
      { label: '显示空白字符', key: 'toggle-whitespace' },
      { label: '启用括号匹配', key: 'toggle-bracket-matching' }
    ]
  }
]

// 生命周期
onMounted(async () => {
  await initEditor()
})

onUnmounted(() => {
  destroyEditor()
})

// 监听主题变化
watch(() => themeStore.isDark, (isDark) => {
  currentTheme.value = isDark ? 'vs-dark' : 'vs'
  handleThemeChange(currentTheme.value)
})

// 监听内容变化
watch(() => props.modelValue, (newValue) => {
  if (editorInstance.value && editorInstance.value.getValue() !== newValue) {
    editorInstance.value.setValue(newValue)
  }
})

// 初始化编辑器
const initEditor = async () => {
  if (!editorContainer.value) return

  try {
    // 等待Monaco Editor加载
    await loader.init()

    const editor = monaco.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: currentLanguage.value,
      theme: themeStore.isDark ? 'vs-dark' : currentTheme.value,
      readOnly: props.readonly,
      lineNumbers: props.lineNumbers,
      minimap: { enabled: props.minimap },
      fontSize: props.fontSize,
      tabSize: props.tabSize,
      wordWrap: props.wordWrap,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      unfoldOnClickAfterEndOfLine: true,
      contextmenu: true,
      mouseWheelZoom: true,
      multiCursorModifier: 'ctrlCmd',
      accessibilitySupport: 'auto',
      ...props.options
    })

    editorInstance.value = editor

    // 绑定事件
    setupEventListeners(editor)

    // 注册自定义命令
    registerCommands(editor)

    emit('ready', editor)

  } catch (error) {
    console.error('Monaco Editor 初始化失败:', error)
  }
}

// 设置事件监听器
const setupEventListeners = (editor: monaco.editor.IStandaloneCodeEditor) => {
  // 内容变化
  editor.onDidChangeModelContent((e) => {
    const value = editor.getValue()
    emit('update:modelValue', value)
    emit('change', value, e)
  })

  // 焦点事件
  editor.onDidFocusEditorText((e) => emit('focus', e))
  editor.onDidBlurEditorText((e) => emit('blur', e))

  // 光标位置变化
  editor.onDidChangeCursorPosition((e) => {
    cursorPosition.value = {
      lineNumber: e.position.lineNumber,
      column: e.position.column
    }
    emit('cursor-change', e.position)
  })

  // 选择变化
  editor.onDidChangeCursorSelection((e) => {
    const selection = editor.getSelection()
    if (selection) {
      selectedText.value = editor.getModel()?.getValueInRange(selection) || ''
      emit('selection-change', selection)
    }
  })
}

// 注册自定义命令
const registerCommands = (editor: monaco.editor.IStandaloneCodeEditor) => {
  // 快速保存
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    // 触发保存事件或执行保存逻辑
    console.log('保存文件')
  })

  // 快速注释
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
    editor.trigger('keyboard', 'editor.action.commentLine', {})
  })
}

// 销毁编辑器
const destroyEditor = () => {
  if (editorInstance.value) {
    editorInstance.value.dispose()
    editorInstance.value = undefined
  }
}

// 事件处理
const handleLanguageChange = (language: string) => {
  if (editorInstance.value) {
    const model = editorInstance.value.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, language)
    }
  }
}

const handleThemeChange = (theme: string) => {
  if (editorInstance.value) {
    monaco.editor.setTheme(theme)
  }
}

const formatDocument = () => {
  if (editorInstance.value) {
    editorInstance.value.getAction('editor.action.formatDocument')?.run()
  }
}

const openFindWidget = () => {
  if (editorInstance.value) {
    editorInstance.value.getAction('actions.find')?.run()
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  nextTick(() => {
    if (editorInstance.value) {
      editorInstance.value.layout()
    }
  })
}

const handleSettingSelect = (key: string) => {
  if (!editorInstance.value) return

  const editor = editorInstance.value

  switch (key) {
    case 'toggle-minimap':
      editor.updateOptions({
        minimap: { enabled: !editor.getOptions().get(monaco.editor.EditorOption.minimap).enabled }
      })
      break
    
    case 'toggle-word-wrap':
      const currentWrap = editor.getOptions().get(monaco.editor.EditorOption.wordWrap)
      editor.updateOptions({
        wordWrap: currentWrap === 'on' ? 'off' : 'on'
      })
      break
    
    case 'toggle-line-numbers':
      const currentLineNumbers = editor.getOptions().get(monaco.editor.EditorOption.lineNumbers)
      editor.updateOptions({
        lineNumbers: currentLineNumbers.renderType === 1 ? 'off' : 'on'
      })
      break
    
    case 'increase-font-size':
      editor.getAction('editor.action.fontZoomIn')?.run()
      break
    
    case 'decrease-font-size':
      editor.getAction('editor.action.fontZoomOut')?.run()
      break
    
    case 'toggle-folding':
      editor.updateOptions({
        folding: !editor.getOptions().get(monaco.editor.EditorOption.folding)
      })
      break
    
    case 'toggle-whitespace':
      editor.getAction('editor.action.toggleRenderWhitespace')?.run()
      break
    
    case 'toggle-bracket-matching':
      editor.updateOptions({
        matchBrackets: editor.getOptions().get(monaco.editor.EditorOption.matchBrackets) === 'always' ? 'never' : 'always'
      })
      break
  }
}

// 公开方法
const getEditor = () => editorInstance.value
const getValue = () => editorInstance.value?.getValue() || ''
const setValue = (value: string) => editorInstance.value?.setValue(value)
const insertText = (text: string) => {
  if (editorInstance.value) {
    const selection = editorInstance.value.getSelection()
    const range = selection || new monaco.Range(1, 1, 1, 1)
    editorInstance.value.executeEdits('insert-text', [{
      range,
      text,
      forceMoveMarkers: true
    }])
  }
}

defineExpose({
  getEditor,
  getValue,
  setValue,
  insertText,
  formatDocument,
  toggleFullscreen
})
</script>

<style scoped>
.monaco-editor-container {
  display: flex;
  flex-direction: column;
  background: white;
}

.dark .monaco-editor-container {
  background: #1f1f1f;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
  font-size: 12px;
}

.dark .editor-toolbar {
  border-bottom-color: #404040;
  background: #2d2d2d;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

.editor-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  border-top: 1px solid #e5e5e5;
  background: #fafafa;
  font-size: 11px;
  color: #666;
}

.dark .editor-status-bar {
  border-top-color: #404040;
  background: #2d2d2d;
  color: #ccc;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-item {
  white-space: nowrap;
}

/* 全屏模式样式 */
.monaco-editor-container.fixed {
  border-radius: 0;
}
</style>