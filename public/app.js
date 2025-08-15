class LearningPlatform {
    constructor() {
        this.currentType = 'webpack'; // 默认类型，会在加载关卡后更新
        this.currentLevel = null;
        this.currentLevelId = null;
        this.levels = {};
        this.currentFiles = {};
        this.activeFile = null;

        this.init();
    }

    async init() {
        console.log('初始化学习平台...');
        await this.loadLevels();
        this.bindEvents();
        this.showLevels();
    }

    async loadLevels() {
        try {
            console.log('正在加载关卡数据...');
            const response = await fetch('/api/levels');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.levels = await response.json();
            console.log('关卡数据加载成功:', this.levels);

            // 设置默认的关卡类型为第一个可用的分类
            const availableTypes = Object.keys(this.levels);
            if (availableTypes.length > 0 && !availableTypes.includes(this.currentType)) {
                this.currentType = availableTypes[0];
                console.log('设置默认关卡类型为:', this.currentType);
            }
        } catch (error) {
            console.error('加载关卡失败:', error);
            // 提供默认数据以便测试
            this.levels = {
                webpack: ['level-01-basic', 'level-02-loaders'],
                vite: ['level-01-basic']
            };
        }
    }

    updateProgressDisplay() {
        const progress = JSON.parse(localStorage.getItem('learning-progress') || '{}');
        const completed = Object.keys(progress).filter(key => progress[key].completed).length;
        const total = 33; // 总关卡数
        const rate = Math.round((completed / total) * 100);

        const completedEl = document.getElementById('completed-count');
        const totalEl = document.getElementById('total-count');
        const rateEl = document.getElementById('completion-rate');
        const fillEl = document.getElementById('progress-fill');

        if (completedEl) completedEl.textContent = completed;
        if (totalEl) totalEl.textContent = total;
        if (rateEl) rateEl.textContent = `${rate}%`;
        if (fillEl) fillEl.style.width = `${rate}%`;
    }

    bindEvents() {
        console.log('绑定事件...');

        // 导航按钮事件
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('点击导航按钮:', e.target.dataset.type);
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentType = e.target.dataset.type;
                this.showLevels();
            });
        });

        // 返回按钮
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showLevels();
            });
        }

        // 运行按钮
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
                this.resetLevel();
            });
        }

        // 获取提示按钮
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            console.log('绑定获取提示按钮事件');
            hintBtn.addEventListener('click', () => {
                console.log('点击获取提示按钮');
                this.showHints();
            });
        } else {
            console.error('找不到获取提示按钮');
        }

        // 下一关按钮
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            console.log('绑定下一关按钮事件');
            nextBtn.addEventListener('click', () => {
                console.log('点击下一关按钮');
                this.goToNextLevel();
            });
        } else {
            console.error('找不到下一关按钮');
        }
    }

    showLevels() {
        console.log('显示关卡列表，当前类型:', this.currentType);
        console.log('可用关卡:', this.levels);

        const levelsGrid = document.getElementById('levels-grid');
        const levelDetail = document.getElementById('level-detail');
        const resourcesSection = document.querySelector('.resources-section');

        if (levelsGrid) levelsGrid.style.display = 'grid';
        if (levelDetail) levelDetail.style.display = 'none';
        if (resourcesSection) resourcesSection.style.display = 'block';

        // 更新进度显示
        this.updateProgressDisplay();

        const grid = document.getElementById('levels-grid');
        if (!grid) {
            console.error('找不到关卡网格元素');
            return;
        }

        grid.innerHTML = '';

        const currentLevels = this.levels[this.currentType] || [];
        console.log('当前类型的关卡:', currentLevels);

        if (currentLevels.length === 0) {
            grid.innerHTML = '<div class="no-levels">暂无关卡，请稍后再试</div>';
            return;
        }

        const progress = JSON.parse(localStorage.getItem('learning-progress') || '{}');

        // 异步加载关卡信息
        const loadLevelCards = async () => {
            for (let index = 0; index < currentLevels.length; index++) {
                const level = currentLevels[index];
                const card = document.createElement('div');
                const isCompleted = progress[`${this.currentType}-${level}`]?.completed;

                // 先显示加载状态
                card.className = `level-card ${isCompleted ? 'completed' : ''}`;
                card.innerHTML = `
                    <div class="level-header">
                        <h3>关卡 ${index + 1}: 加载中...</h3>
                        <div class="level-badges">
                            <span class="difficulty">加载中</span>
                            ${isCompleted ? '<span class="completed-badge">✅</span>' : ''}
                        </div>
                    </div>
                    <p>正在加载关卡信息...</p>
                    <div class="level-meta">
                        <span class="time-estimate">⏱️ 加载中</span>
                    </div>
                `;

                grid.appendChild(card);

                // 异步获取关卡详细信息
                try {
                    const [title, description, difficulty, timeEstimate] = await Promise.all([
                        this.getLevelTitle(level),
                        this.getLevelDescription(level),
                        this.getLevelDifficulty(level),
                        this.getTimeEstimate(level)
                    ]);

                    // 更新卡片内容
                    card.innerHTML = `
                        <div class="level-header">
                            <h3>关卡 ${index + 1}: ${title}</h3>
                            <div class="level-badges">
                                <span class="difficulty ${difficulty}">${this.getDifficultyText(difficulty)}</span>
                                ${isCompleted ? '<span class="completed-badge">✅</span>' : ''}
                            </div>
                        </div>
                        <p>${description}</p>
                        <div class="level-meta">
                            <span class="time-estimate">⏱️ ${timeEstimate}</span>
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        console.log('点击关卡:', level);
                        this.showLevel(level);
                    });
                } catch (error) {
                    console.error('加载关卡信息失败:', level, error);
                    card.innerHTML = `
                        <div class="level-header">
                            <h3>关卡 ${index + 1}: ${level}</h3>
                            <div class="level-badges">
                                <span class="difficulty">未知</span>
                                ${isCompleted ? '<span class="completed-badge">✅</span>' : ''}
                            </div>
                        </div>
                        <p>加载失败，请稍后重试</p>
                        <div class="level-meta">
                            <span class="time-estimate">⏱️ 未知</span>
                        </div>
                    `;
                }
            }
        };

        loadLevelCards();

        console.log('关卡卡片已添加到网格中');
    }

    async getLevelTitle(level) {
        try {
            const response = await fetch(`/api/levels/${this.currentType}/${level}`);
            const levelData = await response.json();
            return levelData.title || level;
        } catch (error) {
            console.error('获取关卡标题失败:', error);
            return level;
        }
    }

    async getLevelDescription(level) {
        try {
            const response = await fetch(`/api/levels/${this.currentType}/${level}`);
            const levelData = await response.json();
            // 移除HTML标签，只显示纯文本描述
            const description = levelData.description || '学习前端工程化配置';
            return description.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
        } catch (error) {
            console.error('获取关卡描述失败:', error);
            return '学习前端工程化配置';
        }
    }

    async getLevelDifficulty(level) {
        try {
            const response = await fetch(`/api/levels/${this.currentType}/${level}`);
            const levelData = await response.json();
            return levelData.difficulty || 'beginner';
        } catch (error) {
            console.error('获取关卡难度失败:', error);
            return 'beginner';
        }
    }

    getDifficultyText(difficulty) {
        const texts = {
            '入门': '入门',
            '中级': '中级',
            '高级': '高级',
            '专家': '专家',
            'beginner': '入门',
            'intermediate': '中级',
            'advanced': '高级',
            'expert': '专家'
        };
        return texts[difficulty] || '入门';
    }

    async getTimeEstimate(level) {
        try {
            const response = await fetch(`/api/levels/${this.currentType}/${level}`);
            const levelData = await response.json();
            return levelData.estimatedTime || '15分钟';
        } catch (error) {
            console.error('获取时间估算失败:', error);
            return '15分钟';
        }
    }

    async showLevel(level) {
        try {
            const response = await fetch(`/api/levels/${this.currentType}/${level}`);
            const levelData = await response.json();

            this.currentLevel = levelData;
            this.currentLevelId = level; // 保存当前关卡 ID
            this.currentFiles = { ...levelData.files };

            document.getElementById('levels-grid').style.display = 'none';
            document.getElementById('level-detail').style.display = 'block';

            // 隐藏资源区域
            const resourcesSection = document.querySelector('.resources-section');
            if (resourcesSection) {
                resourcesSection.style.display = 'none';
            }

            document.getElementById('level-title').textContent = levelData.title;
            document.getElementById('level-description').innerHTML = levelData.description;

            this.setupFileTabs();
            this.showOutput('准备就绪！点击"运行配置"开始测试你的配置。\n\n💡 编辑配置文件后，点击"运行配置"进行验证。');

            // 隐藏下一关按钮
            document.getElementById('next-btn').style.display = 'none';

        } catch (error) {
            console.error('加载关卡详情失败:', error);
            this.showOutput('❌ 加载关卡失败，请刷新页面重试。');
        }
    }

    setupFileTabs() {
        const tabsContainer = document.getElementById('file-tabs');
        const editor = document.getElementById('code-editor');

        tabsContainer.innerHTML = '';

        const files = Object.keys(this.currentFiles);
        if (files.length === 0) return;

        files.forEach((filename, index) => {
            const tab = document.createElement('button');
            tab.className = `file-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = filename;
            tab.addEventListener('click', () => this.switchFile(filename));
            tabsContainer.appendChild(tab);
        });

        // 显示第一个文件
        this.activeFile = files[0];
        editor.value = this.currentFiles[this.activeFile] || '';
    }

    switchFile(filename) {
        // 保存当前文件的修改
        if (this.activeFile) {
            this.currentFiles[this.activeFile] = document.getElementById('code-editor').value;
        }

        // 切换到新文件
        this.activeFile = filename;
        document.getElementById('code-editor').value = this.currentFiles[filename] || '';

        // 更新标签状态
        document.querySelectorAll('.file-tab').forEach(tab => {
            tab.classList.toggle('active', tab.textContent === filename);
        });
    }

    async runConfiguration() {
        // 保存当前编辑器内容
        if (this.activeFile) {
            this.currentFiles[this.activeFile] = document.getElementById('code-editor').value;
        }

        const runBtn = document.getElementById('run-btn');
        const originalText = runBtn.textContent;

        runBtn.disabled = true;
        runBtn.textContent = '验证中...';

        this.showOutput('🔍 正在验证配置...\n');

        try {
            // 获取当前关卡信息
            const levelId = this.getCurrentLevelId();
            const configContent = this.currentFiles[this.activeFile] || '';

            // 发送验证请求
            const response = await fetch(`/api/validate/${this.currentType}/${levelId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    config: configContent,
                    files: this.currentFiles
                })
            });

            const result = await response.json();
            this.handleValidationResult(result);

        } catch (error) {
            this.showOutput(`❌ 验证失败: ${error.message}`);
        } finally {
            runBtn.disabled = false;
            runBtn.textContent = originalText;
        }
    }

    simulateBuild() {
        const output = document.getElementById('output');
        const messages = [
            '📦 开始构建...',
            '🔍 解析配置文件...',
            '📂 处理入口文件...',
            '🎨 处理样式文件...',
            '🖼️  处理图片资源...',
            '⚡ 优化代码...',
            '✅ 构建完成！',
            '',
            '构建结果:',
            '- 输出目录: dist/',
            '- 主文件: main.js (25.4 KB)',
            '- 样式文件: main.css (3.2 KB)',
            '- 构建时间: 1.2s'
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < messages.length) {
                output.textContent += messages[index] + '\n';
                output.scrollTop = output.scrollHeight;
                index++;
            } else {
                clearInterval(interval);
                this.checkSuccess();
            }
        }, 200);
    }

    checkSuccess() {
        const config = this.currentFiles[this.activeFile] || '';
        const levelId = this.getCurrentLevelId();

        let isSuccess = false;
        let message = '';

        switch (levelId) {
            case 'level-01-basic':
                isSuccess = this.validateBasicConfig(config);
                message = isSuccess ?
                    '\n🎉 恭喜！基础配置完成！\n✅ 入口文件配置正确\n✅ 输出配置正确\n✅ 模式设置正确' :
                    '\n❌ 配置有误，请检查：\n- entry 应设置为 "./src/index.js"\n- output.path 和 filename\n- mode 应设置为 "development"';
                break;

            case 'level-02-loaders':
                isSuccess = this.validateLoadersConfig(config);
                message = isSuccess ?
                    '\n🎉 恭喜！加载器配置完成！\n✅ CSS 加载器配置正确\n✅ 图片加载器配置正确' :
                    '\n❌ 加载器配置有误，请检查：\n- CSS 需要 style-loader 和 css-loader\n- 图片需要 file-loader';
                break;

            case 'level-03-plugins':
                isSuccess = this.validatePluginsConfig(config);
                message = isSuccess ?
                    '\n🎉 恭喜！插件配置完成！\n✅ HtmlWebpackPlugin 配置正确\n✅ CleanWebpackPlugin 配置正确' :
                    '\n❌ 插件配置有误，请检查插件的导入和实例化';
                break;

            case 'level-04-optimization':
                isSuccess = this.validateOptimizationConfig(config);
                message = isSuccess ?
                    '\n🎉 恭喜！优化配置完成！\n✅ 代码分割配置正确\n✅ 运行时分离配置正确' :
                    '\n❌ 优化配置有误，请检查 splitChunks 和 runtimeChunk 配置';
                break;

            default:
                isSuccess = config.length > 50; // 简单检查
                message = isSuccess ? '\n🎉 配置看起来不错！' : '\n❌ 请完善配置内容';
        }

        this.showOutput(message);

        if (isSuccess) {
            document.getElementById('next-btn').style.display = 'inline-block';
            this.saveProgress(levelId);
        }
    }

    validateBasicConfig(config) {
        return config.includes('./src/index.js') &&
            config.includes('dist') &&
            config.includes('development');
    }

    validateLoadersConfig(config) {
        return config.includes('style-loader') &&
            config.includes('css-loader') &&
            config.includes('file-loader');
    }

    validatePluginsConfig(config) {
        return config.includes('HtmlWebpackPlugin') &&
            config.includes('CleanWebpackPlugin');
    }

    validateOptimizationConfig(config) {
        return config.includes('splitChunks') &&
            config.includes('runtimeChunk');
    }

    getCurrentLevelId() {
        // 从 URL 或当前关卡数据中获取真实的关卡 ID
        if (this.currentLevelId) {
            return this.currentLevelId;
        }

        // 备用方案：根据标题推断
        return this.currentLevel?.title?.toLowerCase().includes('基础') ? 'level-01-basic' :
            this.currentLevel?.title?.toLowerCase().includes('加载器') ? 'level-02-loaders' :
                this.currentLevel?.title?.toLowerCase().includes('插件') ? 'level-03-plugins' :
                    this.currentLevel?.title?.toLowerCase().includes('分割') ? 'level-04-optimization' :
                        'level-01-basic';
    }

    handleValidationResult(result) {
        const output = document.getElementById('output');

        if (result.success) {
            // 成功情况
            output.innerHTML = `
                <div style="color: #28a745; font-weight: bold; margin-bottom: 10px;">
                    ✅ 恭喜！配置验证成功！
                </div>
                <div style="background: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745;">
                    ${result.output || '配置文件语法正确，构建流程验证通过。'}
                </div>
            `;

            // 显示下一关按钮
            document.getElementById('next-btn').style.display = 'inline-block';

            // 保存进度
            this.saveProgress(this.getCurrentLevelId());

        } else {
            // 失败情况
            let errorMessage = '';

            switch (result.type) {
                case 'syntax':
                    errorMessage = `
                        <div style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">
                            ❌ 语法错误
                        </div>
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                            ${result.error}
                        </div>
                        <div style="margin-top: 10px; color: #666; font-size: 14px;">
                            💡 请检查配置文件的语法，确保括号、引号等符号匹配。
                        </div>
                    `;
                    break;

                case 'config':
                    errorMessage = `
                        <div style="color: #ffc107; font-weight: bold; margin-bottom: 10px;">
                            ⚠️ 配置不完整
                        </div>
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                            ${result.error}
                        </div>
                    `;

                    if (result.hints && result.hints.length > 0) {
                        errorMessage += `
                            <div style="margin-top: 15px; background: #e7f3ff; padding: 15px; border-radius: 8px;">
                                <strong style="color: #0066cc;">💡 提示:</strong>
                                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #333;">
                                    ${result.hints.map(hint => `<li style="margin: 4px 0;">${hint}</li>`).join('')}
                                </ul>
                            </div>
                        `;
                    }
                    break;

                case 'build':
                    errorMessage = `
                        <div style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">
                            ❌ 构建失败
                        </div>
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                            ${result.error}
                        </div>
                    `;

                    if (result.output) {
                        errorMessage += `
                            <div style="margin-top: 15px;">
                                <strong>构建输出:</strong>
                                <div style="background: #1e1e1e; color: #fff; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 12px; overflow-x: auto; margin-top: 8px;">
                                    ${result.output.replace(/\n/g, '<br>')}
                                </div>
                            </div>
                        `;
                    }
                    break;

                default:
                    errorMessage = `
                        <div style="color: #dc3545; font-weight: bold; margin-bottom: 10px;">
                            ❌ 验证失败
                        </div>
                        <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
                            ${result.error}
                        </div>
                    `;
            }

            output.innerHTML = errorMessage;
            document.getElementById('next-btn').style.display = 'none';
        }

        // 滚动到输出区域
        output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    saveProgress(levelId) {
        const progress = JSON.parse(localStorage.getItem('learning-progress') || '{}');
        progress[`${this.currentType}-${levelId}`] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        localStorage.setItem('learning-progress', JSON.stringify(progress));
    }

    resetLevel() {
        if (this.currentLevel) {
            this.currentFiles = { ...this.currentLevel.files };
            this.setupFileTabs();
            this.showOutput('配置已重置到初始状态。');
            document.getElementById('next-btn').style.display = 'none';
        }
    }

    showOutput(message) {
        document.getElementById('output').textContent = message;
    }

    // 显示智能提示
    showHints() {
        const hintsSection = document.getElementById('hints-section');
        const hintsContent = document.getElementById('hints-content');

        if (!hintsSection || !hintsContent) {
            console.error('找不到提示相关的DOM元素');
            return;
        }

        if (hintsSection.style.display === 'none' || hintsSection.style.display === '') {
            // 显示提示
            hintsSection.style.display = 'block';

            // 获取当前配置内容
            const currentConfig = this.currentFiles[this.activeFile] || '';
            const levelId = this.getCurrentLevelId();

            // 生成提示内容
            const hints = this.generateHints(levelId, currentConfig);

            hintsContent.innerHTML = '';
            hints.forEach(hint => {
                const hintItem = document.createElement('div');
                hintItem.className = 'hint-item';
                hintItem.innerHTML = `
                    <div class="hint-message">${hint.message}</div>
                    ${hint.example ? `<div class="hint-example">${hint.example}</div>` : ''}
                `;
                hintsContent.appendChild(hintItem);
            });

            document.getElementById('hint-btn').textContent = '🙈 隐藏提示';
        } else {
            // 隐藏提示
            hintsSection.style.display = 'none';
            document.getElementById('hint-btn').textContent = '💡 获取提示';
        }
    }

    // 生成智能提示
    generateHints(levelId, currentConfig) {
        const hints = [];

        // 根据当前关卡类型和ID生成提示
        if (this.currentLevel && this.currentLevel.hints) {
            // 使用关卡配置中的提示
            this.currentLevel.hints.forEach(hint => {
                hints.push({
                    message: hint,
                    example: ''
                });
            });
        } else {
            // 提供通用提示
            switch (levelId) {
                case 'level-01-basic':
                    if (!currentConfig.includes('entry')) {
                        hints.push({
                            message: '💡 entry 是构建工具开始构建的入口点，通常指向你的主 JavaScript 文件。',
                            example: "entry: './src/index.js'"
                        });
                    }
                    if (!currentConfig.includes('output')) {
                        hints.push({
                            message: '📁 output 配置告诉构建工具在哪里输出它所创建的文件。',
                            example: "output: {\n  path: path.resolve(__dirname, 'dist'),\n  filename: 'bundle.js'\n}"
                        });
                    }
                    break;

                default:
                    hints.push({
                        message: '💭 配置看起来不错！如果遇到问题，可以查看关卡说明或参考官方文档。',
                        example: '记住：仔细阅读关卡说明，按照要求完成配置。'
                    });
            }
        }

        // 如果没有特定提示，提供通用建议
        if (hints.length === 0) {
            hints.push({
                message: '💭 配置看起来不错！如果遇到问题，可以查看关卡说明或参考官方文档。',
                example: '记住：每个关卡都有特定的学习目标，按照说明逐步完成。'
            });
        }

        return hints;
    }

    // 获取当前关卡ID
    getCurrentLevelId() {
        return this.currentLevelId || 'unknown';
    }

    // 前往下一关
    goToNextLevel() {
        if (!this.currentType || !this.levels[this.currentType]) {
            console.error('无法确定当前关卡类型');
            return;
        }

        const currentLevels = this.levels[this.currentType];
        const currentIndex = currentLevels.indexOf(this.currentLevelId);

        if (currentIndex === -1) {
            console.error('无法找到当前关卡在列表中的位置');
            return;
        }

        if (currentIndex < currentLevels.length - 1) {
            // 有下一关
            const nextLevel = currentLevels[currentIndex + 1];
            console.log('前往下一关:', nextLevel);
            this.showLevel(nextLevel);
        } else {
            // 已经是最后一关
            alert('恭喜！你已经完成了所有关卡！');
            this.showLevels();
        }
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new LearningPlatform();
});