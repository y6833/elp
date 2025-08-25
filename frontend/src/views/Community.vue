<template>
  <div class="community-page">
    <!-- 社区头部 -->
    <div class="community-header">
      <div class="header-content">
        <h1 class="page-title">学习社区</h1>
        <p class="page-subtitle">与同学分享经验，共同成长</p>
        
        <div class="community-stats">
          <div class="stat-item">
            <span class="stat-number">{{ communityStats.totalPosts }}</span>
            <span class="stat-label">讨论</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ communityStats.totalUsers }}</span>
            <span class="stat-label">成员</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ communityStats.totalReplies }}</span>
            <span class="stat-label">回复</span>
          </div>
        </div>
      </div>
      
      <n-button type="primary" @click="showCreatePost = true">
        <template #icon>
          <Icon name="plus" />
        </template>
        发起讨论
      </n-button>
    </div>

    <!-- 分类导航 -->
    <div class="category-nav">
      <n-tabs 
        v-model:value="activeCategory" 
        type="line" 
        @update:value="loadPosts"
      >
        <n-tab name="all">全部</n-tab>
        <n-tab name="discussion">讨论</n-tab>
        <n-tab name="question">问答</n-tab>
        <n-tab name="share">分享</n-tab>
        <n-tab name="showcase">作品展示</n-tab>
        <n-tab name="help">求助</n-tab>
      </n-tabs>
      
      <div class="nav-actions">
        <n-select
          v-model:value="sortBy"
          :options="sortOptions"
          size="small"
          style="width: 120px"
          @update:value="loadPosts"
        />
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索讨论..."
          size="small"
          style="width: 200px"
          @keyup.enter="loadPosts"
        >
          <template #prefix>
            <Icon name="search" />
          </template>
        </n-input>
      </div>
    </div>

    <!-- 热门标签 -->
    <div class="popular-tags">
      <span class="tags-label">热门标签:</span>
      <n-tag
        v-for="tag in popularTags"
        :key="tag.name"
        :type="selectedTag === tag.name ? 'primary' : 'default'"
        size="small"
        closable
        @click="selectTag(tag.name)"
        @close="removeTag(tag.name)"
      >
        {{ tag.name }} ({{ tag.count }})
      </n-tag>
    </div>

    <!-- 帖子列表 -->
    <div class="posts-container">
      <n-spin :show="loading">
        <div class="posts-list">
          <CommunityPost
            v-for="post in posts"
            :key="post.id"
            :post="post"
            @like="handleLikePost"
            @reply="handleReplyPost"
            @click="goToPostDetail"
          />
        </div>
        
        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <n-button 
            :loading="loadingMore" 
            @click="loadMorePosts"
          >
            加载更多
          </n-button>
        </div>
        
        <!-- 空状态 -->
        <n-empty
          v-if="!loading && posts.length === 0"
          description="暂无讨论，来发起第一个话题吧！"
        >
          <template #extra>
            <n-button type="primary" @click="showCreatePost = true">
              发起讨论
            </n-button>
          </template>
        </n-empty>
      </n-spin>
    </div>

    <!-- 创建帖子模态框 -->
    <CreatePostModal
      v-model:show="showCreatePost"
      @created="handlePostCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCommunityStore } from '@/stores/community'
import { useUserStore } from '@/stores/user'
import { useMessage } from 'naive-ui'
import CommunityPost from '@/components/business/CommunityPost.vue'
import CreatePostModal from '@/components/business/CreatePostModal.vue'
import Icon from '@/components/ui/Icon.vue'
import type { CommunityPost as Post } from '@/types'

const router = useRouter()
const communityStore = useCommunityStore()
const userStore = useUserStore()
const message = useMessage()

// 响应式数据
const loading = ref(false)
const loadingMore = ref(false)
const showCreatePost = ref(false)
const activeCategory = ref('all')
const sortBy = ref('latest')
const searchKeyword = ref('')
const selectedTag = ref('')
const currentPage = ref(1)
const pageSize = 20

// 计算属性
const posts = computed(() => communityStore.posts)
const popularTags = computed(() => communityStore.popularTags)
const communityStats = computed(() => communityStore.stats)
const hasMore = computed(() => communityStore.hasMore)

