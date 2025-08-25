import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '@/utils/api'
import type { CommunityPost, CommunityComment, PostCreateData } from '@/types'

export interface CommunityStats {
  totalPosts: number
  totalUsers: number
  totalReplies: number
  activeUsers: number
}

export interface PopularTag {
  name: string
  count: number
}

export interface PostsQuery {
  category?: string
  sort?: string
  search?: string
  tag?: string
  page?: number
  limit?: number
}

export const useCommunityStore = defineStore('community', () => {
  // 状态
  const posts = ref<CommunityPost[]>([])
  const currentPost = ref<CommunityPost | null>(null)
  const comments = ref<CommunityComment[]>([])
  const popularTags = ref<PopularTag[]>([])
  const stats = ref<CommunityStats>({
    totalPosts: 0,
    totalUsers: 0,
    totalReplies: 0,
    activeUsers: 0
  })
  const hasMore = ref(true)
  const loading = ref(false)

  // 计算属性
  const sortedPosts = computed(() => {
    return [...posts.value].sort((a, b) => {
      // 置顶帖子优先
      if (a.isSticky && !b.isSticky) return -1
      if (!a.isSticky && b.isSticky) return 1
      
      // 精华帖子次优先
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      
      // 按时间排序
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })

  const postsByCategory = computed(() => {
    return (category: string) => {
      if (category === 'all') return sortedPosts.value
      return sortedPosts.value.filter(post => post.type === category)
    }
  })

  // 动作
  const loadPosts = async (query: PostsQuery = {}) => {
    try {
      loading.value = true
      const response = await request.get('/api/community/posts', { params: query })
      
      posts.value = response.data.posts || []
      hasMore.value = response.data.hasMore || false
      
      return response.data
    } catch (error) {
      console.error('加载帖子失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadMorePosts = async (query: PostsQuery = {}) => {
    try {
      const response = await request.get('/api/community/posts', { params: query })
      
      const newPosts = response.data.posts || []
      posts.value.push(...newPosts)
      hasMore.value = response.data.hasMore || false
      
      return response.data
    } catch (error) {
      console.error('加载更多帖子失败:', error)
      throw error
    }
  }

  const loadPostDetail = async (postId: string) => {
    try {
      const response = await request.get(`/api/community/posts/${postId}`)
      currentPost.value = response.data
      
      // 增加浏览量
      incrementViewCount(postId)
      
      return response.data
    } catch (error) {
      console.error('加载帖子详情失败:', error)
      throw error
    }
  }

  const createPost = async (postData: PostCreateData) => {
    try {
      const response = await request.post('/api/community/posts', postData)
      const newPost = response.data
      
      // 添加到列表头部
      posts.value.unshift(newPost)
      
      // 更新统计
      stats.value.totalPosts++
      
      return newPost
    } catch (error) {
      console.error('创建帖子失败:', error)
      throw error
    }
  }

  const updatePost = async (postId: string, updates: Partial<CommunityPost>) => {
    try {
      const response = await request.put(`/api/community/posts/${postId}`, updates)
      const updatedPost = response.data
      
      // 更新列表中的帖子
      const index = posts.value.findIndex(p => p.id === postId)
      if (index !== -1) {
        posts.value[index] = updatedPost
      }
      
      // 更新当前帖子
      if (currentPost.value?.id === postId) {
        currentPost.value = updatedPost
      }
      
      return updatedPost
    } catch (error) {
      console.error('更新帖子失败:', error)
      throw error
    }
  }

  const deletePost = async (postId: string) => {
    try {
      await request.delete(`/api/community/posts/${postId}`)
      
      // 从列表中移除
      posts.value = posts.value.filter(p => p.id !== postId)
      
      // 清空当前帖子
      if (currentPost.value?.id === postId) {
        currentPost.value = null
      }
      
      // 更新统计
      stats.value.totalPosts--
    } catch (error) {
      console.error('删除帖子失败:', error)
      throw error
    }
  }

  const likePost = async (postId: string) => {
    try {
      const response = await request.post(`/api/community/posts/${postId}/like`)
      const { isLiked, likeCount } = response.data
      
      // 更新列表中的帖子
      const postInList = posts.value.find(p => p.id === postId)
      if (postInList) {
        postInList.isLiked = isLiked
        postInList.likeCount = likeCount
      }
      
      // 更新当前帖子
      if (currentPost.value?.id === postId) {
        currentPost.value.isLiked = isLiked
        currentPost.value.likeCount = likeCount
      }
      
      return { isLiked, likeCount }
    } catch (error) {
      console.error('点赞帖子失败:', error)
      throw error
    }
  }

  const incrementViewCount = async (postId: string) => {
    try {
      await request.post(`/api/community/posts/${postId}/view`)
      
      // 更新本地计数
      const postInList = posts.value.find(p => p.id === postId)
      if (postInList) {
        postInList.viewCount++
      }
      
      if (currentPost.value?.id === postId) {
        currentPost.value.viewCount++
      }
    } catch (error) {
      console.error('更新浏览量失败:', error)
      // 浏览量更新失败不抛出错误
    }
  }

  const loadComments = async (postId: string) => {
    try {
      const response = await request.get(`/api/community/posts/${postId}/comments`)
      comments.value = response.data || []
      return response.data
    } catch (error) {
      console.error('加载评论失败:', error)
      throw error
    }
  }

  const createComment = async (postId: string, content: string, parentId?: string) => {
    try {
      const response = await request.post(`/api/community/posts/${postId}/comments`, {
        content,
        parentId
      })
      
      const newComment = response.data
      
      if (parentId) {
        // 如果是回复，添加到父评论的回复列表
        const parentComment = comments.value.find(c => c.id === parentId)
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = []
          }
          parentComment.replies.push(newComment)
        }
      } else {
        // 如果是顶级评论，添加到评论列表
        comments.value.push(newComment)
      }
      
      // 更新帖子的评论数
      const postInList = posts.value.find(p => p.id === postId)
      if (postInList) {
        postInList.commentCount++
      }
      
      if (currentPost.value?.id === postId) {
        currentPost.value.commentCount++
      }
      
      return newComment
    } catch (error) {
      console.error('创建评论失败:', error)
      throw error
    }
  }

  const likeComment = async (commentId: string) => {
    try {
      const response = await request.post(`/api/community/comments/${commentId}/like`)
      const { isLiked, likeCount } = response.data
      
      // 更新评论状态
      const updateCommentLike = (comments: CommunityComment[]) => {
        for (const comment of comments) {
          if (comment.id === commentId) {
            comment.isLiked = isLiked
            comment.likeCount = likeCount
            return true
          }
          if (comment.replies && updateCommentLike(comment.replies)) {
            return true
          }
        }
        return false
      }
      
      updateCommentLike(comments.value)
      
      return { isLiked, likeCount }
    } catch (error) {
      console.error('点赞评论失败:', error)
      throw error
    }
  }

  const loadPopularTags = async () => {
    try {
      const response = await request.get('/api/community/tags/popular')
      popularTags.value = response.data || []
      return response.data
    } catch (error) {
      console.error('加载热门标签失败:', error)
      throw error
    }
  }

  const loadCommunityStats = async () => {
    try {
      const response = await request.get('/api/community/stats')
      stats.value = response.data || stats.value
      return response.data
    } catch (error) {
      console.error('加载社区统计失败:', error)
      throw error
    }
  }

  const searchPosts = async (keyword: string, filters: any = {}) => {
    try {
      const response = await request.get('/api/community/search', {
        params: { q: keyword, ...filters }
      })
      
      posts.value = response.data.posts || []
      hasMore.value = response.data.hasMore || false
      
      return response.data
    } catch (error) {
      console.error('搜索帖子失败:', error)
      throw error
    }
  }

  const reportPost = async (postId: string, reason: string) => {
    try {
      await request.post(`/api/community/posts/${postId}/report`, { reason })
    } catch (error) {
      console.error('举报帖子失败:', error)
      throw error
    }
  }

  const reportComment = async (commentId: string, reason: string) => {
    try {
      await request.post(`/api/community/comments/${commentId}/report`, { reason })
    } catch (error) {
      console.error('举报评论失败:', error)
      throw error
    }
  }

  // 辅助方法
  const addPost = (post: CommunityPost) => {
    posts.value.unshift(post)
  }

  const getPostById = (postId: string) => {
    return posts.value.find(p => p.id === postId)
  }

  const updatePostInList = (postId: string, updates: Partial<CommunityPost>) => {
    const index = posts.value.findIndex(p => p.id === postId)
    if (index !== -1) {
      posts.value[index] = { ...posts.value[index], ...updates }
    }
  }

  const clearPosts = () => {
    posts.value = []
    hasMore.value = true
  }

  const clearComments = () => {
    comments.value = []
  }

  const clearCurrentPost = () => {
    currentPost.value = null
  }

  return {
    // 状态
    posts,
    currentPost,
    comments,
    popularTags,
    stats,
    hasMore,
    loading,
    
    // 计算属性
    sortedPosts,
    postsByCategory,
    
    // 动作
    loadPosts,
    loadMorePosts,
    loadPostDetail,
    createPost,
    updatePost,
    deletePost,
    likePost,
    incrementViewCount,
    loadComments,
    createComment,
    likeComment,
    loadPopularTags,
    loadCommunityStats,
    searchPosts,
    reportPost,
    reportComment,
    
    // 辅助方法
    addPost,
    getPostById,
    updatePostInList,
    clearPosts,
    clearComments,
    clearCurrentPost
  }
})