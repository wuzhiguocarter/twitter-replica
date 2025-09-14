#!/usr/bin/env node

/**
 * Twitter Replica 性能测试脚本
 * 测试API响应时间和前端性能指标
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const colors = require('colors');

// 配置
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const TEST_ITERATIONS = 10;

// 工具函数
const log = {
  info: (msg) => console.log('ℹ️ '.blue + msg),
  success: (msg) => console.log('✅ '.green + msg.green),
  error: (msg) => console.log('❌ '.red + msg.red),
  warn: (msg) => console.log('⚠️ '.yellow + msg.yellow),
  perf: (msg) => console.log('⚡ '.magenta + msg.magenta)
};

// 性能测试结果存储
const performanceResults = {
  api: {},
  frontend: {}
};

// API性能测试
async function testAPIPerformance() {
  log.perf('开始API性能测试...');
  
  const endpoints = [
    { name: '用户注册', method: 'POST', url: '/auth/register', data: {
      username: `perftest_${Date.now()}`,
      email: `perftest_${Date.now()}@example.com`,
      password: 'Test123!',
      displayName: 'Performance Test User'
    }},
    { name: '用户登录', method: 'POST', url: '/auth/login', data: {
      identifier: 'demo',
      password: 'demo123'
    }},
    { name: '获取推文流', method: 'GET', url: '/tweets/feed' },
    { name: '搜索推文', method: 'GET', url: '/tweets/search?q=test' },
    { name: '获取热门话题', method: 'GET', url: '/tweets/trending' }
  ];

  for (const endpoint of endpoints) {
    const times = [];
    let successCount = 0;
    let errorCount = 0;

    log.info(`测试端点: ${endpoint.name}`);

    for (let i = 0; i < TEST_ITERATIONS; i++) {
      try {
        const startTime = performance.now();
        
        let response;
        if (endpoint.method === 'GET') {
          response = await axios.get(API_BASE_URL + endpoint.url, {
            timeout: 10000
          });
        } else {
          response = await axios.post(API_BASE_URL + endpoint.url, endpoint.data, {
            timeout: 10000
          });
        }
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        if (response.status >= 200 && response.status < 300) {
          times.push(responseTime);
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        log.warn(`请求失败: ${error.message}`);
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

      performanceResults.api[endpoint.name] = {
        average: avgTime,
        min: minTime,
        max: maxTime,
        median: medianTime,
        successRate: (successCount / TEST_ITERATIONS) * 100
      };

      log.success(`${endpoint.name} - 平均响应时间: ${avgTime.toFixed(2)}ms`);
      log.info(`  最小: ${minTime.toFixed(2)}ms, 最大: ${maxTime.toFixed(2)}ms, 中位数: ${medianTime.toFixed(2)}ms`);
      log.info(`  成功率: ${((successCount / TEST_ITERATIONS) * 100).toFixed(1)}%`);
    } else {
      log.error(`${endpoint.name} - 所有请求都失败了`);
    }

    // 在测试之间稍作停顿
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 前端性能测试（使用Lighthouse）
async function testFrontendPerformance() {
  log.perf('开始前端性能测试...');
  
  try {
    const lighthouse = require('lighthouse');
    const chromeLauncher = require('chrome-launcher');

    // 启动Chrome
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });

    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    // 测试主页
    log.info('测试主页性能...');
    const runnerResult = await lighthouse(FRONTEND_URL, options);
    
    if (runnerResult && runnerResult.report) {
      const report = JSON.parse(runnerResult.report);
      const scores = report.categories;

      performanceResults.frontend = {
        performance: scores.performance.score * 100,
        accessibility: scores.accessibility.score * 100,
        bestPractices: scores['best-practices'].score * 100,
        seo: scores.seo.score * 100,
        metrics: {
          firstContentfulPaint: report.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: report.audits['largest-contentful-paint'].numericValue,
          speedIndex: report.audits['speed-index'].numericValue,
          cumulativeLayoutShift: report.audits['cumulative-layout-shift'].numericValue,
          totalBlockingTime: report.audits['total-blocking-time'].numericValue
        }
      };

      log.success(`性能评分: ${scores.performance.score * 100}/100`);
      log.success(`可访问性评分: ${scores.accessibility.score * 100}/100`);
      log.success(`最佳实践评分: ${scores['best-practices'].score * 100}/100`);
      log.success(`SEO评分: ${scores.seo.score * 100}/100`);

      log.info('核心Web指标:');
      log.info(`  首次内容绘制: ${(report.audits['first-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
      log.info(`  最大内容绘制: ${(report.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)}s`);
      log.info(`  速度指数: ${(report.audits['speed-index'].numericValue / 1000).toFixed(2)}s`);
      log.info(`  累积布局偏移: ${report.audits['cumulative-layout-shift'].numericValue.toFixed(3)}`);
      log.info(`  总阻塞时间: ${report.audits['total-blocking-time'].numericValue.toFixed(0)}ms`);
    }

    await chrome.kill();
  } catch (error) {
    log.error('前端性能测试失败: ' + error.message);
    log.warn('请确保已安装lighthouse和chrome-launcher: npm install -g lighthouse chrome-launcher');
  }
}

// 负载测试
async function testLoadPerformance() {
  log.perf('开始负载测试...');
  
  const concurrentUsers = [1, 5, 10, 20];
  const testDuration = 30000; // 30秒
  
  for (const userCount of concurrentUsers) {
    log.info(`测试并发用户数: ${userCount}`);
    
    const promises = [];
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < userCount; i++) {
      promises.push(simulateUser(i, testDuration, results));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / totalRequests;
    
    log.success(`并发用户 ${userCount} - 总请求: ${totalRequests}, 成功: ${successfulRequests}, 平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    log.info(`  成功率: ${((successfulRequests / totalRequests) * 100).toFixed(1)}%, 总耗时: ${(totalTime / 1000).toFixed(1)}s`);
    log.info(`  吞吐量: ${(totalRequests / (totalTime / 1000)).toFixed(2)} 请求/秒`);
  }
}

// 模拟用户行为
async function simulateUser(userId, duration, results) {
  const endTime = Date.now() + duration;
  
  while (Date.now() < endTime) {
    try {
      const startTime = performance.now();
      
      // 随机选择一个API端点进行测试
      const endpoints = [
        { method: 'GET', url: '/tweets/feed' },
        { method: 'GET', url: '/tweets/search?q=test' },
        { method: 'GET', url: '/tweets/trending' }
      ];
      
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      
      const response = await axios.get(API_BASE_URL + endpoint.url, {
        timeout: 5000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      results.push({
        userId,
        success: response.status >= 200 && response.status < 300,
        responseTime,
        endpoint: endpoint.url
      });
      
    } catch (error) {
      results.push({
        userId,
        success: false,
        responseTime: 0,
        error: error.message
      });
    }
    
    // 模拟用户思考时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
}

// 内存使用测试
async function testMemoryUsage() {
  log.perf('开始内存使用测试...');
  
  const initialMemory = process.memoryUsage();
  log.info(`初始内存使用: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  
  // 执行大量API调用
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(
      axios.get(API_BASE_URL + '/tweets/feed').catch(() => {})
    );
  }
  
  await Promise.all(promises);
  
  // 强制垃圾回收（如果可用）
  if (global.gc) {
    global.gc();
  }
  
  const finalMemory = process.memoryUsage();
  log.info(`最终内存使用: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  log.info(`内存增长: ${((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024).toFixed(2)} MB`);
}

// 生成性能报告
function generatePerformanceReport() {
  log.perf('生成性能测试报告...');
  
  console.log('\n' + '='.repeat(60).cyan);
  console.log('📊 性能测试报告'.bold.cyan);
  console.log('='.repeat(60).cyan);
  
  // API性能报告
  if (Object.keys(performanceResults.api).length > 0) {
    console.log('\n🔌 API性能指标:'.bold.blue);
    console.log('-'.repeat(40).gray);
    
    for (const [endpoint, metrics] of Object.entries(performanceResults.api)) {
      console.log(`\n${endpoint}:`);
      console.log(`  平均响应时间: ${metrics.average.toFixed(2)}ms`);
      console.log(`  最小响应时间: ${metrics.min.toFixed(2)}ms`);
      console.log(`  最大响应时间: ${metrics.max.toFixed(2)}ms`);
      console.log(`  中位数响应时间: ${metrics.median.toFixed(2)}ms`);
      console.log(`  成功率: ${metrics.successRate.toFixed(1)}%`);
      
      // 性能评级
      let rating = '优秀';
      if (metrics.average > 1000) rating = '需要优化';
      else if (metrics.average > 500) rating = '一般';
      else if (metrics.average > 200) rating = '良好';
      
      console.log(`  性能评级: ${rating}`);
    }
  }
  
  // 前端性能报告
  if (Object.keys(performanceResults.frontend).length > 0) {
    console.log('\n🌐 前端性能指标:'.bold.blue);
    console.log('-'.repeat(40).gray);
    
    const frontend = performanceResults.frontend;
    console.log(`\nLighthouse评分:`);
    console.log(`  性能: ${frontend.performance}/100`);
    console.log(`  可访问性: ${frontend.accessibility}/100`);
    console.log(`  最佳实践: ${frontend.bestPractices}/100`);
    console.log(`  SEO: ${frontend.seo}/100`);
    
    if (frontend.metrics) {
      console.log(`\n核心Web指标:`);
      console.log(`  首次内容绘制: ${(frontend.metrics.firstContentfulPaint / 1000).toFixed(2)}s`);
      console.log(`  最大内容绘制: ${(frontend.metrics.largestContentfulPaint / 1000).toFixed(2)}s`);
      console.log(`  速度指数: ${(frontend.metrics.speedIndex / 1000).toFixed(2)}s`);
      console.log(`  累积布局偏移: ${frontend.metrics.cumulativeLayoutShift.toFixed(3)}`);
      console.log(`  总阻塞时间: ${frontend.metrics.totalBlockingTime.toFixed(0)}ms`);
    }
  }
  
  // 性能建议
  console.log('\n💡 性能优化建议:'.bold.yellow);
  console.log('-'.repeat(40).gray);
  
  const suggestions = [];
  
  // 基于API性能给出建议
  for (const [endpoint, metrics] of Object.entries(performanceResults.api)) {
    if (metrics.average > 1000) {
      suggestions.push(`${endpoint}: 响应时间过长，考虑优化数据库查询或添加缓存`);
    }
    if (metrics.successRate < 95) {
      suggestions.push(`${endpoint}: 成功率较低，检查错误处理和服务器稳定性`);
    }
  }
  
  // 基于前端性能给出建议
  if (performanceResults.frontend.performance < 80) {
    suggestions.push('前端性能评分较低，考虑代码分割、图片优化、CDN等优化措施');
  }
  if (performanceResults.frontend.accessibility < 90) {
    suggestions.push('可访问性需要改进，添加ARIA标签、改善颜色对比度等');
  }
  
  if (suggestions.length > 0) {
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  } else {
    console.log('🎉 性能表现良好，无需特别优化！');
  }
  
  console.log('\n' + '='.repeat(60).cyan);
}

// 主函数
async function main() {
  console.log('⚡ Twitter Replica 性能测试工具'.bold.magenta);
  console.log(`🌐 API地址: ${API_BASE_URL}`.gray);
  console.log(`🖥️  前端地址: ${FRONTEND_URL}`.gray);
  console.log(`🔄 测试迭代次数: ${TEST_ITERATIONS}`.gray);
  console.log('');
  
  try {
    // 检查服务器连接
    log.info('检查服务器连接...');
    await axios.get(API_BASE_URL.replace('/api', '/health'), { timeout: 5000 });
    log.success('服务器连接正常');
    
    // 运行性能测试
    await testAPIPerformance();
    await testFrontendPerformance();
    await testLoadPerformance();
    await testMemoryUsage();
    
    // 生成报告
    generatePerformanceReport();
    
  } catch (error) {
    log.error('性能测试失败: ' + error.message);
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  log.error('未处理的Promise拒绝: ' + reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error('未捕获的异常: ' + error.message);
  process.exit(1);
});

// 启动测试
if (require.main === module) {
  main().catch(error => {
    log.error('测试执行失败: ' + error.message);
    process.exit(1);
  });
}

module.exports = {
  testAPIPerformance,
  testFrontendPerformance,
  testLoadPerformance,
  generatePerformanceReport
};