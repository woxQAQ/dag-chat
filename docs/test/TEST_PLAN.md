# MindFlow 测试策略方案 (Test Strategy Plan)

## 1. 测试愿景 (Vision)

MindFlow 的核心复杂度在于**树状对话结构的管理**与**实时流式交互**。传统的线性聊天测试方案不足以覆盖本产品的核心风险。因此，我们的测试策略将重点关注**数据结构的完整性**、**复杂状态的流转**以及**用户体验的稳定性**。

我们遵循 **"Testing Pyramid" (测试金字塔)** 原则：
*   大量的单元测试 (Unit Tests) 覆盖核心算法。
*   适量的集成测试 (Integration Tests) 覆盖数据库与 API 交互。
*   关键路径的端到端测试 (E2E Tests) 覆盖核心用户旅程。

---

## 2. 技术栈选型 (Tech Stack)

鉴于我们采用了 **Next.js Fullstack** 架构，测试工具链将与生态保持高度一致：

| 类型 | 工具 | 理由 |
| :--- | :--- | :--- |
| **Unit / Component** | **Vitest** | 速度极快，原生支持 ESM，与 Vite/Next.js 生态兼容性好，配置简单。 |
| **Component Testing** | **React Testing Library** | 行业标准，关注用户行为而非实现细节，适合测试复杂的交互组件。 |
| **E2E Testing** | **Playwright** | 微软出品，运行稳定，支持多 Tab（模拟多分支并行），调试工具强大，原生支持 TypeScript。 |
| **Mocking** | **MSW (Mock Service Worker)** | 拦截网络请求，模拟 LLM 流式响应，避免 E2E 测试消耗昂贵的 API Token。 |

---

## 3. 测试范围与重点 (Scope & Focus)

### 3.1 单元测试 (Unit Tests) - *Coverage Target: > 80%*

重点覆盖纯函数逻辑，特别是位于 `src/lib/` 下的核心算法：

*   **树操作算法 (Tree Algorithms)**:
    *   `buildTree(nodes)`: 测试从平铺的数据库记录构建树状结构，验证父子关系准确性。
    *   `getPathToRoot(nodeId)`: 测试上下文回溯逻辑，确保路径提取无误。
    *   `pruneBranch(nodeId)`: 测试剪枝逻辑，确保不会误删其他分支。
*   **Prompt 构建器**:
    *   验证将节点路径转换为 LLM 消息数组 (System/User/Assistant) 的格式化逻辑。

### 3.2 集成测试 (Integration Tests) - *Coverage Target: Critical Paths*

重点覆盖 Server Actions 和 API Routes：

*   **数据库事务 (Prisma Transactions)**:
    *   **Fork 操作**: 模拟并发请求，验证在同一父节点下创建新分支时，数据一致性是否得到保障。
    *   **级联删除**: 验证删除中间节点时，子节点的处理逻辑（是级联删除还是重新挂载）。
*   **API 响应**:
    *   验证 Server Actions 的输入验证 (Zod) 和错误处理。

### 3.3 端到端测试 (E2E Tests) - *Scenarios*

覆盖用户核心价值流，确保“主流程不挂”：

1.  **基础对话流**:
    *   新建会话 -> 发送消息 -> 接收流式响应 -> 消息上屏。
2.  **核心分叉流 (The "Forking" Flow)**:
    *   用户悬停历史消息 -> 点击编辑 -> 修改内容提交 -> **验证侧边栏出现新分支** -> **验证主视图切换到新上下文**。
3.  **分支切换与持久化**:
    *   点击侧边栏旧节点 -> 验证主视图回滚 -> 刷新页面 -> 验证状态保持。

---

## 4. 测试数据管理 (Test Data Management)

*   **Unit/Integration**: 使用内存数据库 (In-Memory SQLite) 或 Docker 启动临时的 PostgreSQL 容器，每次测试前重置数据 (Seed/Teardown)。
*   **E2E**: 使用 Playwright 的 `globalSetup` 预置专用的测试账号和基础会话数据。

---

## 5. 持续集成 (CI Pipeline)

在 GitHub Actions 中配置以下流水线：

1.  **Lint & Type Check**: `pnpm biome check` & `tsc --noEmit` (Fail fast)。
2.  **Unit Tests**: `pnpm test:unit` (并行运行)。
3.  **Build**: `pnpm build` (确保构建通过)。
4.  **E2E Tests**: `pnpm test:e2e` (仅在主分支合并或 Release 时运行，或使用 Headless 模式运行核心用例)。

---

## 6. 下一步行动 (Action Plan)

1.  配置 Vitest 环境。
2.  配置 Playwright 环境。
3.  编写核心树算法的第一个单元测试。
