<template>
  <div id="app">
    <n-config-provider :theme="theme" :locale="locale" :date-locale="dateLocale">
      <n-loading-bar-provider>
        <n-dialog-provider>
          <n-notification-provider>
            <n-message-provider>
              <router-view />
              
              <!-- 全局加载条 -->
              <n-global-style />
            </n-message-provider>
          </n-notification-provider>
        </n-dialog-provider>
      </n-loading-bar-provider>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  NConfigProvider, 
  NLoadingBarProvider, 
  NDialogProvider, 
  NNotificationProvider, 
  NMessageProvider,
  NGlobalStyle,
  darkTheme,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS
} from 'naive-ui'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from 'vue-i18n'

const themeStore = useThemeStore()
const { locale: currentLocale } = useI18n()

// 主题配置
const theme = computed(() => 
  themeStore.isDark ? darkTheme : null
)

// 语言配置
const locale = computed(() => 
  currentLocale.value === 'zh-CN' ? zhCN : enUS
)

const dateLocale = computed(() => 
  currentLocale.value === 'zh-CN' ? dateZhCN : dateEnUS
)
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow-x: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 暗色主题滚动条 */
.dark ::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.3);
}
</style>