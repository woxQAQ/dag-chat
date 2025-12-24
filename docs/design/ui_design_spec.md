# MindFlow UI 设计规范 (UI Design Specification)

> 基于 [Product Requirements Document](./product_requirements_document.md) v1.0

## 1. 设计哲学 (Design Philosophy)

*   **Canvas First (画布优先)**: 所有的 UI 元素都应为内容（节点）让路。界面应尽可能的极简、通透，消除边框感。
*   **Spatial Context (空间语境)**: 利用位置、连线和分组来表达逻辑，而非传统的文件夹或列表。
*   **Fluidity (流畅性)**: 从输入到生成，从概览到细节，交互应当是无缝的流体，避免模态弹窗打断思维。

---

## 2. 界面层级与结构 (Information Architecture)

应用主要分为两个核心视图：
1.  **Dashboard (项目仪表盘)**: 项目入口与管理。
2.  **Workspace (沉浸式画布)**: 核心工作区。

---

## 3. 详细设计方案

### 3.1 项目仪表盘 (Dashboard)

**布局**: 网格视图 (Grid View)
**视觉风格**: 干净、留白充足。

*   **顶部栏 (Top Bar)**:
    *   左侧: MindFlow Logo。
    *   中间: 搜索框 (Search Projects)。
    *   右侧: 用户头像/设置。
*   **内容区 (Content Area)**:
    *   **"New Project" Card**: 位于首位，虚线边框，中心为一个巨大的 "+" 号。悬停时有微动效。
    *   **Project Card**:
        *   预览图: 显示该项目画布的缩略图 (Mini-map snapshot)。
        *   标题: 项目名称 (支持重命名)。
        *   元数据: 最后编辑时间、节点数量。
        *   操作: 右上角 "..." 菜单 (删除、复制、导出)。

### 3.2 工作区 (Workspace) - 核心界面

**布局**: 全屏画布 + 悬浮/收折面板。

#### A. 画布层 (The Canvas)
*   **背景**: 极淡的网格点阵 (Dot Grid) 或无限网格，用于辅助对齐，但不抢眼。
*   **导航控制**:
    *   支持 鼠标滚轮缩放 (Zoom)。
    *   支持 空格+拖拽 或 中键平移 (Pan)。
    *   **Mini-map (可选)**: 右下角半透明缩略图，指示当前视口位置。

#### B. 顶部导航栏 (Top Header) - 极简
*   高度: 48px - 60px。
*   左侧: `< 返回` 按钮 (回Dashboard) / 面包屑 `Dashboard / Project Name`。
*   右侧: `Share` (分享), `Export` (导出), `Settings` (设置)。
*   **状态栏**: 顶部中央隐式显示 "Saving..." / "Saved"。

#### C. 底部工具栏 (Floating Toolbar) - 交互核心
*   位置: 屏幕底部居中，悬浮胶囊样式 (Glassmorphism 效果)。
*   功能按钮:
    *   Select (选择模式 - 默认)
    *   Hand (漫游模式)
    *   **Add Node (+)**: 主要行动点 (快捷键 `N` 或双击画布)。
    *   Connect (连线工具 - 快捷键 `L`)。
    *   Layout (自动整理布局)。

#### D. 右侧属性面板 (Inspector / Context Panel)
*   **默认状态**: 收起或显示项目概览（Project Description）。
*   **选中节点状态**: 展开面板。
    *   **Tab 1: Thread (线性流)**: 
        *   这是 PRD 4.1 提到的核心。显示从 Root 节点到当前选中节点的**线性对话历史**。
        *   交互形式类似 ChatGPT/Claude 的传统界面。
        *   允许在这里进行基于当前上下文的快速追问（追问结果会在画布上生成新的子节点）。
    *   **Tab 2: Node Properties (属性)**:
        *   显示节点元数据 (创建时间, Token数, 模型参数)。
        *   颜色标签/样式设置。

---

## 4. 组件设计 (Component Design)

### 4.1 节点 (Nodes)
节点是画布上的原子单位。

*   **形状**: 圆角矩形 (border-radius: 12px)。
*   **最大宽度**: 400px - 600px (根据内容自适应，但有上限，长文自动折叠或滚动)。
*   **视觉区分**:
    *   **User Node (用户)**:
        *   背景色: 浅灰色 / 透明 + 边框。
        *   字体: 无衬线字体 (Sans-serif)。
        *   视觉重心: 弱于 AI 节点。
    *   **AI Node (模型)**:
        *   背景色: 白色 (Light Mode) / 深灰 (Dark Mode) + 轻微阴影 (Elevation)。
        *   边框: 激活状态下有高亮色 (Primary Color)。
        *   内容: 支持 Markdown 渲染 (代码高亮、列表、表格)。
*   **节点交互**:
    *   **Hover**: 显示连接锚点 (四个方向)。
    *   **Selected**: 边框高亮，右侧面板展开。
    *   **Double Click**: 进入编辑模式 (User Node) 或 重新生成 (AI Node)。
    *   **Action Bar**: 选中节点上方悬浮小工具条 (新建子节点、删除、复制)。

### 4.2 连线 (Edges)
*   **样式**: 贝塞尔曲线 (Bézier Curves)，平滑过渡，而非直线。
*   **颜色**:
    *   默认: 浅灰色。
    *   高亮 (Path Context): 当选中某节点时，从 Root 到该节点的路径连线变粗/变色 (Primary Color)，直观展示上下文流。
*   **箭头**: 指向子节点，表示信息流向。

---

## 5. 交互流程 (Interaction Flows)

### 场景一：开始新思维 (Starting)
1.  用户进入画布。
2.  双击空白处 -> 出现一个空的 User Node，光标自动聚焦。
3.  输入 Prompt，按 `Cmd+Enter`。
4.  User Node 固化。
5.  下方自动生长出 AI Node，显示 loading 动画，随后流式输出文字。

### 场景二：分支探索 (Branching)
1.  用户对 AI 的回答（Node A）有了两个不同的想法。
2.  想法 1：点击 Node A 边框的 "+" 号（或拖拽连线） -> 生成 User Node B1。
3.  想法 2：再次从 Node A 拖拽/点击 -> 生成 User Node B2。
4.  画布上呈现 "一分二" 的树状结构。
5.  用户可以分别与 B1 和 B2 产生的后续 AI 节点进行对话，互不干扰。

### 场景三：查看上下文 (Tracing)
1.  画布很复杂，用户点击了深层的一个节点 Node Z。
2.  **视觉反馈**: 从 Root -> ... -> Node Z 的连线高亮。其他无关分支变暗 (Dimmed)。
3.  **右侧面板**: 自动加载这一条高亮路径的纯文本对话记录，方便用户阅读完整的逻辑链。

---

## 6. 视觉风格指南 (Visual Style Guide - Draft)

*   **Color Palette**:
    *   **Primary**: #2563EB (Royal Blue) - 用于高亮、主按钮、选中状态。
    *   **Canvas Background**: #F8FAFC (Slate 50) - 极淡的灰白，护眼。
    *   **Surface (Node)**: #FFFFFF (White) + Shadow.
    *   **Text Main**: #1E293B (Slate 800).
    *   **Text Secondary**: #64748B (Slate 500).
*   **Typography**:
    *   UI: Inter / San Francisco / system-ui.
    *   Code: JetBrains Mono / Fira Code.
*   **Shadows**:
    *   Node Default: `0 1px 3px 0 rgb(0 0 0 / 0.1)`
    *   Node Hover: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
    *   Node Selected: `0 0 0 2px #2563EB, 0 10px 15px -3px rgb(0 0 0 / 0.1)`
