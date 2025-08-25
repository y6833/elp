#!/usr/bin/env node

/**
 * ELP 性能基准测试脚本
 * 用于建立项目升级前的性能基线
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const puppeteer = require('puppeteer');

class PerformanceBaseline {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      version: 'current-vanilla-js',
      metrics: {}
    };
  }

  async runAllTests() {
    console.log('🚀 开始性能基准测试...\n');
    
    try {
      await this.testBundleSize();
      await this.testServerPerformance();
      await this.testBrowserPerformance();
      await this.testMemoryUsage();
      
      await this.saveResults();
      this.printSummary();
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    }
  }

  // 1. Bundle 大小分析
  async testBundleSize() {
    console.log('📦 分析文件大小...');
    
    const files = [
      'public/app.js',
      'public/styles.css',
      'public/index.html'
    ];
    
    const fileSizes = {};
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
        fileSizes[file] = {
          bytes: stats.size,
          kb: sizeKB
        };
        totalSize += stats.size;
      }
    }
    
    this.results.metrics.bundleSize = {
      files: fileSizes,
      totalBytes: totalSize,
      totalKB: Math.round(totalSize / 1024 * 100) / 100
    };
    
    console.log(`   ✅ 总文件大小: ${Math.round(totalSize / 1024 * 100) / 100} KB`);
  }

  // 2. 服务器性能测试
  async testServerPerformance() {
    console.log('🖥️  测试服务器性能...');
    
    const baseURL = 'http://localhost:3000';
    const endpoints = [
      '/api/levels',
      '/api/progress',
      '/api/stats'
    ];
    
    const serverMetrics = {};
    
    for (const endpoint of endpoints) {
      const url = baseURL + endpoint;
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        try {
          const response = await fetch(url);
          if (response.ok) {
            await response.json();
          }
          const end = performance.now();
          times.push(end - start);
        } catch (error) {
          console.log(`   ⚠️  无法连接到服务器 ${endpoint}，跳过测试`);
          times.push(0);
        }
      }
      
      const validTimes = times.filter(t => t > 0);
      if (validTimes.length > 0) {
        serverMetrics[endpoint] = {
          averageMs: Math.round(validTimes.reduce((a, b) => a + b) / validTimes.length * 100) / 100,
          minMs: Math.round(Math.min(...validTimes) * 100) / 100,
          maxMs: Math.round(Math.max(...validTimes) * 100) / 100
        };
      }
    }
    
    this.results.metrics.serverPerformance = serverMetrics;
    console.log('   ✅ 服务器性能测试完成');
  }

  // 3. 浏览器性能测试 (需要服务器运行)
  async testBrowserPerformance() {
    console.log('🌐 测试浏览器性能...');
    
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      
      const page = await browser.newPage();
      
      // 启用性能监控
      await page.setCacheEnabled(false);
      
      // 导航到主页并测量加载时间
      const start = performance.now();
      
      const response = await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const end = performance.now();
      
      if (!response || !response.ok()) {
        throw new Error('无法访问本地服务器');
      }
      
      // 获取页面性能指标
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          domInteractive: navigation.domInteractive - navigation.domInteractive,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      // 测试JavaScript执行时间
      const jsExecutionStart = performance.now();
      await page.evaluate(() => {
        // 模拟一些用户交互
        const event = new Event('click');
        document.body.dispatchEvent(event);
      });
      const jsExecutionEnd = performance.now();
      
      this.results.metrics.browserPerformance = {
        pageLoadTimeMs: Math.round((end - start) * 100) / 100,
        domContentLoadedMs: Math.round(performanceMetrics.domContentLoaded * 100) / 100,
        loadCompleteMs: Math.round(performanceMetrics.loadComplete * 100) / 100,
        firstContentfulPaintMs: Math.round(performanceMetrics.firstContentfulPaint * 100) / 100,
        jsExecutionMs: Math.round((jsExecutionEnd - jsExecutionStart) * 100) / 100
      };
      
      console.log(`   ✅ 页面加载时间: ${Math.round((end - start) * 100) / 100} ms`);
      
    } catch (error) {
      console.log('   ⚠️  浏览器测试失败 (可能服务器未运行):', error.message);
      this.results.metrics.browserPerformance = {
        error: error.message
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // 4. 内存使用测试
  async testMemoryUsage() {
    console.log('💾 测试内存使用...');
    
    const used = process.memoryUsage();
    
    this.results.metrics.memoryUsage = {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(used.external / 1024 / 1024 * 100) / 100 // MB
    };
    
    console.log(`   ✅ 堆内存使用: ${this.results.metrics.memoryUsage.heapUsed} MB`);
  }

  // 保存结果
  async saveResults() {
    const resultsDir = path.join(__dirname, '..', 'performance-reports');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `baseline-${timestamp}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    
    // 同时保存一个最新的基准文件
    const latestPath = path.join(resultsDir, 'latest-baseline.json');
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2));
    
    console.log(`📊 结果已保存到: ${filename}`);
  }

  // 打印总结
  printSummary() {
    console.log('\n📋 性能基准测试总结');
    console.log('========================');
    
    const metrics = this.results.metrics;
    
    if (metrics.bundleSize) {
      console.log(`📦 Bundle 大小: ${metrics.bundleSize.totalKB} KB`);
    }
    
    if (metrics.browserPerformance && !metrics.browserPerformance.error) {
      console.log(`🌐 页面加载时间: ${metrics.browserPerformance.pageLoadTimeMs} ms`);
      console.log(`🎨 首次内容绘制: ${metrics.browserPerformance.firstContentfulPaintMs} ms`);
    }
    
    if (metrics.memoryUsage) {
      console.log(`💾 内存使用: ${metrics.memoryUsage.heapUsed} MB`);
    }
    
    console.log('\n✨ 基准测试完成！这些数据将用于对比Vue 3升级后的性能改进。');
  }
}

// 运行测试
const baseline = new PerformanceBaseline();
baseline.runAllTests();

module.exports = PerformanceBaseline;