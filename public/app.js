// 全局状态管理
class AppState {
    constructor() {
        this.currentLevel = null;
        this.progress = this.loadProgress();
        this.currentCategory = 'all';
        this.editor = null;
        this.currentFile = 'webpack.config.js';
        this.files = {};
        this.currentView = 'home'; // 'home', 'levels', 'progress', 'achievements'
        this.levels = {};
        this.attemptCount = 0; // 记录提交次数
        this.maxAttempts = 3; // 最大尝试次数
        this.showingSolution = false; // 是否正在显示答案
    }

    loadProgress() {
        return JSON.parse(localStorage.getItem('learning-progress') || '{}');
    }

    saveProgress() {
        localStorage.setItem('learning-progress', JSON.stringify(this.progress));
    }
}

// 全局应用实例
const app = new AppState();

// 学习平台主类
class LearningPlatform {
    constructor() {
        this.init();
    }

    async init() {
        console.log('初始化学习平台...');
        await this.loadLevels();
        this.bindEvents();
        this.updateProgressDisplay();
        this.showLevels();
    }

    async loadLevels() {
        try {
            console.log('正在加载关卡数据...');
            const response = await fetch('/api/levels');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            app.levels = await response.json();
            console.log('关卡数据加载成功:', app.levels);
        } catch (error) {
            console.error('加载关卡失败:', error);
            // 提供默认数据以便测试
            app.levels = {
                webpack: [
                    'level-01-basic', 'level-02-loaders', 'level-03-plugins', 
                    'level-04-optimization', 'level-05-performance', 'level-06-multi-env',
                    'level-07-module-federation', 'level-08-custom-loader', 
                    'level-09-custom-plugin', 'level-10-enterprise',
                    'level-11-debugging', 'level-12-hot-reload', 'level-13-typescript'
                ],
                vite: [
                    'level-01-basic', 'level-02-plugins', 'level-03-build',
                    'level-04-multi-framework', 'level-05-library-mode', 'level-06-ssr',
                    'level-07-monorepo', 'level-08-production-optimization',
                    'level-09-testing', 'level-10-pwa'
                ],
                'build-tools': ['level-01-rollup', 'level-02-parcel', 'level-03-esbuild'],
                'package-managers': ['level-01-npm', 'level-02-yarn', 'level-03-pnpm'],
                'ci-cd': ['level-01-github-actions', 'level-02-gitlab-ci'],
                'testing': ['level-01-jest', 'level-02-cypress'],
                'performance': ['level-01-lighthouse', 'level-02-bundle-analysis'],
                'deployment': ['level-01-netlify', 'level-02-vercel']
            };
        }
    }

