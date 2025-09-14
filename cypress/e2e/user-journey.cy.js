describe('Twitter Replica - Complete User Journey', () => {
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!',
    displayName: 'E2E Test User'
  };

  beforeEach(() => {
    // 访问应用首页
    cy.visit('/');
  });

  it('完整的用户旅程测试', () => {
    // 1. 用户注册流程
    cy.log('开始用户注册流程');
    
    // 点击注册链接
    cy.contains('Sign up').click();
    cy.url().should('include', '/register');
    
    // 填写注册表单
    cy.get('[data-testid="displayName-input"]').type(testUser.displayName);
    cy.get('[data-testid="username-input"]').type(testUser.username);
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="confirmPassword-input"]').type(testUser.password);
    
    // 提交注册表单
    cy.get('[data-testid="register-submit"]').click();
    
    // 验证注册成功并跳转到主页
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('Welcome').should('be.visible');

    // 2. 创建第一条推文
    cy.log('创建第一条推文');
    
    // 找到推文输入框并输入内容
    cy.get('[data-testid="tweet-input"]').type('这是我的第一条推文！🚀 #测试 #E2E');
    
    // 点击发布按钮
    cy.get('[data-testid="tweet-submit"]').click();
    
    // 验证推文出现在时间线中
    cy.contains('这是我的第一条推文！🚀').should('be.visible');
    cy.contains('#测试').should('be.visible');
    cy.contains('#E2E').should('be.visible');

    // 3. 测试推文交互功能
    cy.log('测试推文交互功能');
    
    // 点赞推文
    cy.get('[data-testid="like-button"]').first().click();
    cy.get('[data-testid="like-count"]').first().should('contain', '1');
    
    // 转发推文
    cy.get('[data-testid="retweet-button"]').first().click();
    cy.get('[data-testid="retweet-count"]').first().should('contain', '1');
    
    // 收藏推文
    cy.get('[data-testid="bookmark-button"]').first().click();
    // 验证收藏状态改变
    cy.get('[data-testid="bookmark-button"]').first().should('have.class', 'bookmarked');

    // 4. 创建回复推文
    cy.log('创建回复推文');
    
    // 点击回复按钮
    cy.get('[data-testid="reply-button"]').first().click();
    
    // 在回复框中输入内容
    cy.get('[data-testid="reply-input"]').type('这是一条回复推文');
    cy.get('[data-testid="reply-submit"]').click();
    
    // 验证回复出现
    cy.contains('这是一条回复推文').should('be.visible');

    // 5. 测试用户资料功能
    cy.log('测试用户资料功能');
    
    // 点击用户头像或用户名进入个人资料页
    cy.get('[data-testid="user-avatar"]').first().click();
    
    // 验证个人资料页面
    cy.url().should('include', `/${testUser.username}`);
    cy.contains(testUser.displayName).should('be.visible');
    cy.contains(`@${testUser.username}`).should('be.visible');
    
    // 编辑个人资料
    cy.get('[data-testid="edit-profile-button"]').click();
    cy.get('[data-testid="bio-input"]').type('这是我的个人简介');
    cy.get('[data-testid="location-input"]').type('北京, 中国');
    cy.get('[data-testid="save-profile-button"]').click();
    
    // 验证资料更新成功
    cy.contains('这是我的个人简介').should('be.visible');
    cy.contains('北京, 中国').should('be.visible');

    // 6. 测试搜索功能
    cy.log('测试搜索功能');
    
    // 使用搜索框搜索推文
    cy.get('[data-testid="search-input"]').type('测试{enter}');
    
    // 验证搜索结果
    cy.url().should('include', '/search');
    cy.contains('这是我的第一条推文').should('be.visible');

    // 7. 测试导航功能
    cy.log('测试导航功能');
    
    // 测试侧边栏导航
    cy.get('[data-testid="nav-home"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    cy.get('[data-testid="nav-bookmarks"]').click();
    cy.url().should('include', '/bookmarks');
    
    cy.get('[data-testid="nav-notifications"]').click();
    cy.url().should('include', '/notifications');

    // 8. 测试响应式设计
    cy.log('测试响应式设计');
    
    // 切换到移动设备视图
    cy.viewport('iphone-x');
    
    // 验证移动端布局
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-nav-menu"]').should('be.visible');
    
    // 切换回桌面视图
    cy.viewport(1280, 720);

    // 9. 测试登出功能
    cy.log('测试登出功能');
    
    // 点击用户菜单
    cy.get('[data-testid="user-menu-button"]').click();
    
    // 点击登出
    cy.get('[data-testid="logout-button"]').click();
    
    // 验证跳转到登录页面
    cy.url().should('include', '/login');
    cy.contains('Sign in to Twitter').should('be.visible');

    // 10. 测试重新登录
    cy.log('测试重新登录');
    
    // 使用刚才注册的账户登录
    cy.get('[data-testid="login-identifier"]').type(testUser.username);
    cy.get('[data-testid="login-password"]').type(testUser.password);
    cy.get('[data-testid="login-submit"]').click();
    
    // 验证登录成功
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains(testUser.displayName).should('be.visible');
  });

  it('错误处理测试', () => {
    cy.log('测试错误处理');
    
    // 测试无效登录
    cy.visit('/login');
    cy.get('[data-testid="login-identifier"]').type('nonexistent');
    cy.get('[data-testid="login-password"]').type('wrongpassword');
    cy.get('[data-testid="login-submit"]').click();
    
    // 验证错误消息显示
    cy.contains('用户不存在或密码错误').should('be.visible');
    
    // 测试表单验证
    cy.visit('/register');
    cy.get('[data-testid="register-submit"]').click();
    
    // 验证必填字段错误
    cy.contains('显示名称是必填项').should('be.visible');
    cy.contains('用户名是必填项').should('be.visible');
    cy.contains('邮箱是必填项').should('be.visible');
    
    // 测试密码强度验证
    cy.get('[data-testid="password-input"]').type('123');
    cy.get('[data-testid="password-input"]').blur();
    cy.contains('密码至少需要6个字符').should('be.visible');
  });

  it('性能测试', () => {
    cy.log('测试页面加载性能');
    
    // 测试首页加载时间
    const start = Date.now();
    cy.visit('/');
    cy.get('[data-testid="main-content"]').should('be.visible').then(() => {
      const loadTime = Date.now() - start;
      expect(loadTime).to.be.lessThan(3000); // 页面应在3秒内加载完成
    });
    
    // 测试大量数据加载
    cy.intercept('GET', '/api/tweets/feed*', { fixture: 'large-tweet-list.json' });
    cy.reload();
    
    // 验证虚拟滚动或分页工作正常
    cy.get('[data-testid="tweet-item"]').should('have.length.at.most', 20);
  });

  it('可访问性测试', () => {
    cy.log('测试可访问性');
    
    cy.visit('/');
    
    // 测试键盘导航
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'search-input');
    
    cy.tab();
    cy.focused().should('have.attr', 'data-testid', 'nav-home');
    
    // 测试ARIA标签
    cy.get('[data-testid="tweet-input"]').should('have.attr', 'aria-label');
    cy.get('[data-testid="like-button"]').should('have.attr', 'aria-label');
    
    // 测试颜色对比度（需要cypress-axe插件）
    cy.injectAxe();
    cy.checkA11y();
  });

  it('离线功能测试', () => {
    cy.log('测试离线功能');
    
    // 模拟网络断开
    cy.intercept('GET', '/api/**', { forceNetworkError: true });
    
    cy.visit('/');
    
    // 验证离线提示显示
    cy.contains('网络连接已断开').should('be.visible');
    
    // 验证缓存的内容仍然可见
    cy.get('[data-testid="cached-content"]').should('be.visible');
  });
});