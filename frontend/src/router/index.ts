import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

// 懒加载页面组件
const Home = () => import('@/views/Home.vue')
const Levels = () => import('@/views/Levels.vue')
const LevelDetail = () => import('@/views/LevelDetail.vue')
const Community = () => import('@/views/Community.vue')
const CommunityPost = () => import('@/views/CommunityPost.vue')
const Profile = () => import('@/views/Profile.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const Analytics = () => import('@/views/Analytics.vue')
const Teams = () => import('@/views/Teams.vue')
const Assessments = () => import('@/views/Assessments.vue')
const Certificates = () => import('@/views/Certificates.vue')
const Mentors = () => import('@/views/Mentors.vue')
const Settings = () => import('@/views/Settings.vue')
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const NotFound = () => import('@/views/NotFound.vue')

// 管理员页面（按需加载）
const AdminDashboard = () => import('@/views/admin/Dashboard.vue')
const AdminUsers = () => import('@/views/admin/Users.vue')
const AdminLevels = () => import('@/views/admin/Levels.vue')
const AdminAnalytics = () => import('@/views/admin/Analytics.vue')

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      requiresAuth: false,
      preload: true // 预加载重要页面
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false,
      hideNavigation: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册',
      requiresAuth: false,
      hideNavigation: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      title: '学习仪表板',
      requiresAuth: true,
      preload: true
    }
  },
  {
    path: '/levels',
    name: 'Levels',
    component: Levels,
    meta: {
      title: '学习关卡',
      requiresAuth: true,
      preload: true
    }
  },
  {
    path: '/levels/:id',
    name: 'LevelDetail',
    component: LevelDetail,
    props: true,
    meta: {
      title: '关卡详情',
      requiresAuth: true
    }
  },
  {
    path: '/community',
    name: 'Community',
    component: Community,
    meta: {
      title: '学习社区',
      requiresAuth: true
    }
  },
  {
    path: '/community/post/:id',
    name: 'CommunityPost',
    component: CommunityPost,
    props: true,
    meta: {
      title: '社区帖子',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: '个人资料',
      requiresAuth: true
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
    meta: {
      title: '学习分析',
      requiresAuth: true
    }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams,
    meta: {
      title: '团队管理',
      requiresAuth: true,
      roles: ['MENTOR', 'ADMIN'] // 角色权限控制
    }
  },
  {
    path: '/assessments',
    name: 'Assessments',
    component: Assessments,
    meta: {
      title: '技能评估',
      requiresAuth: true
    }
  },
  {
    path: '/certificates',
    name: 'Certificates',
    component: Certificates,
    meta: {
      title: '我的证书',
      requiresAuth: true
    }
  },
  {
    path: '/mentors',
    name: 'Mentors',
    component: Mentors,
    meta: {
      title: '导师中心',
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '设置',
      requiresAuth: true
    }
  },
  // 管理员路由
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: {
      requiresAuth: true,
      roles: ['ADMIN']
    }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: {
      title: '管理后台',
      requiresAuth: true,
      roles: ['ADMIN']
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: {
      title: '用户管理',
      requiresAuth: true,
      roles: ['ADMIN']
    }
  },
  {
    path: '/admin/levels',
    name: 'AdminLevels',
    component: AdminLevels,
    meta: {
      title: '关卡管理',
      requiresAuth: true,
      roles: ['ADMIN']
    }
  },
  {
    path: '/admin/analytics',
    name: 'AdminAnalytics',
    component: AdminAnalytics,
    meta: {
      title: '数据分析',
      requiresAuth: true,
      roles: ['ADMIN']
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const themeStore = useThemeStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ELP学习平台`
  }

  // 检查认证状态
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    // 尝试从token恢复用户状态
    await userStore.initializeAuth()
    
    if (!userStore.isAuthenticated) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 检查角色权限
  if (to.meta.roles && userStore.user) {
    if (!to.meta.roles.includes(userStore.user.role)) {
      next({ name: 'Dashboard' })
      return
    }
  }

  // 已登录用户访问登录/注册页面时重定向到首页
  if ((to.name === 'Login' || to.name === 'Register') && userStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

// 路由后置守卫
router.afterEach((to, from) => {
  // 埋点统计
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_title: to.meta.title,
      page_location: window.location.href
    })
  }

  // 预加载下一个可能访问的页面
  preloadNextRoutes(to)
})

// 预加载策略
const preloadNextRoutes = (currentRoute: any) => {
  const preloadMap: Record<string, string[]> = {
    'Home': ['Dashboard', 'Levels'],
    'Dashboard': ['Levels', 'Analytics'],
    'Levels': ['LevelDetail', 'Community'],
    'Community': ['CommunityPost', 'Profile'],
    'LevelDetail': ['Levels', 'Analytics']
  }

  const routesToPreload = preloadMap[currentRoute.name as string] || []
  
  routesToPreload.forEach(routeName => {
    const route = routes.find(r => r.name === routeName)
    if (route && typeof route.component === 'function') {
      // 延迟预加载，避免影响当前页面性能
      setTimeout(() => {
        (route.component as Function)().catch(() => {
          // 预加载失败不影响用户体验
        })
      }, 1000)
    }
  })
}

// 路由懒加载错误处理
const originalRouterPush = router.push
router.push = function push(location) {
  return originalRouterPush.call(this, location).catch((error) => {
    // 处理路由重复导航错误
    if (error.name !== 'NavigationDuplicated') {
      throw error
    }
  })
}

// 动态路由添加（用于插件系统）
export const addDynamicRoute = (route: any) => {
  router.addRoute(route)
}

// 移除动态路由
export const removeDynamicRoute = (routeName: string) => {
  router.removeRoute(routeName)
}

// 路由元信息类型定义
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: string[]
    hideNavigation?: boolean
    preload?: boolean
    keepAlive?: boolean
  }
}

export default router