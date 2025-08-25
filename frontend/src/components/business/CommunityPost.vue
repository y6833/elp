<template>
  <div class="community-post" :class="{ 'is-sticky': post.isSticky, 'is-pinned': post.isPinned }">
    <!-- 帖子头部 -->
    <div class="post-header">
      <div class="author-info">
        <n-avatar 
          :src="post.author.avatar" 
          :fallback-src="'/images/default-avatar.png'"
          :size="40"
          round
        />
        <div class="author-details">
          <div class="author-name">{{ post.author.username }}</div>
          <div class="post-meta">
            <span class="post-time">{{ formatTime(post.createdAt) }}</span>
            <n-tag v-if="post.category" size="small" type="info">
              {{ getCategoryLabel(post.category) }}
            </n-tag>
            <n-tag v-if="post.isSticky" size="small" type="warning">置顶</n-tag>
            <n-tag v-if="post.isPinned" size="small" type="success">精华</n-tag>
          </div>
        </div>
      </div>
      
      <div class="post-actions">
        <n-dropdown :options="postMenuOptions" @select="handleMenuSelect">
          <n-button quaternary circle size="small">
            <template #icon>
              <Icon name="more-vertical" />
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </div>

    <!-- 帖子内容 -->
    <div class="post-content" @click="$emit('click', post)">
      <h3 class="post-title">{{ post.title }}</h3>
      
      <div class="post-body">
        <div v-if="post.content.length > 200 && !expanded" class="content-preview">
          {{ post.content.substring(0, 200) }}...
          <n-button text type="primary" @click.stop="expanded = true">
            展开阅读
          </n-button>
        </div>
        <div v-else class="content-full">
          {{ post.content }}
          <n-button 
            v-if="post.content.length > 200" 
            text 
            type="primary" 
            @click.stop="expanded = false"
          >
            收起
          </n-button>
        </div>
      </div>

      <!-- 代码展示 -->
      <div v-if="post.code" class="post-code">
        <div class="code-header">
          <span class="code-language">{{ post.language || 'javascript' }}</span>
          <n-button size="small" quaternary @click.stop="copyCode">
            <template #icon>
              <Icon name="copy" />
            </template>
            复制
          </n-button>
        </div>
        <pre><code :class="`language-${post.language || 'javascript'}`">{{ post.code }}</code></pre>
      </div>

      <!-- 标签 -->
      <div v-if="post.tags.length > 0" class="post-tags">
        <n-tag
          v-for="tag in post.tags"
          :key="tag"
          size="small"
          @click.stop="$emit('tag-click', tag)"
        >
          #{{ tag }}
        </n-tag>
      </div>
    </div>

    <!-- 帖子底部统计和操作 -->
    <div class="post-footer">
      <div class="post-stats">
        <span class="stat-item">
          <Icon name="eye" />
          {{ post.viewCount }}
        </span>
        <span class="stat-item">
          <Icon name="message-circle" />
          {{ post.commentCount }}
        </span>
      </div>
      
      <div class="post-actions">
        <n-button
          :type="post.isLiked ? 'primary' : 'default'"
          quaternary
          size="small"
          @click.stop="$emit('like', post.id)"
        >
          <template #icon>
            <Icon :name="post.isLiked ? 'heart-filled' : 'heart'" />
          </template>
          {{ post.likeCount }}
        </n-button>
        
        <n-button
          quaternary
          size="small"
          @click.stop="$emit('reply', post.id)"
        >
          <template #icon>
            <Icon name="message-circle" />
          </template>
          回复
        </n-button>
        
        <n-button
          quaternary
          size="small"
          @click.stop="sharePost"
        >
          <template #icon>
            <Icon name="share" />
          </template>
          分享
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import Icon from '@/components/ui/Icon.vue'
import type { CommunityPost } from '@/types'

