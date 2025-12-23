# UI/UX 设计规范 (UI Design Spec) - MindFlow

本文档基于 `prototype/index.html` 的实现，定义 MindFlow 的视觉风格与交互规范。

## 1. 色彩系统 (Color System)

采用深色侧边栏 + 浅色内容区的经典 IDE 配色，强调内容的沉浸感与结构的清晰度。

### 1.1 主题色
*   **Primary Blue**: `#3b82f6` (Tailwind blue-500) - 用于高亮路径、激活节点、主按钮。
*   **Background Sidebar**: `#1e1e1e` (VS Code Dark) - 侧边栏背景，提供视觉锚点。
*   **Background Main**: `#ffffff` - 主对话区背景，保持阅读舒适度。

### 1.2 状态色
*   **Node Active**: `#3b82f6` (Blue) - 当前选中的节点。
*   **Node Inactive**: `#555555` (Dark Grey) - 未选中的、其他分支的节点。
*   **Line Active**: `#3b82f6` - 连接激活路径的实线。
*   **Line Inactive**: `#444444` - 连接非激活分支的线条。

## 2. 组件规范 (Component Specs)

### 2.1 侧边栏导航 (Sidebar Navigation)
*   **Header Area**: 高度 48px，底部边框 `1px solid #333`。
    *   **Back Button**: 图标 `<`，左侧 Padding 16px。
    *   **Title**: 居中或左对齐，截断显示会话名。
*   **Session List Item**:
    *   高度：60px。
    *   内容：标题（主）、时间（副）、摘要（副）。
    *   Hover: 背景色 `#2d2d2d`。

### 2.2 侧边栏节点 (Sidebar Node)
*   **容器**：Flex 布局，高度 24px，垂直居中。
*   **圆点 (Dot)**：
    *   尺寸：12px * 12px。
    *   边框：2px solid `#1e1e1e` (用于在视觉上切割线条)。
    *   圆角：50%。
*   **标签 (Label)**：
    *   仅 User 节点显示。
    *   背景：`#2d2d2d` (默认), `#3b82f6` (激活)。
    *   圆角：4px。
    *   Padding：4px 8px。
    *   字体大小：12px。
    *   截断：最大宽度 180px，超出显示省略号 (...)。

### 2.2 连接线 (Connections)
*   **类型**：贝塞尔曲线 (Bezier Curve)。
*   **路径算法**：`M startX startY C controlX1 controlY1, controlX2 controlY2, endX endY`。
    *   使用 CSS `transition: stroke 0.3s` 实现平滑的路径颜色切换动画。

### 2.3 消息气泡 (Chat Bubble)
*   **User Message**:
    *   背景：`#f3f4f6` (Light Grey)。
    *   对齐：右对齐。
    *   圆角：12px，右下角 2px。
*   **AI Message**:
    *   背景：`#ffffff`。
    *   边框：1px solid `#e5e7eb`。
    *   对齐：左对齐。
    *   圆角：12px，左下角 2px。
*   **操作栏**：
    *   Hover 消息时显示 `[Edit]` 按钮。
    *   点击 Edit 触发分叉逻辑。

## 3. 布局与响应式 (Layout & Responsive)

### 3.1 桌面端 (Desktop)
*   **Sidebar**: 固定宽度 300px，高度 100vh，内部 `overflow-y: auto`。
*   **Main Area**: `flex: 1`，自适应宽度。
*   **Input Area**: 固定在底部，最大宽度 800px，居中。

### 3.2 移动端 (Mobile) - *待实现*
*   Sidebar 默认隐藏。
*   Header 增加 `[Menu]` 按钮，点击滑出 Sidebar (Drawer 模式)。

## 4. 动画规范 (Animation)
*   **路径切换**：0.3s Ease-in-out。当用户切换分支时，线条颜色和节点状态应平滑过渡。
*   **消息加载**：Fade In + Slide Up (0.3s)。

