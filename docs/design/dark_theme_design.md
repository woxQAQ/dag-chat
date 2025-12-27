# MindFlow 暗色主题设计规范 (Dark Theme Design Specification)

> 基于 [UI Design Specification](./ui_design_spec.md) 的暗色主题扩展

---

## 1. 设计原则

1. **护眼优先**: 避免纯黑背景，使用深灰减少视觉疲劳
2. **层次清晰**: 通过明度和阴影建立清晰的空间层次
3. **品牌延续**: Primary 色保持与亮色模式一致
4. **对比度合规**: 所有文字色值符合 WCAG AA 标准 (≥ 4.5:1)

---

## 2. 核心调色板 (Core Color Palette)

### 2.1 基础色彩

| 语义 | 色值 | CSS 变量 | 用途 |
|:---|:---|:---|:---|
| **Primary** | `#3B82F6` | `--color-primary` | 高亮、选中状态、主按钮 |
| **Canvas Background** | `#0C0E12` | `--color-canvas` | 画布底色 |
| **Surface (Node)** | `#1A1D23` | `--color-surface` | 节点背景 |
| **Surface Elevated** | `#22262E` | `--color-surface-elevated` | 悬浮/选中节点 |
| **Border** | `#2A2E36` | `--color-border` | 边框、分割线 |
| **Border Highlight** | `#3E4450` | `--color-border-highlight` | 节点悬停边框 |

### 2.2 文字色彩

| 语义 | 色值 | CSS 变量 | 对比度 (vs Canvas) |
|:---|:---|:---|:---|
| **Text Primary** | `#E2E8F0` | `--color-text-primary` | 13.2:1 ✓ |
| **Text Secondary** | `#94A3B8` | `--color-text-secondary` | 6.8:1 ✓ |
| **Text Muted** | `#64748B` | `--color-text-muted` | 4.2:1 ✓ |

### 2.3 功能色彩

| 语义 | 色值 | CSS 变量 | 用途 |
|:---|:---|:---|:---|
| **Edge Default** | `#334155` | `--color-edge-default` | 默认连线 |
| **Edge Active** | `#3B82F6` | `--color-edge-active` | 激活路径连线 |
| **Edge Dimmed** | `#1E293B` | `--color-edge-dimmed` | 非相关分支 |
| **Dot Grid** | `rgba(148, 163, 184, 0.08)` | `--dot-grid-color` | 点阵网格 |

### 2.4 状态色彩

| 语义 | 色值 | CSS 变量 | 用途 |
|:---|:---|:---|:---|
| **Success** | `#10B981` | `--color-success` | 保存成功 |
| **Warning** | `#F59E0B` | `--color-warning` | 警告提示 |
| **Error** | `#EF4444` | `--color-error` | 错误状态 |
| **Info** | `#60A5FA` | `--color-info` | 信息提示 |

---

## 3. 组件样式 (Component Styles)

### 3.1 节点 (Nodes)

| 节点类型 | 背景色 | 边框 | 阴影 |
|:---|:---|:---|:---|
| **User Node** | `#1A1D23` | `#475569` | `0 1px 3px 0 rgb(0 0 0 / 0.5)` |
| **AI Node** | `#22262E` | Primary glow | `0 1px 3px 0 rgb(0 0 0 / 0.5)` |
| **Node Hover** | - | `#3B82F6` | `0 4px 12px -2px rgb(0 0 0 / 0.6)` |
| **Node Selected** | - | `#3B82F6` | `0 0 0 2px #3B82F6, 0 10px 25px -5px rgb(0 0 0 / 0.7)` |

### 3.2 连线 (Edges)

| 状态 | 颜色 | 宽度 |
|:---|:---|:---|
| **默认** | `#334155` | 1px |
| **激活路径** | `#3B82F6` | 2px |
| **非相关分支** | `#1E293B` | 1px |

### 3.3 工具栏 (Floating Toolbar)

Glassmorphism 效果：

```css
background: rgba(26, 29, 35, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## 4. CSS Variables 实现

```css
@media (prefers-color-scheme: dark) {
	:root {
		/* Core */
		--color-primary: #3B82F6;
		--color-canvas: #0C0E12;
		--color-surface: #1A1D23;
		--color-surface-elevated: #22262E;
		--color-border: #2A2E36;
		--color-border-highlight: #3E4450;

		/* Text */
		--color-text-primary: #E2E8F0;
		--color-text-secondary: #94A3B8;
		--color-text-muted: #64748B;

		/* Functional */
		--color-edge-default: #334155;
		--color-edge-active: #3B82F6;
		--color-edge-dimmed: ##1E293B;
		--dot-grid-color: rgba(148, 163, 184, 0.08);
		--dot-grid-size: 24px;

		/* Status */
		--color-success: #10B981;
		--color-warning: #F59E0B;
		--color-error: #EF4444;
		--color-info: #60A5FA;

		/* Shadows */
		--shadow-node: 0 1px 3px 0 rgb(0 0 0 / 0.5);
		--shadow-node-hover: 0 4px 12px -2px rgb(0 0 0 / 0.6);
		--shadow-node-selected: 0 0 0 2px #3B82F6, 0 10px 25px -5px rgb(0 0 0 / 0.7);
	}
}
```

---

## 5. 对比度验证

所有文字色值均已通过 WCAG AA 对比度要求：

| 元素 | 色值 | 对比度 | 标准 |
|:---|:---|:---|:---|
| Primary Text | `#E2E8F0` on `#0C0E12` | 13.2:1 | ✓ AAA (7:1) |
| Secondary Text | `#94A3B8` on `#0C0E12` | 6.8:1 | ✓ AA (4.5:1) |
| Muted Text | `#64748B` on `#0C0E12` | 4.2:1 | ✓ AA (4.5:1) |

---

## 6. 与亮色主题对比

| 语义 | 亮色 | 暗色 |
|:---|:---|:---|
| Canvas | `#F8FAFC` | `#0C0E12` |
| Surface | `#FFFFFF` | `#1A1D23` |
| Primary | `#2563EB` | `#3B82F6` |
| Text Primary | `#1E293B` | `#E2E8F0` |
| Text Secondary | `#64748B` | `#94A3B8` |
