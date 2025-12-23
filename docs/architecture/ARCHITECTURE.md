# MindFlow 架构决策文档 (Architecture Design Document)

## 1. 概览与愿景 (Executive Summary)

MindFlow 旨在打造一款基于“树状思维流”的 AI 交互工具。与传统线性 Chatbot 不同，MindFlow 的核心复杂度在于**多维度的上下文管理**与**非线性的对话拓扑结构**。

本架构设计的核心目标是：
1.  **高响应力**：确保在复杂的树状结构中，上下文切换和 LLM 流式响应依然流畅。
2.  **开发效率 (Velocity)**：利用现代全栈框架 (Next.js) 的能力，统一前后端语言，快速迭代 MVP。
3.  **数据完整性**：保证在高并发的分叉（Fork）操作下，对话树的拓扑结构不被破坏。

---

## 2. 约束分析 (Constraint Analysis)

### 2.1 核心约束
| 维度 | 约束条件 | 类型 | 影响 |
| :--- | :--- | :--- | :--- |
| **技术** | 必须支持 LLM 流式输出 (SSE/WebSocket) | Hard | 后端框架必须支持 Streaming Response。 |
| **数据** | 对话结构为 DAG (有向无环图) 或 Tree | Hard | 关系型数据库需要特殊的表结构设计 (Recursive Queries)。 |
| **体验** | 侧边栏渲染需实时感知拓扑变化 | Hard | API 需要高效返回完整的树结构数据，且前端能快速重绘。 |
| **团队** | 追求全栈开发体验 | Soft | 选择 TypeScript 全栈可减少上下文切换成本。 |

### 2.2 长期可持续性评估
*   **技术成熟度**：Next.js + React 拥有庞大的社区支持和成熟的生态系统，提供了从 UI 组件、路由管理到全栈部署的完整解决方案，是构建此类全栈应用的稳健选择。
*   **依赖风险评估**：使用 Vercel AI SDK 虽然引入了对 Vercel 生态的依赖（Vendor Lock-in），但其优秀的抽象层屏蔽了底层 LLM 差异（支持 OpenAI, Anthropic 等），在开发效率与架构灵活性之间取得了合理的平衡。若未来需要脱离 Vercel 生态，核心业务逻辑可迁移至标准 Fetch/SSE 实现。

---

## 3. 核心架构决策 (Architecture Decision Records - ADRs)

### ADR-001: 采用 Next.js 全栈架构 (Fullstack Next.js)
*   **决策**：使用 Next.js (App Router) 构建单体全栈应用。前端组件与后端逻辑（Server Actions / Route Handlers）共存。
*   **权衡分析**：
    *   **Pros (利)**：
        *   **类型安全**: 端到端 TypeScript，从 DB 到 UI 无缝衔接。
        *   **Server Components**: 直接在组件中读取数据库，大幅减少传统的 "Fetch API" 样板代码。
        *   **部署便捷**: 一键部署至 Vercel 或 Docker 容器。
    *   **Cons (弊)**：
        *   重计算任务（如复杂的 Graph 算法）在 Node.js 中性能可能不如 Go/Rust（但当前场景下足够）。
    *   **缓解**：对于极少数计算密集型任务，未来可拆分微服务。

### ADR-002: 数据结构存储采用“邻接表 (Adjacency List)”
*   **决策**：在 `MessageNode` 模型中使用 `parentId` 字段存储树结构。
*   **实现细节**：利用 PostgreSQL 的 `WITH RECURSIVE` (CTE) 进行查询。虽然 Prisma 原生不支持递归查询，但可以通过 `$queryRaw` 执行原生 SQL 来解决。
*   **权衡分析**：
    *   **Pros**: 插入节点 O(1) 极快（核心需求），数据结构简单直观。
    *   **Cons**: 获取整树或路径需要递归查询。

### ADR-003: 集成 Vercel AI SDK
*   **决策**：使用 Vercel AI SDK (`ai` package) 处理流式响应和对话状态管理。
*   **权衡分析**：
    *   **Pros**: 提供了 `useChat`, `StreamData` 等高级 Hook，极大简化了 SSE (Server-Sent Events) 的处理逻辑。支持 Edge Runtime，延迟极低。
    *   **Cons**: 对 Vercel 生态有一定依赖（虽然也可以自托管）。

---

## 4. 数据模型设计 (Data Model - Prisma Schema Style)

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  conversations Conversation[]
  createdAt     DateTime       @default(now())
}

model Conversation {
  id        String        @id @default(uuid())
  title     String
  userId    String
  user      User          @relation(fields: [userId], references: [id])
  nodes     MessageNode[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

enum Role {
  system
  user
  assistant
}

model MessageNode {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  
  // Adjacency List Pattern
  parentId       String?
  parent         MessageNode? @relation("TreeStructure", fields: [parentId], references: [id])
  children       MessageNode[] @relation("TreeStructure")

  role           Role
  content        String       @db.Text
  
  createdAt      DateTime     @default(now())

  @@index([conversationId])
  @@index([parentId])
}
```

---

## 5. 演进路径规划 (Evolution Path)

### Phase 1: MVP (当前)
*   **技术栈**: Next.js 14+ (App Router), PostgreSQL (Supabase/Neon), Prisma, Tailwind CSS.
*   **目标**: 跑通核心的 Tree Chat 交互，验证产品价值。

### Phase 2: 增强 (3-6 个月)
*   **RAG 集成**: 使用 LangChain.js + pgvector 实现文档问答。
*   **协作功能**: 利用 Next.js 的 SSR 优势，实现生成静态分享页 (OG Image)。

### Phase 3: 规模化 (12+ 个月)
*   **性能优化**: 引入 Redis 缓存热点会话树。
*   **多模型路由**: 根据任务复杂度自动路由到不同成本的模型 (GPT-4 vs Haiku)。

---

## 6. 风险管理 (Risk Management)

| 风险点 | 可能性 | 影响 | 缓解策略 |
| :--- | :--- | :--- | :--- |
| **Vercel AI SDK 限制** | 低 | 中 | 该 SDK 开源且抽象层设计良好，若遇瓶颈可退回至标准 Fetch/SSE 实现。 |
| **Prisma 性能问题** | 中 | 中 | 在复杂递归查询场景下，绕过 Prisma 直接使用 SQL (`$queryRaw`)；或迁移至 Kysely 等更轻量的 Query Builder。 |
| **Serverless 冷启动** | 中 | 低 | 既然是生产力工具，用户容忍度稍高；或使用 Edge Functions 减少冷启动时间。 |