// 排序选项
const sortOptions = [
  { label: '最新发布', value: 'latest' },
  { label: '最多回复', value: 'replies' },
  { label: '最多点赞', value: 'likes' },
  { label: '最多查看', value: 'views' }
]

// 生命周期
onMounted(() => {
  loadInitialData()
})

// 加载初始数据
const loadInitialData = async () => {
  loading.value = true
  try {
    await Promise.all([
      communityStore.loadPosts({
        category: activeCategory.value,
        sort: sortBy.value,
        page: 1,
        limit: pageSize
      }),
      communityStore.loadPopularTags(),
      communityStore.loadCommunityStats()
    ])
  } catch (error) {
    console.error('加载社区数据失败:', error)
    message.error('加载社区数据失败')
  } finally {
    loading.value = false
  }
}

// 加载帖子
const loadPosts = async () => {
  loading.value = true
  currentPage.value = 1
  
  try {
    await communityStore.loadPosts({
      category: activeCategory.value === 'all' ? undefined : activeCategory.value,
      sort: sortBy.value,
      search: searchKeyword.value,
      tag: selectedTag.value,
      page: currentPage.value,
      limit: pageSize
    })
  } catch (error) {
    console.error('加载帖子失败:', error)
    message.error('加载帖子失败')
  } finally {
    loading.value = false
  }
}

// 加载更多帖子
const loadMorePosts = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  currentPage.value++
  
  try {
    await communityStore.loadMorePosts({
      category: activeCategory.value === 'all' ? undefined : activeCategory.value,
      sort: sortBy.value,
      search: searchKeyword.value,
      tag: selectedTag.value,
      page: currentPage.value,
      limit: pageSize
    })
  } catch (error) {
    console.error('加载更多帖子失败:', error)
    message.error('加载更多帖子失败')
    currentPage.value--
  } finally {
    loadingMore.value = false
  }
}

// 选择标签
const selectTag = (tagName: string) => {
  selectedTag.value = selectedTag.value === tagName ? '' : tagName
  loadPosts()
}

// 移除标签
const removeTag = (tagName: string) => {
  selectedTag.value = ''
  loadPosts()
}

// 点赞帖子
const handleLikePost = async (postId: string) => {
  try {
    await communityStore.likePost(postId)
    message.success('操作成功')
  } catch (error) {
    console.error('点赞失败:', error)
    message.error('操作失败')
  }
}

// 回复帖子
const handleReplyPost = (postId: string) => {
  router.push(`/community/post/${postId}`)
}

// 跳转到帖子详情
const goToPostDetail = (post: Post) => {
  router.push(`/community/post/${post.id}`)
}

// 帖子创建成功
const handlePostCreated = (post: Post) => {
  showCreatePost.value = false
  communityStore.addPost(post)
  message.success('发布成功')
}
</script>

<style scoped>
.community-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  padding: 24px 0;
  border-bottom: 1px solid var(--border-color);
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color-primary);
}

.page-subtitle {
  margin: 0 0 16px 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.community-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 4px;
}

.category-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.popular-tags {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--card-background);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.tags-label {
  font-weight: 500;
  color: var(--text-color-primary);
  margin-right: 12px;
}

.popular-tags .n-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.popular-tags .n-tag:hover {
  transform: translateY(-1px);
}

.posts-container {
  min-height: 400px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .community-page {
    padding: 16px;
  }
  
  .community-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .community-stats {
    gap: 16px;
  }
  
  .category-nav {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .nav-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .nav-actions .n-input,
  .nav-actions .n-select {
    width: 100% !important;
  }
  
  .popular-tags {
    padding: 12px;
  }
  
  .posts-list {
    gap: 12px;
  }
}

/* 暗色主题适配 */
.dark .community-header {
  border-bottom-color: var(--border-color-dark);
}

.dark .category-nav {
  border-bottom-color: var(--border-color-dark);
}

.dark .popular-tags {
  background: var(--card-background-dark);
  border-color: var(--border-color-dark);
}
</style>