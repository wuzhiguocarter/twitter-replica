#!/usr/bin/env node

/**
 * Twitter Replica API 测试脚本
 * 用于验证后端API功能的完整性
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER = {
  username: 'testuser_' + Date.now(),
  email: `test_${Date.now()}@example.com`,
  password: 'Test123!',
  displayName: 'API Test User'
};

let accessToken = '';
let userId = '';
let tweetId = '';

// 工具函数
const log = {
  info: (msg) => console.log('ℹ️ '.blue + msg),
  success: (msg) => console.log('✅ '.green + msg.green),
  error: (msg) => console.log('❌ '.red + msg.red),
  warn: (msg) => console.log('⚠️ '.yellow + msg.yellow),
  test: (msg) => console.log('🧪 '.cyan + msg.cyan)
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API 调用函数
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// 添加请求拦截器
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 测试函数
async function testUserRegistration() {
  log.test('测试用户注册...');
  
  try {
    const response = await api.post('/auth/register', TEST_USER);
    
    if (response.data.success) {
      accessToken = response.data.data.tokens.accessToken;
      userId = response.data.data.user.id;
      log.success('用户注册成功');
      log.info(`用户ID: ${userId}`);
      log.info(`访问令牌: ${accessToken.substring(0, 20)}...`);
      return true;
    } else {
      log.error('注册失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('注册请求失败: ' + error.message);
    if (error.response) {
      log.error('响应数据: ' + JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function testUserLogin() {
  log.test('测试用户登录...');
  
  try {
    const response = await api.post('/auth/login', {
      identifier: TEST_USER.username,
      password: TEST_USER.password
    });
    
    if (response.data.success) {
      accessToken = response.data.data.tokens.accessToken;
      log.success('用户登录成功');
      return true;
    } else {
      log.error('登录失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('登录请求失败: ' + error.message);
    return false;
  }
}

async function testGetProfile() {
  log.test('测试获取用户资料...');
  
  try {
    const response = await api.get('/auth/profile');
    
    if (response.data.success) {
      const user = response.data.data.user;
      log.success('获取用户资料成功');
      log.info(`用户名: ${user.username}`);
      log.info(`显示名称: ${user.displayName}`);
      log.info(`邮箱: ${user.email}`);
      return true;
    } else {
      log.error('获取资料失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('获取资料请求失败: ' + error.message);
    return false;
  }
}

async function testUpdateProfile() {
  log.test('测试更新用户资料...');
  
  const updateData = {
    displayName: 'Updated Test User',
    bio: '这是我的个人简介',
    location: '北京, 中国',
    website: 'https://example.com'
  };
  
  try {
    const response = await api.put('/auth/profile', updateData);
    
    if (response.data.success) {
      log.success('更新用户资料成功');
      log.info(`新的显示名称: ${response.data.data.user.displayName}`);
      log.info(`个人简介: ${response.data.data.user.bio}`);
      return true;
    } else {
      log.error('更新资料失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('更新资料请求失败: ' + error.message);
    return false;
  }
}

async function testCreateTweet() {
  log.test('测试创建推文...');
  
  const tweetData = {
    content: '这是一条API测试推文！🚀 #测试 #TwitterReplica #API'
  };
  
  try {
    const response = await api.post('/tweets', tweetData);
    
    if (response.data.success) {
      tweetId = response.data.data.tweet.id;
      log.success('创建推文成功');
      log.info(`推文ID: ${tweetId}`);
      log.info(`推文内容: ${response.data.data.tweet.content}`);
      log.info(`话题标签: ${response.data.data.tweet.hashtags.join(', ')}`);
      return true;
    } else {
      log.error('创建推文失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('创建推文请求失败: ' + error.message);
    return false;
  }
}

async function testGetFeed() {
  log.test('测试获取推文流...');
  
  try {
    const response = await api.get('/tweets/feed?limit=10');
    
    if (response.data.success) {
      const tweets = response.data.data.tweets;
      log.success(`获取推文流成功，共 ${tweets.length} 条推文`);
      
      if (tweets.length > 0) {
        log.info(`最新推文: ${tweets[0].content.substring(0, 50)}...`);
        log.info(`分页信息: 第${response.data.data.pagination.page}页，共${tweets.length}条`);
      }
      return true;
    } else {
      log.error('获取推文流失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('获取推文流请求失败: ' + error.message);
    return false;
  }
}

async function testLikeTweet() {
  log.test('测试点赞推文...');
  
  if (!tweetId) {
    log.warn('没有可用的推文ID，跳过点赞测试');
    return false;
  }
  
  try {
    const response = await api.post(`/tweets/${tweetId}/like`);
    
    if (response.data.success) {
      log.success('点赞推文成功');
      log.info(`点赞状态: ${response.data.data.liked ? '已点赞' : '已取消点赞'}`);
      log.info(`点赞数: ${response.data.data.likesCount}`);
      return true;
    } else {
      log.error('点赞推文失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('点赞推文请求失败: ' + error.message);
    return false;
  }
}

async function testRetweetTweet() {
  log.test('测试转发推文...');
  
  if (!tweetId) {
    log.warn('没有可用的推文ID，跳过转发测试');
    return false;
  }
  
  try {
    const response = await api.post(`/tweets/${tweetId}/retweet`);
    
    if (response.data.success) {
      log.success('转发推文成功');
      log.info(`转发状态: ${response.data.data.retweeted ? '已转发' : '已取消转发'}`);
      log.info(`转发数: ${response.data.data.retweetsCount}`);
      return true;
    } else {
      log.error('转发推文失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('转发推文请求失败: ' + error.message);
    return false;
  }
}

async function testBookmarkTweet() {
  log.test('测试收藏推文...');
  
  if (!tweetId) {
    log.warn('没有可用的推文ID，跳过收藏测试');
    return false;
  }
  
  try {
    const response = await api.post(`/tweets/${tweetId}/bookmark`, {
      folder: '测试收藏夹',
      notes: '这是一条测试收藏'
    });
    
    if (response.data.success) {
      log.success('收藏推文成功');
      log.info(`收藏状态: ${response.data.data.bookmarked ? '已收藏' : '已取消收藏'}`);
      return true;
    } else {
      log.error('收藏推文失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('收藏推文请求失败: ' + error.message);
    return false;
  }
}

async function testSearchTweets() {
  log.test('测试搜索推文...');
  
  try {
    const response = await api.get('/tweets/search?q=测试&limit=5');
    
    if (response.data.success) {
      const tweets = response.data.data.tweets;
      log.success(`搜索推文成功，找到 ${tweets.length} 条相关推文`);
      
      if (tweets.length > 0) {
        log.info(`第一条结果: ${tweets[0].content.substring(0, 50)}...`);
      }
      return true;
    } else {
      log.error('搜索推文失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('搜索推文请求失败: ' + error.message);
    return false;
  }
}

async function testGetTrendingHashtags() {
  log.test('测试获取热门话题...');
  
  try {
    const response = await api.get('/tweets/trending?limit=10');
    
    if (response.data.success) {
      const hashtags = response.data.data.hashtags;
      log.success(`获取热门话题成功，共 ${hashtags.length} 个话题`);
      
      if (hashtags.length > 0) {
        log.info('热门话题:');
        hashtags.slice(0, 5).forEach((tag, index) => {
          log.info(`  ${index + 1}. #${tag.hashtag} (${tag.count} 次)`);
        });
      }
      return true;
    } else {
      log.error('获取热门话题失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('获取热门话题请求失败: ' + error.message);
    return false;
  }
}

async function testCreateReply() {
  log.test('测试创建回复...');
  
  if (!tweetId) {
    log.warn('没有可用的推文ID，跳过回复测试');
    return false;
  }
  
  const replyData = {
    content: '这是一条回复推文 @' + TEST_USER.username,
    replyTo: tweetId
  };
  
  try {
    const response = await api.post('/tweets', replyData);
    
    if (response.data.success) {
      log.success('创建回复成功');
      log.info(`回复内容: ${response.data.data.tweet.content}`);
      log.info(`回复的推文ID: ${response.data.data.tweet.replyTo}`);
      return true;
    } else {
      log.error('创建回复失败: ' + response.data.message);
      return false;
    }
  } catch (error) {
    log.error('创建回复请求失败: ' + error.message);
    return false;
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始 Twitter Replica API 测试'.bold.blue);
  console.log('='.repeat(50).gray);
  
  const tests = [
    { name: '用户注册', fn: testUserRegistration },
    { name: '用户登录', fn: testUserLogin },
    { name: '获取用户资料', fn: testGetProfile },
    { name: '更新用户资料', fn: testUpdateProfile },
    { name: '创建推文', fn: testCreateTweet },
    { name: '获取推文流', fn: testGetFeed },
    { name: '点赞推文', fn: testLikeTweet },
    { name: '转发推文', fn: testRetweetTweet },
    { name: '收藏推文', fn: testBookmarkTweet },
    { name: '搜索推文', fn: testSearchTweets },
    { name: '获取热门话题', fn: testGetTrendingHashtags },
    { name: '创建回复', fn: testCreateReply }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log('\n' + '-'.repeat(30).gray);
    const result = await test.fn();
    
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // 在测试之间稍作停顿
    await sleep(500);
  }
  
  console.log('\n' + '='.repeat(50).gray);
  console.log('📊 测试结果汇总'.bold.blue);
  console.log(`✅ 通过: ${passed}`.green);
  console.log(`❌ 失败: ${failed}`.red);
  console.log(`📈 成功率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试都通过了！'.bold.green);
  } else {
    console.log('\n⚠️  有一些测试失败了，请检查服务器状态和配置。'.bold.yellow);
  }
}

// 检查服务器连接
async function checkServerConnection() {
  log.info('检查服务器连接...');
  
  try {
    const response = await axios.get(API_BASE_URL.replace('/api', '/health'), {
      timeout: 5000
    });
    log.success('服务器连接正常');
    return true;
  } catch (error) {
    log.error('无法连接到服务器: ' + error.message);
    log.warn('请确保后端服务器正在运行在 ' + API_BASE_URL);
    return false;
  }
}

// 主程序入口
async function main() {
  console.log('🧪 Twitter Replica API 测试工具'.bold.cyan);
  console.log(`🌐 API 地址: ${API_BASE_URL}`.gray);
  console.log(`👤 测试用户: ${TEST_USER.username}`.gray);
  console.log('');
  
  // 检查服务器连接
  const serverOk = await checkServerConnection();
  if (!serverOk) {
    process.exit(1);
  }
  
  // 运行所有测试
  await runAllTests();
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
  runAllTests,
  checkServerConnection
};