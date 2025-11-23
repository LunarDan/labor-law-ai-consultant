# 劳动法AI咨询系统

一个基于 Vue 3 + TypeScript + Vite 的现代化劳动法AI咨询系统，提供智能法律咨询、合同审查和知识库查询服务。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite 6
- **语言**: TypeScript 5
- **状态管理**: Pinia 3
- **路由**: Vue Router 4
- **UI 组件库**: Element Plus 2
- **HTTP 客户端**: Axios 1
- **代码规范**: ESLint + Prettier
- **Git 提交规范**: Commitlint + Husky

## 功能特性

- 🤖 AI 智能法律咨询
- 📄 劳动合同智能审查
- 📚 劳动法规知识库查询
- 👤 用户身份验证（个人用户/企业用户）
- 💾 对话历史记录管理
- ⭐ 法规收藏功能
- 🔄 Token 自动刷新机制

## 开发环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0 或 pnpm

## 快速开始

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 环境变量配置

项目需要配置环境变量。请根据 `.env.example` 文件创建以下环境变量文件：

1. 开发环境：`.env.development`
2. 生产环境：`.env.production`

**重要**: `.gitignore` 已配置忽略环境变量文件，请勿将包含敏感信息的环境变量文件提交到版本控制。

示例配置（`.env.development`）：

```env
VITE_APP_TITLE=劳动法AI咨询系统
VITE_APP_ENV=development
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT=60000
VITE_PROXY_TARGET=http://your-backend-address:port
```

### 开发

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建

```bash
# 生产环境构建
npm run build

# 开发环境构建
npm run build:dev
```

### 预览构建产物

```bash
npm run preview
```

## 代码规范

### 代码检查

```bash
# 检查代码
npm run lint

# 自动修复
npm run lint:fix
```

### 代码格式化

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check
```

## 项目结构

```
labor-law-ai-consultant/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口
│   │   ├── index.ts       # Axios 配置
│   │   ├── auth.ts        # 认证接口
│   │   ├── chat.ts        # 对话接口
│   │   └── knowledge.ts   # 知识库接口
│   ├── assets/            # 资源文件
│   │   ├── css/           # 样式文件
│   │   └── images/        # 图片资源
│   ├── router/            # 路由配置
│   ├── stores/            # Pinia 状态管理
│   ├── types/             # TypeScript 类型定义
│   ├── views/             # 页面组件
│   │   ├── Home/          # 主页模块
│   │   ├── Login/         # 登录页面
│   │   └── ...
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── .env.example           # 环境变量示例
├── .gitignore             # Git 忽略配置
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目配置

```

## 主要配置说明

### Vite 配置

- ✅ 环境变量支持
- ✅ 开发服务器代理配置
- ✅ 生产环境构建优化（代码分割、压缩、Tree Shaking）
- ✅ 移除生产环境 console
- ✅ 静态资源分类打包

### API 配置

- ✅ 统一的 Axios 实例
- ✅ 请求/响应拦截器
- ✅ Token 自动刷新机制
- ✅ 错误统一处理

## 部署建议

### 生产环境部署

1. **构建项目**

   ```bash
   npm run build
   ```

2. **配置 Nginx**
   - 配置反向代理到后端 API
   - 配置 SPA 路由支持
   - 开启 gzip 压缩
   - 配置缓存策略

3. **环境变量**
   - 生产环境使用相对路径 API 地址
   - 通过 Nginx 反向代理到后端服务

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://your-backend-server:port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
}
```

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

[MIT License]

## 贡献指南

欢迎提交 Issue 和 Pull Request！
