class LearningPlatform {
    constructor() {
        this.currentType = 'webpack';
        this.currentLevel = null;
        this.levels = {};
        this.currentFiles = {};
        this.activeFile = null;
        this.codeEditor = null;
        this.levelStats = JSON.parse(localStorage.getItem('level-stats') || '{}');
        this.startTime = null;
        
        this.init();
    }

    async init() {
        await this.loadLevels();
        this.bindEvents();
        this.showLevels();
    }

    async loadLevels() {
        try {
            const response = await fetch('/api/levels');
            this.levels = await response.json();
        } catch (error) {
            console.error('加载关卡失败:', error);
        }
    }

    bindEvents() {
        // 导航按钮事件
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const type = e.target.dataset.type;
                
                if (type === 'stats') {
                    this.showStats();
                } else if (type === 'achievements') {
                    this.showAchievements();
                } else {
                    this.currentType = type;
                    this.showLevels();
                }
            });
        });

        // 返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            this.showLevels();
        });

        // 运行按钮
        document.getElementById('run-btn').addEventListener('click', () => {
            this.runConfiguration();
        });

        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetLevel();
        });

        // 提示按钮
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHints();
        });
    }

    showLevels() {
        document.getElementById('levels-grid').style.display = 'grid';
        document.getElementById('level-detail').style.display = 'none';
        
        // 显示资源区域
        const resourcesSection = document.querySelector('.resources-section');
        if (resourcesSection) {
            resourcesSection.style.display = 'block';
        }
        
        const grid = document.getElementById('levels-grid');
        grid.innerHTML = '';

        const currentLevels = this.levels[this.currentType] || [];
        const progress = JSON.parse(localStorage.getItem('learning-progress') || '{}');
        
        currentLevels.forEach((level, index) => {
            const card = document.createElement('div');
            const isCompleted = progress[`${this.currentType}-${level}`]?.completed;
            const difficulty = this.getLevelDifficulty(level);
            
            card.className = `level-card ${isCompleted ? 'completed' : ''}`;
            card.innerHTML = `
                <div class="level-header">
                    <h3>关卡 ${index + 1}: ${this.getLevelTitle(level)}</h3>
                    <div class="level-badges">
                        <span class="difficulty ${difficulty}">${this.getDifficultyText(difficulty)}</span>
                        ${isCompleted ? '<span class="completed-badge">✅</span>' : ''}
                    </div>
                </div>
                <p>${this.getLevelDescription(level)}</p>
                <div class="level-meta">
                    <span class="time-estimate">⏱️ ${this.getTimeEstimate(level)}</span>
                </div>
            `;
            card.addEventListener('click', () => this.showLevel(level));
            grid.appendChild(card);
        });
    }

    getLevelTitle(level) {
        const titles = {
            'level-01-basic': '基础配置',
            'level-02-loaders': '加载器配置',
            'level-03-plugins': '插件系统',
            'level-04-optimization': '代码分割',
            'level-05-performance': '性能优化'
        };
        return titles[level] || level;
    }

    getLevelDescription(level) {
        const descriptions = {
            'level-01-basic': '学习 webpack 的基本配置，包括入口、出口和模式设置',
            'level-02-loaders': '掌握各种加载器的使用，处理 CSS、图片等资源',
            'level-03-plugins': '了解插件系统，使用 HtmlWebpackPlugin 等常用插件',
            'level-04-optimization': '学习代码分割和懒加载，优化打包策略',
            'level-05-performance': '掌握性能优化技巧，提升构建速度和运行效率'
        };
        return descriptions[level] || '学习前端工程化配置';
    }

    getLevelDifficulty(level) {
        const difficulties = {
            'level-01-basic': 'beginner',
            'level-02-loaders': 'beginner', 
            'level-03-plugins': 'intermediate',
            'level-04-optimization': 'advanced',
            'level-05-performance': 'expert'
        };
        return difficulties[level] || 'beginner';
    }

    getDifficultyText(difficulty) {
        const texts = {
            'beginner': '入门',
            'intermediate': '中级',
            'advanced': '高级',
            'expert': '专家'
        };
        return texts[difficulty] || '入门';
    }

    getTimeEstimate(level) {
        const times = {
            'level-01-basic': '10分钟',
            'level-02-loaders': '15分钟',
            'level-03-plugins': '20分钟', 
            'level-04-optimization': '25分钟',
            'level-05-performance': '30分钟'
        };
        return times[level] || '15分钟';
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
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    new LearningPlatform();
});