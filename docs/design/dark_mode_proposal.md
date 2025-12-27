# 暗色主题设计提案 (Dark Mode Design Proposal)

## 1. 设计理念 (Design Philosophy)

本提案旨在为 DAG Chat 产品引入暗色主题，以满足开发者和高频用户在低光环境下的使用需求。设计核心遵循以下原则：

*   **沉浸感 (Immersion):** 通过降低背景亮度，减少视觉干扰，让用户更专注于画布上的节点内容与逻辑连接。
*   **层次感 (Elevation):** 不使用纯黑 (#000000)，而是利用不同明度的深灰色阶来表达层级关系。层级越高（越靠近用户），颜色越亮。
*   **舒适性 (Comfort):** 降低对比度刺激，文本使用灰白色而非纯白，避免"光晕效应" (Halation)，减轻长时间使用的眼部疲劳。
*   **一致性 (Consistency):** 保持与现有亮色主题一致的品牌色（蓝色）和圆角/间距规范，但对色彩进行语义化映射。

## 2. 核心色彩系统 (Color System)

基于现有的 `Slate` 色系进行反转与调整，构建暗色板。

### 2.1 背景层级 (Surfaces)

| 语义 (Semantics) | 亮色 (Light Mode) | 暗色 (Dark Mode) | 说明 (Notes) |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `Slate-50` (#F8FAFC) | **`Slate-950` (#020617)** | 画布底色，最深层 |
| **Node Surface (AI)** | `White` (#FFFFFF) | **`Slate-900` (#0F172A)** | AI 节点背景，略高于画布 |
| **Node Surface (User)** | `Slate-100` (#F1F5F9) | **`Slate-800` (#1E293B)** | 用户节点背景，区分于 AI |
| **Elevated Surface** | `White` + Shadow | **`Slate-800` (#1E293B)** | 浮动工具栏、右键菜单、模态框 |
| **Input Background** | `White` | **`Slate-950` (#020617)** | 输入框内部，深陷感 |

### 2.2 边框与分割线 (Borders)

| 语义 (Semantics) | 亮色 (Light Mode) | 暗色 (Dark Mode) | 说明 (Notes) |
| :--- | :--- | :--- | :--- |
| **Subtle Border** | `Slate-200` | **`Slate-800`** | 节点默认边框 |
| **Strong Border** | `Slate-300` | **`Slate-700`** | 悬停或强调时的边框 |
| **Grid Pattern** | `Slate-300` (Opacity 40%) | **`Slate-700` (Opacity 20%)** | 画布背景点阵 |

### 2.3 文字与图标 (Typography & Icons)

| 语义 (Semantics) | 亮色 (Light Mode) | 暗色 (Dark Mode) | 说明 (Notes) |
| :--- | :--- | :--- | :--- |
| **Primary Text** | `Slate-900` | **`Slate-100` (#F1F5F9)** | 主要内容、标题 (避免纯白) |
| **Secondary Text** | `Slate-600` | **`Slate-400` (#94A3B8)** | 辅助说明、元数据、图标 |
| **Disabled/Muted** | `Slate-400` | **`Slate-600` (#475569)** | 不可用状态 |

### 2.4 品牌与交互色 (Accents)

| 语义 (Semantics) | 亮色 (Light Mode) | 暗色 (Dark Mode) | 说明 (Notes) |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `Blue-600` | **`Blue-500`** | 稍微提亮以适应深色背景 |
| **Focus Ring** | `Blue-500` (Ring) | **`Blue-400` (Ring)** | 选中状态的光圈 |
| **Hover State** | `Slate-100` | **`Slate-800`** | 按钮悬停背景 |

## 3. 关键组件设计规范 (Component Specifications)

### 3.1 无限画布 (Infinite Canvas)
*   **背景:** `Slate-950`。
*   **点阵/网格:** 使用 `Slate-700` 或 `Slate-600`，透明度降低至 15%-20%，确保在深色背景上可见但不过分抢眼。

### 3.2 节点设计 (Nodes)

**AI 节点 (AI Node):**
*   背景: `Slate-900`
*   边框: `1px solid Slate-800`
*   阴影: `shadow-lg shadow-black/40` (深色模式下阴影需要更深、更扩散才能被感知)
*   Markdown 内容:
    *   正文: `Slate-200`
    *   代码块背景: `Slate-950` (比节点更深)
    *   代码块文字: 适配 Shiki 的深色主题 (如 GitHub Dark 或 One Dark Pro)

**用户节点 (User Node):**
*   背景: `Slate-800` (比 AI 节点稍亮，或稍显不同的色相，以此区分角色)
*   边框: `1px solid Slate-700`
*   输入文字: `Slate-100`

### 3.3 浮动工具栏与面板 (Floating UI)
*   **Top Header / Toolbar:**
    *   背景: `Slate-900/80` (带 `backdrop-blur` 模糊效果)。
    *   边框: `Slate-700/50`。
    *   按钮: 默认透明，悬停时 `bg-Slate-800`，图标 `text-Slate-200`。
*   **Inspector Panel (侧边栏):**
    *   背景: `Slate-900`。
    *   分割线: `Slate-800`。

## 4. 交互反馈 (Interaction States)

*   **Hover (悬停):** 亮度提升 5-10%。例如，按钮背景从 `Transparent` 变为 `Slate-800`。
*   **Active/Selected (选中):** 保持蓝色高亮逻辑，但蓝色色值调整为 `Blue-500` 或 `Blue-400`，确保在深灰色背景上有足够的对比度 (WCAG AA 标准)。

## 5. 后续建议 (Next Steps)

1.  **Tailwind 配置:** 在 `tailwind.config.ts` 中扩展颜色语义别名 (Semantic Colors)，例如定义 `bg-canvas` 在亮色下映射为 `slate-50`，暗色下映射为 `slate-950`。
2.  **代码高亮:** 引入适合暗色模式的代码高亮主题。
3.  **图标适配:** 检查所有 SVG 图标，确保没有硬编码的颜色值 (使用 `currentColor`)。
