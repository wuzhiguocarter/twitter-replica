const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Tweet = require('../src/models/Tweet');

describe('Tweets API', () => {
  let accessToken;
  let userId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/twitter-replica-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // 清理测试数据
    await User.deleteMany({});
    await Tweet.deleteMany({});

    // 创建测试用户
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!',
      displayName: 'Test User'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    accessToken = registerResponse.body.data.tokens.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/tweets', () => {
    it('should create a new tweet', async () => {
      const tweetData = {
        content: '这是一条测试推文 #测试 #Twitter'
      };

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tweetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweet.content).toBe(tweetData.content);
      expect(response.body.data.tweet.author.username).toBe('testuser');
      expect(response.body.data.tweet.hashtags).toContain('测试');
      expect(response.body.data.tweet.hashtags).toContain('Twitter');

      // 验证推文已保存到数据库
      const savedTweet = await Tweet.findById(response.body.data.tweet.id);
      expect(savedTweet).toBeTruthy();
      expect(savedTweet.content).toBe(tweetData.content);
    });

    it('should not create tweet without authentication', async () => {
      const tweetData = {
        content: '这是一条测试推文'
      };

      const response = await request(app)
        .post('/api/tweets')
        .send(tweetData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not create tweet with empty content', async () => {
      const tweetData = {
        content: ''
      };

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tweetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not create tweet with content too long', async () => {
      const tweetData = {
        content: 'a'.repeat(281) // 超过280字符限制
      };

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tweetData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should create reply tweet', async () => {
      // 先创建原推文
      const originalTweet = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '原始推文' });

      const replyData = {
        content: '这是一条回复',
        replyTo: originalTweet.body.data.tweet.id
      };

      const response = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(replyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweet.replyTo).toBe(originalTweet.body.data.tweet.id);
    });
  });

  describe('GET /api/tweets/feed', () => {
    beforeEach(async () => {
      // 创建一些测试推文
      const tweets = [
        { content: '第一条推文' },
        { content: '第二条推文' },
        { content: '第三条推文' }
      ];

      for (const tweet of tweets) {
        await request(app)
          .post('/api/tweets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(tweet);
      }
    });

    it('should get user feed', async () => {
      const response = await request(app)
        .get('/api/tweets/feed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweets).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      
      // 验证推文按时间倒序排列
      const tweets = response.body.data.tweets;
      expect(new Date(tweets[0].createdAt) >= new Date(tweets[1].createdAt)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/tweets/feed?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweets).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should not get feed without authentication', async () => {
      const response = await request(app)
        .get('/api/tweets/feed')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tweets/:id', () => {
    let tweetId;

    beforeEach(async () => {
      const tweetResponse = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '测试推文' });

      tweetId = tweetResponse.body.data.tweet.id;
    });

    it('should get specific tweet', async () => {
      const response = await request(app)
        .get(`/api/tweets/${tweetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweet.id).toBe(tweetId);
      expect(response.body.data.tweet.content).toBe('测试推文');
    });

    it('should return 404 for non-existent tweet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tweets/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tweets/:id/like', () => {
    let tweetId;

    beforeEach(async () => {
      const tweetResponse = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '测试推文' });

      tweetId = tweetResponse.body.data.tweet.id;
    });

    it('should like a tweet', async () => {
      const response = await request(app)
        .post(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(true);
      expect(response.body.data.likesCount).toBe(1);
    });

    it('should unlike a tweet when liked again', async () => {
      // 先点赞
      await request(app)
        .post(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      // 再次点赞（取消点赞）
      const response = await request(app)
        .post(`/api/tweets/${tweetId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(false);
      expect(response.body.data.likesCount).toBe(0);
    });

    it('should not like non-existent tweet', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/tweets/${fakeId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tweets/:id/retweet', () => {
    let tweetId;

    beforeEach(async () => {
      const tweetResponse = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '测试推文' });

      tweetId = tweetResponse.body.data.tweet.id;
    });

    it('should retweet a tweet', async () => {
      const response = await request(app)
        .post(`/api/tweets/${tweetId}/retweet`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.retweeted).toBe(true);
      expect(response.body.data.retweetsCount).toBe(1);
    });

    it('should create quote tweet with comment', async () => {
      const response = await request(app)
        .post(`/api/tweets/${tweetId}/retweet`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ comment: '这是引用转发的评论' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.quoteTweet).toBeDefined();
      expect(response.body.data.quoteTweet.content).toBe('这是引用转发的评论');
    });
  });

  describe('DELETE /api/tweets/:id', () => {
    let tweetId;

    beforeEach(async () => {
      const tweetResponse = await request(app)
        .post('/api/tweets')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '测试推文' });

      tweetId = tweetResponse.body.data.tweet.id;
    });

    it('should delete own tweet', async () => {
      const response = await request(app)
        .delete(`/api/tweets/${tweetId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 验证推文已从数据库删除
      const deletedTweet = await Tweet.findById(tweetId);
      expect(deletedTweet).toBeNull();
    });

    it('should not delete other user\'s tweet', async () => {
      // 创建另一个用户
      const otherUserData = {
        username: 'otheruser',
        email: 'other@example.com',
        password: 'Test123!',
        displayName: 'Other User'
      };

      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send(otherUserData);

      const otherAccessToken = otherUserResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .delete(`/api/tweets/${tweetId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tweets/search', () => {
    beforeEach(async () => {
      const tweets = [
        { content: '这是关于JavaScript的推文 #JavaScript' },
        { content: '学习React很有趣 #React #前端' },
        { content: '今天天气不错' }
      ];

      for (const tweet of tweets) {
        await request(app)
          .post('/api/tweets')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(tweet);
      }
    });

    it('should search tweets by content', async () => {
      const response = await request(app)
        .get('/api/tweets/search?q=JavaScript')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweets).toHaveLength(1);
      expect(response.body.data.tweets[0].content).toContain('JavaScript');
    });

    it('should search tweets by hashtag', async () => {
      const response = await request(app)
        .get('/api/tweets/search?q=%23React')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweets).toHaveLength(1);
      expect(response.body.data.tweets[0].hashtags).toContain('React');
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request(app)
        .get('/api/tweets/search?q=nonexistent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tweets).toHaveLength(0);
    });
  });
});