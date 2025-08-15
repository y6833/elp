class PathRecommender {
    constructor() {
        this.learningPaths = {
            'beginner': {
                title: '新手入门路径',
                description: '适合完全没有构建工具经验的开发者',
                levels: [
                    'webpack-level-01-basic',
                    'webpack-level-02-loaders',
                    'vite-level-01-basic',
                    'webpack-level-03-plugins',
                    'vite-level-02-plugins'
                ],
                estimatedTime: '2-3小时'
            },
            'webpack_focused': {
                title: 'Webpack 专精路径',
                description: '深入学习 Webpack 的所有特性',
                levels: [
                    'webpack-level-01-basic',
                    'webpack-level-02-loaders',
                    'webpack-level-03-plugins',
                    'webpack-level-04-optimization',
                    'webpack-level-05-performance'
                ],
                estimatedTime: '3-4小时'
            },
            'vite_focused': {
                title: 'Vite 现代化路径',
                description: '掌握现代化的 Vite 构建工具',
                levels: [
                    'vite-level-01-basic',
                    'vite-level-02-plugins',
                    'vite-level-03-build',
                    'webpack-level-01-basic', // 对比学习
                    'webpack-level-02-loaders'
                ],
                estimatedTime: '2-3小时'
            },
            'performance_expert': {
                title: '性能优化专家路径',
                description: '专注于构建性能和优化技巧',
                levels: [
                    'webpack-level-01-basic',
                    'webpack-level-04-optimization',
                    'webpack-level-05-performance',
                    'vite-level-03-build'
                ],
                estimatedTime: '2小时'
            }
        };
    }

    recommendPath(userProfile) {
        const { experience, goals, timeAvailable } = userProfile;
        
        // 根据经验推荐
        if (experience === 'beginner') {
            return this.learningPaths.beginner;
        }
        
        // 根据目标推荐
        if (goals.includes('webpack')) {
            return this.learningPaths.webpack_focused;
        }
        
        if (goals.includes('vite')) {
            return this.learningPaths.vite_focused;
        }
        
        if (goals.includes('performance')) {
            return this.learningPaths.performance_expert;
        }
        
        // 根据时间推荐
        if (timeAvailable < 120) { // 少于2小时
            return this.learningPaths.performance_expert;
        }
        
        // 默认推荐
        return this.learningPaths.beginner;
    }

    getNextRecommendation(completedLevels, currentPath) {
        if (!currentPath || !this.learningPaths[currentPath]) {
            return null;
        }
        
        const pathLevels = this.learningPaths[currentPath].levels;
        const nextLevel = pathLevels.find(level => !completedLevels.includes(level));
        
        return nextLevel || null;
    }

    getAllPaths() {
        return this.learningPaths;
    }
}

module.exports = PathRecommender;