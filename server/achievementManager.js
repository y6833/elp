class AchievementManager {
    constructor() {
        this.achievements = {
            'first_steps': {
                id: 'first_steps',
                title: '初出茅庐',
                description: '完成第一个关卡',
                icon: '🎯',
                condition: (progress) => Object.keys(progress).length >= 1
            },
            'webpack_master': {
                id: 'webpack_master',
                title: 'Webpack 大师',
                description: '完成所有 Webpack 关卡',
                icon: '📦',
                condition: (progress) => {
                    const webpackLevels = Object.keys(progress).filter(key => key.startsWith('webpack-'));
                    return webpackLevels.length >= 5;
                }
            },
            'speed_runner': {
                id: 'speed_runner',
                title: '速度之王',
                description: '在10分钟内完成一个关卡',
                icon: '⚡',
                condition: (progress, levelStats) => {
                    return Object.values(levelStats).some(stat => stat.completionTime < 600000);
                }
            },
            'perfectionist': {
                id: 'perfectionist',
                title: '完美主义者',
                description: '连续5个关卡一次通过',
                icon: '💎',
                condition: (progress, levelStats) => {
                    const attempts = Object.values(levelStats).map(stat => stat.attempts);
                    let consecutiveOnes = 0;
                    let maxConsecutive = 0;
                    
                    attempts.forEach(attempt => {
                        if (attempt === 1) {
                            consecutiveOnes++;
                            maxConsecutive = Math.max(maxConsecutive, consecutiveOnes);
                        } else {
                            consecutiveOnes = 0;
                        }
                    });
                    
                    return maxConsecutive >= 5;
                }
            },
            'explorer': {
                id: 'explorer',
                title: '探索者',
                description: '尝试 Webpack 和 Vite 两种工具',
                icon: '🗺️',
                condition: (progress) => {
                    const hasWebpack = Object.keys(progress).some(key => key.startsWith('webpack-'));
                    const hasVite = Object.keys(progress).some(key => key.startsWith('vite-'));
                    return hasWebpack && hasVite;
                }
            }
        };
    }

    checkAchievements(progress, levelStats = {}) {
        const unlockedAchievements = [];
        
        Object.values(this.achievements).forEach(achievement => {
            if (achievement.condition(progress, levelStats)) {
                unlockedAchievements.push(achievement);
            }
        });
        
        return unlockedAchievements;
    }

    getAchievementProgress(progress, levelStats = {}) {
        const result = {};
        
        Object.values(this.achievements).forEach(achievement => {
            result[achievement.id] = {
                ...achievement,
                unlocked: achievement.condition(progress, levelStats)
            };
        });
        
        return result;
    }
}

module.exports = AchievementManager;