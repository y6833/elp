import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始数据库种子数据初始化...')

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  清理现有数据...')
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.mentorSession.deleteMany()
    await prisma.studyGroupMember.deleteMany()
    await prisma.studyGroup.deleteMany()
    await prisma.follow.deleteMany()
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.communityPost.deleteMany()
    await prisma.userAchievement.deleteMany()
    await prisma.achievement.deleteMany()
    await prisma.learningProgress.deleteMany()
    await prisma.level.deleteMany()
    await prisma.user.deleteMany()
    await prisma.systemConfig.deleteMany()
  }

  // 创建管理员用户
  console.log('👤 创建管理员用户...')
  const adminPassword = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@elp.dev',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      bio: '系统管理员',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
    }
  })

  // 创建导师用户
  console.log('👨‍🏫 创建导师用户...')
  const mentorPassword = await bcrypt.hash('mentor123456', 12)
  const mentor = await prisma.user.create({
    data: {
      username: 'mentor_zhang',
      email: 'mentor@elp.dev',
      passwordHash: mentorPassword,
      role: 'MENTOR',
      isEmailVerified: true,
      bio: '前端工程化专家，5年以上经验',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mentor'
    }
  })

  // 创建学生用户
  console.log('👨‍🎓 创建学生用户...')
  const studentPassword = await bcrypt.hash('student123456', 12)
  const students = await Promise.all([
    prisma.user.create({
      data: {
        username: 'student_li',
        email: 'student1@elp.dev',
        passwordHash: studentPassword,
        role: 'STUDENT',
        isEmailVerified: true,
        bio: '前端开发初学者',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1'
      }
    }),
    prisma.user.create({
      data: {
        username: 'student_wang',
        email: 'student2@elp.dev',
        passwordHash: studentPassword,
        role: 'STUDENT',
        isEmailVerified: true,
        bio: '正在学习Vue.js',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2'
      }
    })
  ])

  // 创建关卡数据
  console.log('📚 创建关卡数据...')
  
  // Webpack关卡
  const webpackLevels = await Promise.all([
    prisma.level.create({
      data: {
        title: 'Webpack 基础配置',
        description: '学习Webpack的基本配置，包括入口、输出和基础loader',
        category: 'WEBPACK',
        difficulty: 'BEGINNER',
        estimatedTime: 30,
        prerequisites: [],
        objectives: [
          '理解Webpack的基本概念',
          '掌握entry和output配置',
          '学会配置基础loader'
        ],
        tags: ['webpack', 'basic', 'configuration'],
        content: {
          markdown: `# Webpack 基础配置\n\n本关卡将教你如何配置一个基本的Webpack项目...`,
          examples: []
        },
        hints: [
          { type: 'tip', content: '记住Webpack是一个模块打包工具' },
          { type: 'info', content: 'entry是打包的入口文件' }
        ],
        solution: `const path = require('path');\nmodule.exports = {\n  entry: './src/index.js',\n  output: {\n    path: path.resolve(__dirname, 'dist'),\n    filename: 'bundle.js'\n  }\n};`,
        validation: {
          type: 'webpack',
          rules: [
            { name: 'has_entry', required: true },
            { name: 'has_output', required: true }
          ]
        },
        resources: [],
        order: 1
      }
    }),
    prisma.level.create({
      data: {
        title: 'Webpack Loaders',
        description: '学习如何使用各种loader处理不同类型的文件',
        category: 'WEBPACK',
        difficulty: 'BEGINNER',
        estimatedTime: 45,
        prerequisites: [],
        objectives: [
          '理解loader的作用',
          '配置CSS loader',
          '配置文件loader'
        ],
        tags: ['webpack', 'loaders', 'css'],
        content: {
          markdown: `# Webpack Loaders\n\nLoader让Webpack能够处理非JavaScript文件...`,
          examples: []
        },
        hints: [
          { type: 'tip', content: 'Loader从右到左执行' },
          { type: 'warning', content: '注意loader的执行顺序' }
        ],
        solution: `module.exports = {\n  module: {\n    rules: [\n      {\n        test: /\\.css$/,\n        use: ['style-loader', 'css-loader']\n      }\n    ]\n  }\n};`,
        validation: {
          type: 'webpack',
          rules: [
            { name: 'has_css_loader', required: true },
            { name: 'loader_order_correct', required: true }
          ]
        },
        resources: [],
        order: 2
      }
    })
  ])

  // Vite关卡
  const viteLevels = await Promise.all([
    prisma.level.create({
      data: {
        title: 'Vite 项目初始化',
        description: '学习如何创建和配置Vite项目',
        category: 'VITE',
        difficulty: 'BEGINNER',
        estimatedTime: 20,
        prerequisites: [],
        objectives: [
          '了解Vite的优势',
          '创建Vite项目',
          '基础配置'
        ],
        tags: ['vite', 'setup', 'configuration'],
        content: {
          markdown: `# Vite 项目初始化\n\nVite是下一代前端构建工具...`,
          examples: []
        },
        hints: [
          { type: 'tip', content: 'Vite基于ESM构建' },
          { type: 'info', content: '开发服务器启动极快' }
        ],
        solution: `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\n\nexport default defineConfig({\n  plugins: [vue()]\n})`,
        validation: {
          type: 'vite',
          rules: [
            { name: 'has_vue_plugin', required: true },
            { name: 'uses_define_config', required: true }
          ]
        },
        resources: [],
        order: 1
      }
    })
  ])

  // 创建成就数据
  console.log('🏆 创建成就数据...')
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        title: '初出茅庐',
        description: '完成第一个关卡',
        icon: 'trophy',
        type: 'COMPLETION',
        condition: {
          type: 'levels_completed',
          target: 1
        },
        reward: {
          type: 'badge',
          value: 'first_level'
        },
        rarity: 'COMMON'
      }
    }),
    prisma.achievement.create({
      data: {
        title: 'Webpack大师',
        description: '完成所有Webpack关卡',
        icon: 'webpack',
        type: 'COMPLETION',
        condition: {
          type: 'category_completed',
          target: 'WEBPACK'
        },
        reward: {
          type: 'title',
          value: 'Webpack Master'
        },
        rarity: 'EPIC'
      }
    }),
    prisma.achievement.create({
      data: {
        title: '连续学习者',
        description: '连续学习7天',
        icon: 'calendar',
        type: 'STREAK',
        condition: {
          type: 'daily_streak',
          target: 7
        },
        reward: {
          type: 'badge',
          value: 'week_streak'
        },
        rarity: 'RARE'
      }
    })
  ])

  // 创建学习进度
  console.log('📈 创建学习进度...')
  await prisma.learningProgress.create({
    data: {
      userId: students[0].id,
      levelId: webpackLevels[0].id,
      status: 'COMPLETED',
      attempts: 3,
      timeSpent: 1800, // 30分钟
      score: 85,
      bestScore: 85,
      code: `const path = require('path');\nmodule.exports = {\n  entry: './src/index.js',\n  output: {\n    path: path.resolve(__dirname, 'dist'),\n    filename: 'bundle.js'\n  }\n};`,
      completedAt: new Date()
    }
  })

  // 创建用户成就
  await prisma.userAchievement.create({
    data: {
      userId: students[0].id,
      achievementId: achievements[0].id,
      progress: 100,
      unlockedAt: new Date()
    }
  })

  // 创建社区帖子
  console.log('💬 创建社区帖子...')
  const posts = await Promise.all([
    prisma.communityPost.create({
      data: {
        authorId: mentor.id,
        title: '欢迎来到ELP学习社区！',
        content: '大家好！欢迎加入ELP前端工程化学习平台。在这里我们可以分享学习心得，互相帮助...',
        type: 'DISCUSSION',
        category: 'welcome',
        tags: ['welcome', 'community'],
        isSticky: true,
        viewCount: 156,
        likeCount: 23,
        commentCount: 8
      }
    }),
    prisma.communityPost.create({
      data: {
        authorId: students[0].id,
        title: 'Webpack配置问题求助',
        content: '我在配置Webpack的时候遇到了问题，希望大家能帮忙看看...',
        type: 'QUESTION',
        category: 'webpack',
        tags: ['webpack', 'help', 'configuration'],
        levelId: webpackLevels[0].id,
        viewCount: 42,
        likeCount: 5,
        commentCount: 3
      }
    })
  ])

  // 创建评论
  await prisma.comment.create({
    data: {
      postId: posts[1].id,
      authorId: mentor.id,
      content: '可以检查一下你的loader配置，看起来像是CSS loader的顺序问题。',
      likeCount: 2
    }
  })

  // 创建学习小组
  console.log('👥 创建学习小组...')
  const studyGroup = await prisma.studyGroup.create({
    data: {
      name: 'Webpack学习小组',
      description: '专注于Webpack学习和实践的小组',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=webpack-group',
      maxMembers: 20
    }
  })

  // 添加小组成员
  await Promise.all([
    prisma.studyGroupMember.create({
      data: {
        groupId: studyGroup.id,
        userId: mentor.id,
        role: 'OWNER'
      }
    }),
    prisma.studyGroupMember.create({
      data: {
        groupId: studyGroup.id,
        userId: students[0].id,
        role: 'MEMBER'
      }
    })
  ])

  // 创建系统配置
  console.log('⚙️ 创建系统配置...')
  await Promise.all([
    prisma.systemConfig.create({
      data: {
        key: 'platform_name',
        value: 'ELP - 前端工程化学习平台'
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'max_file_upload_size',
        value: 10485760 // 10MB
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'enable_community',
        value: true
      }
    }),
    prisma.systemConfig.create({
      data: {
        key: 'enable_mentor_system',
        value: true
      }
    })
  ])

  // 创建通知
  await prisma.notification.create({
    data: {
      userId: students[0].id,
      type: 'ACHIEVEMENT_UNLOCKED',
      title: '成就解锁！',
      content: '恭喜你解锁了"初出茅庐"成就！',
      data: {
        achievementId: achievements[0].id
      }
    }
  })

  console.log('✅ 数据库种子数据初始化完成！')
  console.log(`
📊 数据统计:
- 用户: ${3} 个 (1个管理员, 1个导师, 2个学生)
- 关卡: ${webpackLevels.length + viteLevels.length} 个
- 成就: ${achievements.length} 个
- 帖子: ${posts.length} 个
- 学习小组: 1 个

🔑 测试账号:
- 管理员: admin@elp.dev / admin123456
- 导师: mentor@elp.dev / mentor123456  
- 学生: student1@elp.dev / student123456
- 学生: student2@elp.dev / student123456
  `)
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })