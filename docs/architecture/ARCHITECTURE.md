# MindFlow 架构决策文档 (Architecture Design Document)

## 1. 概览与愿景 (Executive Summary)

MindFlow 旨在打造一款**AI 原生的可视化思维空间 (AI-Native Visual Workspace)**。
与传统的 Chatbot 不同，MindFlow 采用**Canvas First** 的交互模式，将“图 (Graph)”作为第一公民，支持非线性的、项目制的深度思考与创作。

本架构设计的核心目标是：
1.  **交互流畅性**: 确保无限画布上的节点拖拽、缩放和实时渲染达到 60fps 流畅度。
2.  **数据一致性**: 在复杂的图编辑（分叉、合并、移动）操作下，保证数据结构的完整性。
3.  **全栈效率**: 利用 Next.js + Supabase 快速构建高性能、可扩展的现代 Web 应用。

---

## 2. 核心架构决策 (Architecture Decision Records - ADRs)

### ADR-001: 采用 Next.js 全栈架构 (Fullstack Next.js)
*   **决策**：使用 Next.js 14+ (App Router) 构建应用。
*   **理由**：
    *   **Server Actions**: 简化前后端数据交互，直接在组件中调用后端逻辑。
    *   **React Server Components (RSC)**: 优化首屏加载性能。
    *   **Unified Type System**: 前后端共享 TypeScript 类型定义。

### ADR-002: 可视化引擎采用 React Flow
*   **决策**：使用 `@xyflow/react` (原 React Flow) 作为核心画布引擎。
*   **理由**：
    *   **React Native**: 专为 React 设计，状态管理直观。
    *   **Customizability**: 极强的节点和连线定制能力，易于实现自定义的 AI 节点 UI。
    *   **Performance**: 处理数百个节点依然保持流畅。

### ADR-003: 后端服务采用 Supabase (BaaS)
*   **决策**：使用 Supabase 替代传统的自建后端 + 数据库。
*   **理由**：
    *   **Auth**: 开箱即用的用户认证系统。
    *   **Database**: 托管的 PostgreSQL，支持 pgvector (为未来 RAG 做准备)。
    *   **Realtime**: 支持多人协作（未来规划）。
    *   **RPC**: 通过 PostgreSQL Functions 处理复杂的图算法（如递归查询路径），性能优于应用层递归。

### ADR-004: 数据结构设计 - 混合邻接表与路径枚举
*   **决策**：使用 `parent_id` 维护基础树结构，配合 Supabase RPC (Recursive CTE) 进行高效查询。
*   **理由**：兼顾写入性能（O(1) 插入）和读取性能（快速重建上下文）。

---

## 3. 系统架构图 (System Architecture)

```mermaid
graph TD
    Client[Client (Browser)]
    Next[Next.js Server (Vercel)]
    DB[(Supabase PostgreSQL)]
    LLM[LLM Provider (OpenAI/Anthropic)]

    subgraph Frontend
        Canvas[Infinite Canvas (React Flow)]
        Panel[Auxiliary Panel (Chat/Details)]
        State[Zustand Store]
    end

    Client -->|User Action| Canvas
    Canvas -->|Update State| State
    State -->|Sync| Next
    
    Next -->|Server Action / API| DB
    Next -->|Stream Response| LLM
    
    DB -->|RPC: get_context_path| Next
```

---

## 4. 数据模型设计 (Data Model)

基于 Supabase PostgreSQL Schema。

### 4.1 Projects (项目)
顶层组织单元，替代传统的 "Session"。
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Nodes (节点)
画布上的基本元素。
```sql
CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES nodes(id), -- Adjacency List
  
  -- Content
  type TEXT NOT NULL, -- 'user' | 'ai' | 'note'
  content TEXT,
  
  -- Canvas Layout
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB -- For extensible attributes (e.g. model config)
);
```

---

## 5. 关键交互流程 (Key Interactions)

### 5.1 节点生长 (Node Growth)
1.  用户在 Canvas 双击 -> 创建 `User Node` (Pending)。
2.  输入 Prompt 并提交。
3.  **Frontend**: 
    *   调用 `createNode` Server Action 写入 DB。
    *   调用 `generateResponse` Server Action。
4.  **Backend**:
    *   调用 Supabase RPC `get_context_path(node_id)` 获取从 Root 到当前节点的完整历史。
    *   组装 Prompt 发送给 LLM。
    *   流式返回结果。
5.  **Frontend**:
    *   创建 `AI Node` 并连接到 `User Node`。
    *   实时将 SSE 数据流渲染到 `AI Node` 内容中。

### 5.2 分支创建 (Branching)
1.  用户从现有的 `AI Node A` 拖拽连线 -> 创建新的 `User Node B`。
2.  系统记录 `B.parent_id = A.id`。
3.  视觉上形成分叉，上下文路径自动变更为 `Root -> ... -> A -> B`。

---

## 6. 技术栈清单 (Tech Stack)

*   **Frontend**: React, Next.js, Tailwind CSS, React Flow (@xyflow/react), Zustand, Lucide React
*   **Backend**: Next.js Server Actions, Vercel AI SDK
*   **Database**: Supabase (PostgreSQL)
*   **Deployment**: Vercel

---

## 7. 演进规划 (Roadmap)

### Phase 1: MVP (Single Player Canvas)
*   核心画布交互（增删改查节点）。
*   基本的流式对话。
*   项目管理。

### Phase 2: Knowledge & RAG
*   支持上传文档作为节点（File Node）。
*   RAG: AI 回答时自动引用相关文档节点。

### Phase 3: Collaboration
*   多人实时协作编辑画布 (Supabase Realtime)。
*   分享项目链接。