    bindEvents() {
        // 导航事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });

        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterLevels(category);
            });
        });

        // 返回按钮
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showLevels();
            });
        }

        // 绑定关卡详情页面的按钮事件
        this.bindLevelDetailEvents();

        // 滚动效果
        window.addEventListener('scroll', this.handleScroll);
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    }

    showSection(sectionId) {
        // 隐藏所有区域
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });

        // 隐藏关卡详情页面
        const levelDetail = document.getElementById('level-detail');
        if (levelDetail) {
            levelDetail.style.display = 'none';
        }

        // 显示目标区域
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            app.currentView = sectionId;
            
            // 如果是进度页面，更新进度数据
            if (sectionId === 'progress') {
                this.updateDetailedProgress();
            }
            
            // 如果是成就页面，更新成就数据
            if (sectionId === 'achievements') {
                this.updateAchievements();
            }
        }

        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`)?.classList.add('active');
    }

    filterLevels(category) {
        app.currentCategory = category;
        
        // 更新标签页状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // 重新渲染关卡
        this.renderLevels();
    }

    showLevels() {
        // 隐藏关卡详情
        document.getElementById('level-detail').style.display = 'none';
        
        // 显示关卡列表
        document.getElementById('levels').style.display = 'block';
        
        this.renderLevels();
    }

    renderLevels() {
        const grid = document.getElementById('levels-grid');
        if (!grid) return;

        grid.innerHTML = '';

        // 获取要显示的关卡
        let levelsToShow = [];
        if (app.currentCategory === 'all') {
            // 显示所有关卡
            Object.keys(app.levels).forEach(category => {
                app.levels[category].forEach(levelId => {
                    levelsToShow.push({ category, levelId });
                });
            });
        } else {
            // 显示特定分类的关卡
            if (app.levels[app.currentCategory]) {
                app.levels[app.currentCategory].forEach(levelId => {
                    levelsToShow.push({ category: app.currentCategory, levelId });
                });
            }
        }

        // 渲染关卡卡片
        levelsToShow.forEach(({ category, levelId }, index) => {
            const card = this.createLevelCard(category, levelId, index);
            grid.appendChild(card);
        });
    }

    createLevelCard(category, levelId, index) {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.style.animationDelay = `${index * 0.1}s`;

        // 获取关卡进度
        const progress = app.progress[levelId] || { completed: false, progress: 0 };
        
        // 模拟关卡数据
        const levelData = this.getLevelData(category, levelId);

        card.innerHTML = `
            <div class="level-header">
                <div>
                    <h3 class="level-title">${levelData.title}</h3>
                    <span class="level-category">${this.getCategoryName(category)}</span>
                </div>
            </div>
            <p class="level-description">${levelData.description}</p>
            <div class="level-meta">
                <span class="level-difficulty difficulty-${levelData.difficulty.toLowerCase()}">${levelData.difficulty}</span>
                <span class="level-time">⏱️ ${levelData.estimatedTime}</span>
            </div>
            <div class="level-progress">
                <div class="level-progress-fill" style="width: ${progress.progress}%"></div>
            </div>
            <div class="level-status ${progress.completed ? 'status-completed' : 'status-in-progress'}">
                ${progress.completed ? '✅ 已完成' : '🚀 开始学习'}
            </div>
        `;

        card.addEventListener('click', () => {
            this.openLevel(category, levelId);
        });

        return card;
    }

    getLevelData(category, levelId) {
        // 模拟关卡数据，实际应该从API获取
        const levelNumber = levelId.match(/level-(\d+)/)?.[1] || '01';
        const titles = {
            webpack: {
                '01': 'Webpack 基础配置',
                '02': 'Loader 配置',
                '03': 'Plugin 系统',
                '04': '代码分割优化',
                '05': '性能优化',
                '06': '多环境配置',
                '07': '模块联邦',
                '08': '自定义 Loader',
                '09': '自定义 Plugin',
                '10': '企业级配置',
                '11': '调试与错误排查',
                '12': '热重载配置',
                '13': 'TypeScript 集成'
            },
            vite: {
                '01': 'Vite 基础配置',
                '02': '插件生态',
                '03': '构建优化',
                '04': '多框架支持',
                '05': '库模式构建',
                '06': 'SSR 服务端渲染',
                '07': 'Monorepo 管理',
                '08': '生产环境优化',
                '09': '测试环境配置',
                '10': 'PWA 应用开发'
            }
        };

        const title = titles[category]?.[levelNumber] || `${category} Level ${levelNumber}`;
        
        return {
            title,
            description: `学习 ${title} 的核心概念和实战应用`,
            difficulty: levelNumber <= '03' ? 'Beginner' : levelNumber <= '07' ? 'Intermediate' : 'Advanced',
            estimatedTime: `${20 + parseInt(levelNumber) * 5}分钟`
        };
    }

    getCategoryName(category) {
        const names = {
            webpack: 'Webpack',
            vite: 'Vite',
            'build-tools': '构建工具',
            'package-managers': '包管理器',
            'ci-cd': 'CI/CD',
            testing: '测试',
            performance: '性能优化',
            deployment: '部署'
        };
        return names[category] || category;
    }

    async openLevel(category, levelId) {
        try {
            // 重置关卡状态
            app.attemptCount = 0;
            app.showingSolution = false;
            
            // 显示关卡详情页面
            document.getElementById('levels').style.display = 'none';
            document.getElementById('level-detail').style.display = 'block';

            // 加载关卡配置
            const response = await fetch(`/api/levels/${category}/${levelId}`);
            if (!response.ok) {
                throw new Error('关卡加载失败');
            }
            
            const levelConfig = await response.json();
            app.currentLevel = levelConfig;

            // 更新页面内容
            document.getElementById('level-title').textContent = levelConfig.title;
            document.getElementById('level-description').innerHTML = this.formatDescription(levelConfig);

            // 重置按钮状态
            document.getElementById('next-btn').style.display = 'none';
            this.showSolutionButton(false);
            document.getElementById('output').innerHTML = '';
            
            // 隐藏提示和答案说明
            document.getElementById('hints-section').style.display = 'none';
            this.hideSolutionExplanation();

            // 初始化代码编辑器
            this.initEditor();

        } catch (error) {
            console.error('打开关卡失败:', error);
            alert('关卡加载失败，请稍后重试');
        }
    }

    formatDescription(levelConfig) {
        let html = '';
        
        // 场景描述
        if (levelConfig.scenario) {
            html += `
                <div class="scenario-section">
                    <h3>🎯 实战场景</h3>
                    <p class="scenario-text">${levelConfig.scenario}</p>
                </div>
            `;
        }
        
        // 学习目标
        html += `
            <div class="objectives-section">
                <h3>📚 学习目标</h3>
                <ul class="objectives-list">
                    ${levelConfig.learningObjectives?.map(obj => `<li>${obj}</li>`).join('') || '<li>掌握核心概念</li>'}
                </ul>
            </div>
        `;
        
        // 任务列表
        html += `
            <div class="tasks-section">
                <h3>✅ 任务清单</h3>
                <div class="tasks-list">
                    ${levelConfig.tasks?.map((task, index) => `
                        <div class="task-item">
                            <h4>${task.title}</h4>
                            <p class="task-description">${task.description}</p>
                            ${task.detailedInstructions ? `
                                <details class="task-details">
                                    <summary>📋 详细步骤</summary>
                                    <ul>
                                        ${task.detailedInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
                                    </ul>
                                </details>
                            ` : ''}
                        </div>
                    `).join('') || '<div class="task-item"><h4>完成配置任务</h4></div>'}
                </div>
            </div>
        `;
        
        // 预计时间和难度
        html += `
            <div class="meta-section">
                <div class="meta-item">
                    <span class="meta-label">⏱️ 预计时间:</span>
                    <span class="meta-value">${levelConfig.estimatedTime || '30分钟'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">📊 难度等级:</span>
                    <span class="meta-value difficulty-${levelConfig.difficulty?.toLowerCase() || 'beginner'}">${levelConfig.difficulty || '初级'}</span>
                </div>
            </div>
        `;
        
        return html;
    }

    initEditor() {
        const textarea = document.getElementById('code-editor');
        if (textarea && typeof CodeMirror !== 'undefined') {
            if (app.editor) {
                app.editor.toTextArea();
            }
            
            app.editor = CodeMirror.fromTextArea(textarea, {
                mode: 'javascript',
                theme: 'monokai',
                lineNumbers: true,
                autoCloseBrackets: true,
                matchBrackets: true,
                indentUnit: 2,
                tabSize: 2
            });

            // 设置初始代码
            app.editor.setValue(this.getInitialCode());
        }
    }

    bindLevelDetailEvents() {
        // 运行配置按钮
        const runBtn = document.getElementById('run-btn');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                this.runConfiguration();
            });
        }

        // 重置按钮
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetEditor();
            });
        }

        // 提示按钮
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                this.showHints();
            });
        }

        // 查看答案按钮
        const solutionBtn = document.getElementById('solution-btn');
        if (solutionBtn) {
            solutionBtn.addEventListener('click', () => {
                this.showSolution();
            });
        }

        // 下一关按钮
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.goToNextLevel();
            });
        }
    }

    async runConfiguration() {
        if (!app.currentLevel || !app.editor) return;

        const code = app.editor.getValue();
        const output = document.getElementById('output');
        
        try {
            // 模拟配置验证
            const isValid = await this.validateConfiguration(code);
            
            if (isValid) {
                // 配置正确
                output.innerHTML = `<div style="color: #28a745;">
✅ 配置验证成功！

构建完成:
- 入口文件: ./src/index.js
- 输出目录: dist/
- 配置正确，可以进入下一关！
</div>`;
                
                // 显示下一关按钮和查看答案按钮
                document.getElementById('next-btn').style.display = 'inline-block';
                this.showSolutionButton(true);
                
                // 更新进度
                this.updateLevelProgress(app.currentLevel.id, true);
                
            } else {
                // 配置错误
                app.attemptCount++;
                output.innerHTML = `<div style="color: #dc3545;">
❌ 配置验证失败 (尝试 ${app.attemptCount}/${app.maxAttempts})

错误信息:
- 请检查配置语法
- 确保所有必需的字段都已配置
- 参考提示信息进行修改

${app.attemptCount >= app.maxAttempts ? '已达到最大尝试次数，可以查看参考答案。' : ''}
</div>`;

                // 如果达到最大尝试次数，显示查看答案按钮
                if (app.attemptCount >= app.maxAttempts) {
                    this.showSolutionButton(true);
                }
            }
        } catch (error) {
            output.innerHTML = `<div style="color: #dc3545;">
❌ 运行出错: ${error.message}
</div>`;
        }
    }

    async validateConfiguration(code) {
        // 简单的配置验证逻辑
        // 实际项目中应该调用后端API进行验证
        
        // 检查基本语法
        if (!code.includes('module.exports')) {
            return false;
        }
        
        if (!code.includes('entry') || !code.includes('output')) {
            return false;
        }
        
        // 根据当前关卡检查特定配置
        if (app.currentLevel.id === 'webpack-debugging') {
            return code.includes('devtool') && code.includes('stats');
        }
        
        if (app.currentLevel.id === 'webpack-hot-reload') {
            return code.includes('devServer') && code.includes('hot: true');
        }
        
        return true;
    }

    showSolutionButton(show) {
        const solutionBtn = document.getElementById('solution-btn');
        if (solutionBtn) {
            solutionBtn.style.display = show ? 'inline-block' : 'none';
        }
    }

    showSolution() {
        if (!app.currentLevel) {
            alert('请先选择一个关卡');
            return;
        }
        
        if (!app.currentLevel.solution) {
            alert('该关卡暂无参考答案，我们正在完善中...');
            return;
        }

        app.showingSolution = !app.showingSolution;
        const solutionBtn = document.getElementById('solution-btn');
        
        if (app.showingSolution) {
            // 显示答案
            this.displaySolution();
            solutionBtn.textContent = '🔙 返回我的代码';
            solutionBtn.classList.add('showing-solution');
        } else {
            // 返回用户代码
            this.hideSolution();
            solutionBtn.textContent = '📖 查看参考答案';
            solutionBtn.classList.remove('showing-solution');
        }
    }

    displaySolution() {
        const solution = app.currentLevel.solution;
        const currentFile = app.currentFile || 'webpack.config.js';
        
        if (solution[currentFile]) {
            // 保存用户当前代码
            app.userCode = app.editor.getValue();
            
            // 显示参考答案
            app.editor.setValue(solution[currentFile]);
            app.editor.setOption('readOnly', true);
            
            // 显示答案说明
            this.showSolutionExplanation();
        }
    }

    hideSolution() {
        // 恢复用户代码
        if (app.userCode) {
            app.editor.setValue(app.userCode);
        }
        app.editor.setOption('readOnly', false);
        
        // 隐藏答案说明
        this.hideSolutionExplanation();
    }

    showSolutionExplanation() {
        const explanationDiv = document.getElementById('solution-explanation') || this.createSolutionExplanation();
        explanationDiv.style.display = 'block';
        explanationDiv.innerHTML = `
            <h4>📖 参考答案说明</h4>
            <div class="solution-content">
                <p><strong>这是一个参考实现，主要特点：</strong></p>
                <ul>
                    <li>✅ 完整的配置结构</li>
                    <li>✅ 符合最佳实践</li>
                    <li>✅ 包含必要的注释</li>
                    <li>✅ 考虑了生产环境优化</li>
                </ul>
                <p><strong>学习建议：</strong></p>
                <ul>
                    <li>🔍 仔细对比你的代码和参考答案的差异</li>
                    <li>📝 理解每个配置项的作用</li>
                    <li>🚀 尝试在自己的项目中应用这些配置</li>
                </ul>
                <div class="solution-note">
                    <strong>注意：</strong> 参考答案仅供学习参考，实际项目中应根据具体需求调整配置。
                </div>
            </div>
        `;
    }

    hideSolutionExplanation() {
        const explanationDiv = document.getElementById('solution-explanation');
        if (explanationDiv) {
            explanationDiv.style.display = 'none';
        }
    }

    createSolutionExplanation() {
        const explanationDiv = document.createElement('div');
        explanationDiv.id = 'solution-explanation';
        explanationDiv.className = 'solution-explanation';
        
        // 插入到编辑器区域后面
        const editorSection = document.querySelector('.editor-section');
        if (editorSection) {
            editorSection.appendChild(explanationDiv);
        }
        
        return explanationDiv;
    }

    resetEditor() {
        if (app.editor) {
            app.editor.setValue(this.getInitialCode());
            app.attemptCount = 0;
            app.showingSolution = false;
            
            // 重置按钮状态
            document.getElementById('next-btn').style.display = 'none';
            this.showSolutionButton(false);
            
            // 清空输出
            document.getElementById('output').innerHTML = '';
            
            // 隐藏答案说明
            this.hideSolutionExplanation();
        }
    }

    showHints() {
        const hintsSection = document.getElementById('hints-section');
        const hintsContent = document.getElementById('hints-content');
        
        if (hintsSection && hintsContent) {
            hintsSection.style.display = hintsSection.style.display === 'none' ? 'block' : 'none';
            
            if (app.currentLevel) {
                // 使用渐进式提示系统
                if (app.currentLevel.progressiveHints) {
                    const currentHint = this.getCurrentHint();
                    if (currentHint) {
                        hintsContent.innerHTML = `<div class="progressive-hint">${currentHint.hint}</div>`;
                    }
                } else if (app.currentLevel.hints) {
                    // 兼容旧的提示系统
                    hintsContent.innerHTML = app.currentLevel.hints.map(hint => 
                        `<div class="hint-item">💡 ${hint}</div>`
                    ).join('');
                }
            }
        }
    }

    getCurrentHint() {
        if (!app.currentLevel.progressiveHints) return null;
        
        // 根据尝试次数返回对应的提示
        const hints = app.currentLevel.progressiveHints;
        const currentAttempt = Math.min(app.attemptCount, hints.length);
        
        if (currentAttempt === 0) {
            // 第一次点击提示，显示第一个提示
            return hints[0];
        } else {
            // 根据尝试次数显示对应提示
            return hints.find(hint => hint.attempt === currentAttempt) || hints[hints.length - 1];
        }
    }

    goToNextLevel() {
        if (!app.currentLevel) return;
        
        // 获取当前关卡的分类和ID
        const currentCategory = app.currentLevel.category;
        const currentLevels = app.levels[currentCategory];
        const currentIndex = currentLevels.findIndex(levelId => levelId === app.currentLevel.id);
        
        if (currentIndex < currentLevels.length - 1) {
            // 同分类下的下一关
            const nextLevelId = currentLevels[currentIndex + 1];
            this.openLevel(currentCategory, nextLevelId);
        } else {
            // 当前分类已完成，寻找下一个分类的第一关
            const categories = Object.keys(app.levels);
            const currentCategoryIndex = categories.indexOf(currentCategory);
            
            if (currentCategoryIndex < categories.length - 1) {
                const nextCategory = categories[currentCategoryIndex + 1];
                const nextLevelId = app.levels[nextCategory][0];
                this.openLevel(nextCategory, nextLevelId);
            } else {
                // 所有关卡都完成了
                this.showCompletionCelebration();
            }
        }
    }

    showCompletionCelebration() {
        alert('🎉 恭喜！你已经完成了所有关卡！你现在是前端工程化专家了！');
        this.showAchievements();
    }

    updateLevelProgress(levelId, completed) {
        if (!app.progress[levelId]) {
            app.progress[levelId] = {};
        }
        
        app.progress[levelId].completed = completed;
        app.progress[levelId].progress = completed ? 100 : 0;
        app.progress[levelId].completedAt = new Date().toISOString();
        
        app.saveProgress();
        this.updateProgressDisplay();
    }

    // 添加测试数据的方法（仅用于演示）
    addTestProgress() {
        // 模拟一些完成的关卡
        const testLevels = ['webpack-basic', 'webpack-loaders', 'vite-basic'];
        testLevels.forEach(levelId => {
            app.progress[levelId] = {
                completed: true,
                progress: 100,
                completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            };
        });
        app.saveProgress();
        this.updateProgressDisplay();
        
        // 强制更新圆形进度条
        setTimeout(() => {
            this.forceUpdateCircularProgress();
        }, 100);
    }

    // 强制更新圆形进度条的方法
    forceUpdateCircularProgress() {
        const completed = Object.keys(app.progress).filter(key => app.progress[key].completed).length;
        const total = this.getTotalLevels();
        const rate = Math.round((completed / total) * 100);
        
        const overallProgress = document.getElementById('overall-progress');
        if (overallProgress) {
            // 直接设置样式
            const degree = (rate / 100) * 360;
            overallProgress.style.background = `conic-gradient(#42b883 ${degree}deg, #ecf0f1 ${degree}deg)`;
            
            // 如果还是不行，使用SVG方案
            if (rate > 0) {
                this.updateProgressWithSVG(overallProgress, rate);
            }
            
            console.log(`强制更新圆形进度条: ${rate}%`);
        }
    }

    getInitialCode() {
        // 根据当前关卡返回不同的初始代码
        if (app.currentLevel) {
            switch (app.currentLevel.id) {
                case 'webpack-basic':
                    return `// 🚀 Webpack 基础配置
// 你的任务：创建一个基本的webpack配置文件

// TODO: 1. 引入path模块
// const path = require('path');

// TODO: 2. 导出配置对象
module.exports = {
  // TODO: 3. 设置入口文件为 './src/index.js'
  
  // TODO: 4. 配置输出目录和文件名
  
  // TODO: 5. 设置构建模式为 'development'
  
};`;

                case 'webpack-loaders':
                    return `// 🎨 Webpack 加载器配置
// 你的任务：配置loader来处理CSS和图片文件

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  
  // TODO: 1. 添加 module 配置对象
  // module: {
  //   rules: [
  //     // TODO: 2. 配置CSS文件处理规则
  //     // 需要使用 style-loader 和 css-loader
  //     
  //     // TODO: 3. 配置图片文件处理规则  
  //     // 使用 asset/resource 类型
  //   ]
  // }
  
};`;

                case 'webpack-debugging':
                    return `// 🔍 Webpack 调试配置
// 你的任务：配置调试工具来分析构建过程和包大小

const path = require('path');
// TODO: 引入 BundleAnalyzerPlugin
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  
  // TODO: 1. 配置 devtool 用于生成 source map
  
  // TODO: 2. 配置 stats 来控制构建输出信息
  
  // TODO: 3. 添加 plugins 数组，条件性地包含 BundleAnalyzerPlugin
  
};`;
                
                case 'webpack-hot-reload':
                    return `// 🔥 Webpack 热重载配置
// 你的任务：配置开发服务器和热模块替换

const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  
  // TODO: 1. 配置 devServer 对象
  // 需要包含：static、port、open、hot、compress 等配置
  
  // TODO: 2. 添加 proxy 配置解决跨域问题
  
  // TODO: 3. 配置 client 和 watchFiles
  
};`;

                case 'webpack-plugins':
                    return `// 🔌 Webpack 插件配置
// 你的任务：配置HtmlWebpackPlugin和CleanWebpackPlugin

const path = require('path');
// TODO: 1. 引入HtmlWebpackPlugin
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// TODO: 2. 引入CleanWebpackPlugin
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  
  // TODO: 3. 添加 plugins 数组
  // plugins: [
  //   new CleanWebpackPlugin(),
  //   new HtmlWebpackPlugin({
  //     title: '我的Webpack应用',
  //     template: './src/template.html'
  //   })
  // ]
  
};`;

                case 'webpack-code-splitting':
                    return `// ✂️ Webpack 代码分割配置
// 你的任务：配置代码分割来优化加载性能

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  mode: 'production',
  
  // TODO: 1. 添加 optimization 配置
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     cacheGroups: {
  //       vendor: {
  //         test: /[\\\\/]node_modules[\\\\/]/,
  //         name: 'vendors',
  //         chunks: 'all'
  //       }
  //     }
  //   },
  //   runtimeChunk: 'single'
  // }
  
};`;

                case 'webpack-multi-env':
                    return `// 🌍 Webpack 多环境配置
// 你的任务：创建通用配置文件

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// TODO: 这是webpack.common.js的内容
// 你需要创建三个文件：webpack.common.js, webpack.dev.js, webpack.prod.js

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  
  // TODO: 1. 添加通用插件配置
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     template: './src/index.html'
  //   })
  // ],
  
  // TODO: 2. 添加通用loader配置
  // module: {
  //   rules: [...]
  // }
};`;

                case 'webpack-module-federation':
                    return `// 🏗️ Webpack 模块联邦配置
// 你的任务：配置微前端架构

const ModuleFederationPlugin = require('@module-federation/webpack');

// TODO: 这是Shell应用的配置示例
module.exports = {
  mode: 'development',
  entry: './src/index.js',
  devServer: {
    port: 3000
  },
  
  plugins: [
    // TODO: 1. 配置ModuleFederationPlugin
    // new ModuleFederationPlugin({
    //   name: 'shell',
    //   remotes: {
    //     header: 'header@http://localhost:3001/remoteEntry.js'
    //   },
    //   shared: {
    //     react: { singleton: true }
    //   }
    // })
  ]
};`;

                case 'webpack-custom-loader':
                    return `// 🔧 自定义Loader开发
// 你的任务：开发Markdown转HTML的Loader

// TODO: 1. 创建 loaders/markdown-loader.js 文件
// const marked = require('marked');
// const loaderUtils = require('loader-utils');
// 
// module.exports = function(source) {
//   const options = loaderUtils.getOptions(this) || {};
//   const html = marked(source);
//   return \`export default \${JSON.stringify(html)};\`;
// };

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  
  module: {
    rules: [
      // TODO: 2. 配置自定义Loader
      // {
      //   test: /\\.md$/,
      //   use: './loaders/markdown-loader.js'
      // }
    ]
  }
};`;

                case 'webpack-performance':
                    return `// ⚡ Webpack 性能优化配置
// 你的任务：配置各种性能优化选项

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  mode: 'production',
  
  // TODO: 1. 配置持久化缓存
  // cache: {
  //   type: 'filesystem'
  // },
  
  // TODO: 2. 配置模块解析优化
  // resolve: {
  //   alias: {
  //     '@': path.resolve(__dirname, 'src')
  //   }
  // },
  
  // TODO: 3. 配置外部依赖
  // externals: {
  //   'react': 'React'
  // }
  
};`;

                case 'webpack-typescript':
                    return `// 📘 Webpack + TypeScript 配置
// 你的任务：配置webpack来处理TypeScript文件

const path = require('path');
// TODO: 引入 ForkTsCheckerWebpackPlugin
// const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
  entry: './src/index.ts', // 注意：TypeScript入口文件
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js'
  },
  
  // TODO: 1. 配置 resolve 选项
  // 需要设置 extensions 和 alias
  
  // TODO: 2. 配置 module.rules 来处理 .ts 和 .tsx 文件
  
  // TODO: 3. 添加 ForkTsCheckerWebpackPlugin 到 plugins 数组
  
};`;

                case 'vite-testing':
                    return `// 🧪 Vite + Vitest 测试配置
// 你的任务：配置Vite项目的测试环境

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  // TODO: 1. 添加 test 配置对象
  // test: {
  //   globals: true,
  //   environment: 'jsdom',
  //   setupFiles: './src/test/setup.js',
  //   
  //   // TODO: 2. 配置 coverage 选项
  //   coverage: {
  //     provider: 'v8',
  //     reporter: ['text', 'json', 'html'],
  //     exclude: ['node_modules/', 'src/test/', '**/*.config.js']
  //   },
  //   
  //   // TODO: 3. 添加性能优化配置
  //   threads: true,
  //   testTimeout: 10000
  // },
  
  build: {
    sourcemap: true
  },
  
  server: {
    port: 3000,
    open: true
  }
});`;

                case 'vite-basic':
                    return `// ⚡ Vite 基础配置
// 你的任务：创建一个基本的Vite配置文件

import { defineConfig } from 'vite'

// TODO: 1. 导出基础配置
export default defineConfig({
  // TODO: 2. 配置开发服务器
  // server: {
  //   port: 3000,
  //   open: true
  // },
  
  // TODO: 3. 配置构建选项
  // build: {
  //   outDir: 'dist',
  //   sourcemap: true
  // }
  
});`;

                case 'vite-plugins':
                    return `// 🔌 Vite 插件配置
// 你的任务：配置Vite插件来处理React、CSS等

import { defineConfig } from 'vite'
// TODO: 引入React插件
// import react from '@vitejs/plugin-react'

export default defineConfig({
  // TODO: 1. 配置plugins数组
  // plugins: [
  //   react() // React支持
  // ],
  
  // TODO: 2. 配置CSS处理
  css: {
    // 配置CSS预处理器、模块化等
  },
  
  server: {
    port: 3000,
    open: true
  }
});`;

                case 'vite-pwa':
                    return `// 📱 Vite PWA 配置
// 你的任务：配置PWA功能，让网页可以离线使用和安装

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// TODO: 引入 VitePWA 插件
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // TODO: 1. 添加 VitePWA 插件配置
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    //   },
    //   manifest: {
    //     name: 'Vite PWA 学习应用',
    //     short_name: 'VitePWA',
    //     theme_color: '#ffffff'
    //   }
    // })
  ],
  
  // TODO: 2. 配置 build 选项优化PWA构建
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    }
  },
  
  server: {
    port: 3000,
    // TODO: 3. PWA需要HTTPS环境，但开发环境可以用HTTP
    https: false
  }
});`;
                
                default:
                    return `// Webpack 配置文件
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  // 在这里添加你的配置...
};`;
            }
        }
        
        return `// Webpack 配置文件
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  mode: 'development',
  // 在这里添加你的配置...
};`;
    }

    updateProgressDisplay() {
        const completed = Object.keys(app.progress).filter(key => app.progress[key].completed).length;
        const total = this.getTotalLevels();
        const rate = Math.round((completed / total) * 100);

        // 更新统计数字
        const completedElement = document.getElementById('completed-count');
        const totalElement = document.getElementById('total-count');
        const rateElement = document.getElementById('completion-rate');
        const progressFill = document.getElementById('progress-fill');

        if (completedElement) completedElement.textContent = completed;
        if (totalElement) totalElement.textContent = total;
        if (rateElement) rateElement.textContent = `${rate}%`;
        if (progressFill) progressFill.style.width = `${rate}%`;

        // 更新详细进度页面
        this.updateDetailedProgress();
        this.updateAchievements();
    }

    updateDetailedProgress() {
        // 更新总体进度
        const completed = Object.keys(app.progress).filter(key => app.progress[key].completed).length;
        const total = this.getTotalLevels();
        const rate = Math.round((completed / total) * 100);

        // 更新圆形进度条
        const overallProgress = document.getElementById('overall-progress');
        const progressValue = document.querySelector('#overall-progress .progress-value');
        const completedLevels = document.getElementById('completed-levels');
        const totalLevels = document.getElementById('total-levels');

        if (progressValue) progressValue.textContent = `${rate}%`;
        if (completedLevels) completedLevels.textContent = completed;
        if (totalLevels) totalLevels.textContent = total;

        // 更新圆形进度条的视觉效果
        if (overallProgress) {
            const degree = (rate / 100) * 360;
            
            // 方法1：使用conic-gradient
            const backgroundStyle = `conic-gradient(#42b883 ${degree}deg, #ecf0f1 ${degree}deg)`;
            overallProgress.style.background = backgroundStyle;
            
            // 方法2：如果conic-gradient不支持，使用备用方案
            if (!CSS.supports('background', 'conic-gradient(red 0deg, blue 90deg)')) {
                // 使用SVG或其他备用方案
                this.updateProgressWithSVG(overallProgress, rate);
            }
            
            // 添加数据属性用于调试
            overallProgress.setAttribute('data-progress', rate);
            overallProgress.setAttribute('data-degree', degree);
            
            console.log(`更新圆形进度条: ${rate}%, ${degree}度`);
        }

        // 更新分类进度
        this.updateCategoryProgress();
        this.updateRecentActivity();
    }

    updateCategoryProgress() {
        const categoryProgress = document.getElementById('category-progress');
        if (!categoryProgress) return;

        const categories = {
            webpack: { name: 'Webpack', icon: '📦' },
            vite: { name: 'Vite', icon: '⚡' },
            'build-tools': { name: '构建工具', icon: '🔧' },
            'package-managers': { name: '包管理器', icon: '📋' },
            'ci-cd': { name: 'CI/CD', icon: '🚀' },
            testing: { name: '测试', icon: '🧪' },
            performance: { name: '性能优化', icon: '⚡' },
            deployment: { name: '部署', icon: '🌐' }
        };

        let html = '';
        Object.keys(categories).forEach(category => {
            if (app.levels[category]) {
                const totalInCategory = app.levels[category].length;
                const completedInCategory = app.levels[category].filter(levelId => 
                    app.progress[levelId] && app.progress[levelId].completed
                ).length;
                const rate = Math.round((completedInCategory / totalInCategory) * 100);

                html += `
                    <div class="category-card">
                        <div class="category-header">
                            <span class="category-icon">${categories[category].icon}</span>
                            <span class="category-name">${categories[category].name}</span>
                        </div>
                        <div class="category-progress-bar">
                            <div class="category-progress-fill" style="width: ${rate}%"></div>
                        </div>
                        <div class="category-stats">
                            <span>${completedInCategory}/${totalInCategory}</span>
                            <span>${rate}%</span>
                        </div>
                    </div>
                `;
            }
        });

        categoryProgress.innerHTML = html;
    }

    updateRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        // 获取最近完成的关卡
        const recentActivities = Object.keys(app.progress)
            .filter(levelId => app.progress[levelId].completed && app.progress[levelId].completedAt)
            .sort((a, b) => new Date(app.progress[b].completedAt) - new Date(app.progress[a].completedAt))
            .slice(0, 5);

        let html = '';
        if (recentActivities.length === 0) {
            html = '<div class="no-activity">还没有完成任何关卡，开始你的学习之旅吧！</div>';
        } else {
            recentActivities.forEach(levelId => {
                const levelData = this.getLevelDataById(levelId);
                const completedAt = new Date(app.progress[levelId].completedAt);
                const timeAgo = this.getTimeAgo(completedAt);

                html += `
                    <div class="activity-item">
                        <div class="activity-icon">✅</div>
                        <div class="activity-content">
                            <div class="activity-title">完成了 ${levelData.title}</div>
                            <div class="activity-time">${timeAgo}</div>
                        </div>
                    </div>
                `;
            });
        }

        activityList.innerHTML = html;
    }

    updateAchievements() {
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;

        const achievements = this.calculateAchievements();
        let html = '';

        achievements.forEach(achievement => {
            const isUnlocked = achievement.condition();
            html += `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-content">
                        <h3 class="achievement-title">${achievement.title}</h3>
                        <p class="achievement-description">${achievement.description}</p>
                        ${isUnlocked ? 
                            `<div class="achievement-unlocked">🎉 已解锁</div>` : 
                            `<div class="achievement-progress">${achievement.progress()}</div>`
                        }
                    </div>
                </div>
            `;
        });

        achievementsGrid.innerHTML = html;
    }

    calculateAchievements() {
        const completed = Object.keys(app.progress).filter(key => app.progress[key].completed);
        
        return [
            {
                title: '初学者',
                description: '完成第一个关卡',
                icon: '🌱',
                condition: () => completed.length >= 1,
                progress: () => `${Math.min(completed.length, 1)}/1`
            },
            {
                title: 'Webpack 入门',
                description: '完成5个Webpack关卡',
                icon: '📦',
                condition: () => {
                    const webpackCompleted = completed.filter(id => id.includes('webpack')).length;
                    return webpackCompleted >= 5;
                },
                progress: () => {
                    const webpackCompleted = completed.filter(id => id.includes('webpack')).length;
                    return `${Math.min(webpackCompleted, 5)}/5`;
                }
            },
            {
                title: 'Vite 专家',
                description: '完成所有Vite关卡',
                icon: '⚡',
                condition: () => {
                    const viteTotal = app.levels.vite ? app.levels.vite.length : 0;
                    const viteCompleted = completed.filter(id => id.includes('vite')).length;
                    return viteCompleted >= viteTotal && viteTotal > 0;
                },
                progress: () => {
                    const viteTotal = app.levels.vite ? app.levels.vite.length : 0;
                    const viteCompleted = completed.filter(id => id.includes('vite')).length;
                    return `${viteCompleted}/${viteTotal}`;
                }
            },
            {
                title: '工程化大师',
                description: '完成30个关卡',
                icon: '🏆',
                condition: () => completed.length >= 30,
                progress: () => `${Math.min(completed.length, 30)}/30`
            },
            {
                title: '完美主义者',
                description: '完成所有关卡',
                icon: '💎',
                condition: () => completed.length >= this.getTotalLevels(),
                progress: () => `${completed.length}/${this.getTotalLevels()}`
            }
        ];
    }

    getLevelDataById(levelId) {
        // 根据关卡ID返回对应的标题
        const levelTitles = {
            'webpack-basic': 'Webpack 基础配置',
            'webpack-loaders': 'Webpack 加载器配置',
            'webpack-plugins': 'Webpack 插件系统',
            'webpack-debugging': 'Webpack 调试与错误排查',
            'webpack-hot-reload': '热重载与开发服务器',
            'webpack-typescript': 'TypeScript 项目配置',
            'vite-basic': 'Vite 基础配置',
            'vite-plugins': 'Vite 插件生态',
            'vite-testing': 'Vite 测试环境配置',
            'vite-pwa': 'PWA 应用开发'
        };
        
        return {
            title: levelTitles[levelId] || levelId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return '刚刚';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
        return `${Math.floor(diffInSeconds / 86400)}天前`;
    }

    updateProgressWithSVG(element, percentage) {
        // SVG备用方案
        const radius = 50;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        
        element.innerHTML = `
            <svg width="120" height="120" style="position: absolute; top: 0; left: 0;">
                <circle cx="60" cy="60" r="${radius}" 
                        fill="none" 
                        stroke="#ecf0f1" 
                        stroke-width="10"/>
                <circle cx="60" cy="60" r="${radius}" 
                        fill="none" 
                        stroke="#42b883" 
                        stroke-width="10"
                        stroke-dasharray="${strokeDasharray}"
                        stroke-dashoffset="${strokeDashoffset}"
                        stroke-linecap="round"
                        transform="rotate(-90 60 60)"
                        style="transition: stroke-dashoffset 0.3s ease;"/>
            </svg>
            <div class="progress-value" style="position: relative; z-index: 2;">${percentage}%</div>
        `;
    }

    showAchievements() {
        this.showSection('achievements');
    }

    getTotalLevels() {
        let total = 0;
        Object.keys(app.levels).forEach(category => {
            total += app.levels[category].length;
        });
        return total;
    }
}

// 全局函数
function startLearning() {
    document.getElementById('levels').scrollIntoView({ behavior: 'smooth' });
}

function showProgress() {
    // 使用平台的showSection方法
    if (window.learningPlatform) {
        window.learningPlatform.showSection('progress');
    } else {
        // 备用方法
        const progressSection = document.getElementById('progress');
        if (progressSection) {
            // 隐藏其他区域
            document.querySelectorAll('section').forEach(section => {
                section.style.display = 'none';
            });
            // 隐藏关卡详情
            const levelDetail = document.getElementById('level-detail');
            if (levelDetail) {
                levelDetail.style.display = 'none';
            }
            progressSection.style.display = 'block';
            progressSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.learningPlatform = new LearningPlatform();
});

// 导出给其他模块使用
window.LearningPlatform = LearningPlatform;
window.app = app;