export interface Props {
  post: CommunityPost
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [post: CommunityPost]
  like: [postId: string]
  reply: [postId: string]
  'tag-click': [tag: string]
  report: [postId: string]
  delete: [postId: string]
}>()

const message = useMessage()
const userStore = useUserStore()

// 响应式数据
const expanded = ref(false)

// 计算属性
const postMenuOptions = computed(() => {
  const options = [
    {
      label: '分享',
      key: 'share',
      icon: () => h(Icon, { name: 'share' })
    },
    {
      label: '举报',
      key: 'report',
      icon: () => h(Icon, { name: 'flag' })
    }
  ]

  // 如果是作者本人，添加删除选项
  if (props.post.author.id === userStore.user?.id) {
    options.push({
      label: '删除',
      key: 'delete',
      icon: () => h(Icon, { name: 'trash' })
    })
  }

  return options
})

// 方法
const formatTime = (time: string | Date): string => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  
  // 大于7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getCategoryLabel = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'discussion': '讨论',
    'question': '问答',
    'share': '分享',
    'showcase': '作品展示',
    'help': '求助'
  }
  return categoryMap[category] || category
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.post.code || '')
    message.success('代码已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败')
  }
}

const sharePost = async () => {
  const url = `${window.location.origin}/community/post/${props.post.id}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.post.title,
        text: props.post.content.substring(0, 100),
        url
      })
    } catch (error) {
      if (error.name !== 'AbortError') {
        copyUrlToClipboard(url)
      }
    }
  } else {
    copyUrlToClipboard(url)
  }
}

const copyUrlToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    message.success('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制链接失败:', error)
    message.error('复制链接失败')
  }
}

const handleMenuSelect = (key: string) => {
  switch (key) {
    case 'share':
      sharePost()
      break
    case 'report':
      emit('report', props.post.id)
      break
    case 'delete':
      emit('delete', props.post.id)
      break
  }
}
</script>

<style scoped>
.community-post {
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.community-post:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.community-post.is-sticky {
  border-left: 4px solid var(--warning-color);
}

.community-post.is-pinned {
  border-left: 4px solid var(--success-color);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-weight: 600;
  color: var(--text-color-primary);
  font-size: 0.9rem;
}

.post-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.post-time {
  color: var(--text-color-secondary);
}

.post-content {
  margin-bottom: 16px;
}

.post-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.post-body {
  color: var(--text-color-primary);
  line-height: 1.6;
  word-break: break-word;
}

.content-preview,
.content-full {
  white-space: pre-wrap;
}

.post-code {
  margin: 16px 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--code-background);
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--code-header-background);
  border-bottom: 1px solid var(--border-color);
}

.code-language {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  font-weight: 500;
}

.post-code pre {
  margin: 0;
  padding: 16px;
  background: transparent;
  overflow-x: auto;
  font-size: 0.85rem;
  line-height: 1.5;
}

.post-code code {
  background: transparent;
  padding: 0;
  font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.post-tags .n-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.post-tags .n-tag:hover {
  transform: translateY(-1px);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.post-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.post-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .community-post {
    padding: 16px;
  }
  
  .post-header {
    margin-bottom: 12px;
  }
  
  .author-info {
    gap: 8px;
  }
  
  .post-title {
    font-size: 1rem;
  }
  
  .post-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .post-stats,
  .post-actions {
    justify-content: center;
  }
  
  .code-header {
    padding: 6px 8px;
  }
  
  .post-code pre {
    padding: 12px;
    font-size: 0.8rem;
  }
}

/* 暗色主题适配 */
.dark .community-post {
  background: var(--card-background-dark);
  border-color: var(--border-color-dark);
}

.dark .community-post:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dark .post-footer {
  border-top-color: var(--border-color-dark);
}

.dark .post-code {
  border-color: var(--border-color-dark);
  background: var(--code-background-dark);
}

.dark .code-header {
  background: var(--code-header-background-dark);
  border-bottom-color: var(--border-color-dark);
}
</style>