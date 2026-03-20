# personal-site

一个简洁优雅的个人网站，基于 React + TypeScript + Supabase + Vercel 构建。

**本项目由 AI（tweb）全程设计与代码编写。**

---

## 🎨 功能特性

- **深色 / 浅色模式**：右上角一键切换，主题偏好自动保存
- **GitHub 登录**：OAuth 无感登录，支持多用户
- **博客管理**：发布、编辑、删除博客文章，支持标签和封面图
- **项目管理**：展示项目，支持 GitHub 链接和在线演示
- **个人资料**：公开 profile 页面，展示站长的 GitHub 头像、昵称和社交链接
- **Admin 后台**：站主专属，含个人设置 + 用户管理两个 Tab
- **权限控制**：仅站长（tw2818）可访问管理后台，其他用户可登录但无管理权限
- **优雅动画**：Framer Motion 驱动，淡入、滑动、悬停反馈

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 动画 | Framer Motion |
| 后端 / BaaS | Supabase（Auth + PostgreSQL + RLS）|
| 部署 | Vercel |
| 样式 | 原生 CSS（Apple 风格设计语言）|

---

## 📦 快速部署

### 1. 环境变量

在 Vercel 项目设置中添加以下环境变量：

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 2. Supabase 配置

- 创建 GitHub OAuth App（[开发者设置](https://github.com/settings/developers)），callback URL 填 `https://<your-project>.supabase.co/auth/v1/callback`
- 在 Supabase Auth 配置中启用 GitHub Provider
- 在 **URL Configuration** 中添加 redirect URLs：
  - `https://<your-project>.supabase.co/auth/v1/callback`
  - `https://<your-vercel-domain>/**`

### 3. 数据库 Schema

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT, nickname TEXT DEFAULT '', avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '', github TEXT DEFAULT '',
  bilibili TEXT DEFAULT '', twitter TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
  cover_url TEXT DEFAULT '', tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '', github_url TEXT DEFAULT '',
  demo_url TEXT DEFAULT '', featured BOOLEAN DEFAULT false
);
```

### 4. 推送代码

```bash
git push
```

Vercel 会自动检测 Vite preset 并完成部署。

---

## 🔧 本地开发

```bash
npm install
npm run dev
```

---

## 📁 项目结构

```
src/
├── components/
│   ├── Navbar.tsx         # 导航栏（含主题切换）
│   └── ProtectedRoute.tsx # 权限守卫
├── contexts/
│   └── AuthContext.tsx     # Auth 状态管理
├── pages/
│   ├── Home.tsx            # 首页
│   ├── Blog.tsx            # 博客列表
│   ├── BlogDetail.tsx      # 博客详情
│   ├── NewBlog.tsx         # 新建博客
│   ├── EditBlog.tsx        # 编辑博客
│   ├── Projects.tsx        # 项目展示
│   ├── NewProject.tsx       # 新增项目
│   ├── EditProject.tsx      # 编辑项目
│   ├── Profile.tsx         # 关于页面
│   ├── Admin.tsx           # 管理后台（设置 + 用户管理）
│   └── Login.tsx           # GitHub 登录
├── lib/
│   └── supabase.ts         # Supabase 客户端
└── index.css               # 全局样式
```

---

> 本网站是 AI 助手 **tweb** 完全自主设计与编写的一个实验性项目。
