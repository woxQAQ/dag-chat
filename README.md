# MindFlow - Structured Chatbot

MindFlow 是一个探索**结构化思维流**的 AI 聊天机器人。旨在通过**树状可视化交互**，解决传统线性对话在复杂任务（如代码调试、创意构思）中的上下文迷失问题。

MindFlow 采用无限画布（Infinite Canvas）展示对话节点，支持非线性编辑、分支创建和上下文路径高亮，帮助用户更好地管理和回顾思维过程。

## ✨ 核心特性 (Features)

*   **Tree over Stream**: 可视化的树状对话结构，直观展示思维分支。
*   **Non-destructive Editing**: 修改提问不覆盖历史，自动创建新分支（Fork）。
*   **Context-Aware**: 智能路径高亮，清晰展示当前对话的上下文路径。
*   **Infinite Canvas**: 基于 React Flow 的流畅画布体验。
*   **Modern Stack**: 基于 Next.js 16, React 19, Tailwind CSS 4 构建。

## 🛠️ 技术栈 (Tech Stack)

*   **Framework**: Next.js 16 (App Router)
*   **UI**: React 19, Tailwind CSS 4, React Flow (@xyflow/react)
*   **Database**: PostgreSQL, Prisma ORM
*   **Testing**: Vitest, React Testing Library
*   **Tooling**: Biome (Linting/Formatting), pnpm

## 📂 项目结构 (Project Structure)

```text
.
├── src/
│   ├── app/               # Next.js App Router 页面与 API
│   ├── components/        # React 组件 (Canvas, Dashboard, Nodes 等)
│   ├── hooks/             # 自定义 React Hooks
│   ├── lib/               # 核心逻辑 (布局算法, 路径计算等)
│   └── contexts/          # React Contexts
├── prisma/                # 数据库 Schema 与迁移
├── docs/                  # 产品文档
│   ├── architecture/      # 架构文档
│   └── design/            # 设计文档 (PRD, UI Spec)
│       └── prototype/     # 早期 HTML 原型
└── public/                # 静态资源
```

## 🚀 快速开始 (Getting Started)

### 前置要求

*   Node.js 20+
*   pnpm
*   Docker (用于运行 PostgreSQL)

### 安装与运行

1.  **启动数据库**
    ```bash
    docker-compose up -d
    ```

2.  **安装依赖**
    ```bash
    pnpm install
    ```

3.  **初始化数据库**
    ```bash
    npx prisma migrate dev
    ```

4.  **启动开发服务器**
    ```bash
    pnpm dev
    ```

    访问 [http://localhost:3000](http://localhost:3000) 体验 MindFlow。

### 运行测试

```bash
# 设置测试数据库
pnpm test:setup

# 运行所有测试
pnpm test

# 监视模式
pnpm test:watch
```
