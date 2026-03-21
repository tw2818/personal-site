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
- **Admin 后台**：站主专属，含博客管理 + 用户管理两个 Tab
- **权限控制**：仅站长可访问管理后台，其他用户可登录但无管理权限
- **优雅动画**：Framer Motion 驱动，淡入、滑动、悬停反馈

---

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript + Vite |
| 动画 | Framer Motion |
| 后端 / BaaS | Supabase（Auth + PostgreSQL + RLS）|
| 部署 | Vercel |
| 样式 | 原生 CSS（Apple 风格设计语言）|

---

## ⚙️ 环境配置

### 1. 克隆项目

```bash
git clone https://github.com/tw2818/personal-site.git
cd personal-site
npm install
```

### 2. 环境变量

复制 `.env.example` 为 `.env`，填入你的 Supabase 项目凭证：

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase 配置

**3.1 GitHub OAuth App**

在 [GitHub Developer Settings](https://github.com/settings/developers) 创建 OAuth App：
- Homepage URL: `https://your-site.com`
- Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

**3.2 Supabase Auth Provider**

在 Supabase Dashboard → Authentication → Providers → GitHub，填入 GitHub OAuth App 的 Client ID 和 Secret。

**3.3 Redirect URLs**

在 Authentication → URL Configuration → Redirect URLs 添加：
```
https://your-site.com/**
https://your-project.supabase.co/auth/v1/callback
```

**3.4 数据库**

在 Supabase SQL Editor 运行以下 schema：

```sql
-- profiles（用户资料）
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT, nickname TEXT DEFAULT '', avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '', github TEXT DEFAULT '',
  bilibili TEXT DEFAULT '', twitter TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- blogs（博客）
CREATE TABLE blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
  cover_url TEXT DEFAULT '', tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- projects（项目）
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT DEFAULT '',
  cover_url TEXT DEFAULT '', github_url TEXT DEFAULT '',
  demo_url TEXT DEFAULT '', featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- comments（评论）
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID REFERENCES blogs ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  nickname TEXT NOT NULL, avatar_url TEXT DEFAULT '',
  content TEXT NOT NULL, pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- tags（标签）
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6366f1', created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 自动创建 profile 的 trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nickname, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'preferred_username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 管理员用户名（改为你的 GitHub username）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
```

**3.5 运行数据库 migrations**

```bash
supabase db push
```

或直接在 Supabase SQL Editor 中导入 `supabase/migrations/` 下的所有文件。

### 4. 部署

```bash
git push
```

Vercel 会自动检测 Vite 并完成部署。记得在 Vercel 项目设置中添加环境变量 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。

---

## 📁 项目结构

```
src/
├── lib/
│   ├── config.ts          # Supabase URL/Key/管理员用户名常量
│   ├── supabase.ts         # Supabase JS 客户端（Auth 用）
│   ├── apiWrite.ts         # 统一写操作 REST API
│   └── storage.ts          # 图片上传
├── components/
│   ├── Navbar.tsx          # 导航栏（含主题切换、管理入口）
│   ├── ProtectedRoute.tsx  # 权限守卫（仅管理员可访问）
│   └── TagSelector.tsx     # 博客编辑页的标签选择组件
├── contexts/
│   └── AuthContext.tsx     # Auth 状态管理（localStorage 读取，避免 getSession 卡死）
├── pages/
│   ├── Home.tsx            # 首页
│   ├── Login.tsx           # GitHub 登录
│   ├── Blog.tsx            # 博客列表（含标签筛选、搜索）
│   ├── BlogDetail.tsx      # 博客详情（含评论系统）
│   ├── NewBlog.tsx         # 新建博客
│   ├── EditBlog.tsx       # 编辑博客
│   ├── Projects.tsx        # 项目展示
│   ├── NewProject.tsx      # 新增项目
│   ├── EditProject.tsx    # 编辑项目
│   ├── Profile.tsx         # 关于页面
│   └── Admin.tsx           # 管理后台（博客管理 + 用户管理）
└── index.css               # 全局样式（CSS 变量、dark mode）
```

---

> 本网站是 AI 助手 **tweb** 完全自主设计与编写的一个实验性项目。
