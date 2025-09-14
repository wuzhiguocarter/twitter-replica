#!/bin/bash

# Twitter Replica 快速测试脚本
# 用于快速验证应用的基本功能

echo "🚀 Twitter Replica 快速功能验证"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Node.js和npm
echo -e "${BLUE}📋 检查环境依赖...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本: $(node --version)${NC}"
echo -e "${GREEN}✅ npm 版本: $(npm --version)${NC}"

# 检查MongoDB连接
echo -e "${BLUE}📋 检查MongoDB连接...${NC}"
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB 连接正常${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB 连接失败，请确保MongoDB正在运行${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  mongosh 未安装，跳过MongoDB检查${NC}"
fi

# 检查后端服务器
echo -e "${BLUE}📋 检查后端服务器...${NC}"
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 后端服务器运行正常${NC}"
    
    # 测试基本API端点
    echo -e "${BLUE}🧪 测试API端点...${NC}"
    
    # 测试健康检查
    if curl -s http://localhost:5000/health | grep -q "OK"; then
        echo -e "${GREEN}✅ 健康检查端点正常${NC}"
    else
        echo -e "${RED}❌ 健康检查端点异常${NC}"
    fi
    
    # 测试注册端点（应该返回400，因为没有提供数据）
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/register)
    if [ "$status_code" = "400" ]; then
        echo -e "${GREEN}✅ 注册端点响应正常${NC}"
    else
        echo -e "${YELLOW}⚠️  注册端点响应异常 (状态码: $status_code)${NC}"
    fi
    
    # 测试登录端点（应该返回400，因为没有提供数据）
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/login)
    if [ "$status_code" = "400" ]; then
        echo -e "${GREEN}✅ 登录端点响应正常${NC}"
    else
        echo -e "${YELLOW}⚠️  登录端点响应异常 (状态码: $status_code)${NC}"
    fi
    
else
    echo -e "${RED}❌ 后端服务器未运行${NC}"
    echo -e "${YELLOW}💡 请运行: cd server && npm run dev${NC}"
fi

# 检查前端服务器
echo -e "${BLUE}📋 检查前端服务器...${NC}"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 前端服务器运行正常${NC}"
    
    # 检查主要页面
    if curl -s http://localhost:5173 | grep -q "Twitter"; then
        echo -e "${GREEN}✅ 主页加载正常${NC}"
    else
        echo -e "${YELLOW}⚠️  主页内容异常${NC}"
    fi
    
else
    echo -e "${RED}❌ 前端服务器未运行${NC}"
    echo -e "${YELLOW}💡 请运行: npm run dev${NC}"
fi

# 运行API测试（如果后端正在运行）
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${BLUE}🧪 运行API功能测试...${NC}"
    
    if [ -f "test-api.js" ]; then
        # 检查是否安装了必要的依赖
        if npm list axios colors > /dev/null 2>&1; then
            echo -e "${BLUE}🔄 执行API测试...${NC}"
            node test-api.js
        else
            echo -e "${YELLOW}⚠️  缺少测试依赖，请运行: npm install axios colors${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  API测试脚本不存在${NC}"
    fi
fi

# 检查文件结构
echo -e "${BLUE}📋 检查项目文件结构...${NC}"

required_files=(
    "package.json"
    "src/App.tsx"
    "src/services/api.ts"
    "src/context/AuthContext.tsx"
    "src/context/TweetContext.tsx"
    "src/components/Login.tsx"
    "src/components/Register.tsx"
    "server/package.json"
    "server/src/server.js"
    "server/src/models/User.js"
    "server/src/models/Tweet.js"
    "server/src/controllers/authController.js"
    "server/src/controllers/tweetController.js"
    "server/src/routes/auth.js"
    "server/src/routes/tweets.js"
    ".openhands/microagents/twitter-replica-enhancement.md"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file${NC}"
        missing_files+=("$file")
    fi
done

# 检查环境配置文件
echo -e "${BLUE}📋 检查环境配置...${NC}"

if [ -f ".env" ]; then
    echo -e "${GREEN}✅ 前端环境配置文件存在${NC}"
else
    echo -e "${YELLOW}⚠️  前端环境配置文件缺失${NC}"
    echo -e "${YELLOW}💡 请复制: cp .env.example .env${NC}"
fi

if [ -f "server/.env" ]; then
    echo -e "${GREEN}✅ 后端环境配置文件存在${NC}"
else
    echo -e "${YELLOW}⚠️  后端环境配置文件缺失${NC}"
    echo -e "${YELLOW}💡 请复制: cp server/.env.example server/.env${NC}"
fi

# 总结
echo -e "\n${BLUE}📊 验证总结${NC}"
echo "=================================="

if [ ${#missing_files[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 所有核心文件都存在！${NC}"
else
    echo -e "${RED}⚠️  缺少 ${#missing_files[@]} 个核心文件${NC}"
fi

# 提供下一步建议
echo -e "\n${BLUE}💡 下一步建议${NC}"
echo "=================================="

if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}1. 启动后端服务器:${NC}"
    echo "   cd server"
    echo "   npm install"
    echo "   npm run dev"
fi

if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${YELLOW}2. 启动前端服务器:${NC}"
    echo "   npm install"
    echo "   npm run dev"
fi

echo -e "${YELLOW}3. 运行完整测试:${NC}"
echo "   npm run test:api      # API测试"
echo "   npm run test          # 单元测试"
echo "   npm run test:e2e      # 端到端测试"

echo -e "${YELLOW}4. 性能测试:${NC}"
echo "   npm run test:performance"

echo -e "\n${GREEN}🚀 验证完成！${NC}"