# MindFlow 暗色主题设计规范 (Dark Theme Design)

> 基于 [UI Design Specification](./ui_design_spec.md) v1.0
> 设计理念：Canvas First, Spatial Context, Fluidity

## 1. 设计原则 (Design Principles)

### 1.1 视觉舒适度
- **对比度管理**: 确保文本与背景符合 WCAG AAA 标准（7:1 对比度）
- **减少眼疲劳**: 避免纯黑 (#000000)，使用深灰色以减少 OLED 屏幕上的视觉疲劳和拖影
- **层次清晰**: 使用透明度和阴影来构建深度，而非仅依赖颜色变化

#### 对比度验证 (Contrast Ratio Verification)

关键颜色对的对比度验证：

| 颜色对 | 前景色 | 背景色 | 对比度 | WCAG 等级 |
|:---|:---|:---|:---|:---|
| Primary Text | #F1F5F9 (Slate 100) | #1E293B (Slate 800) | ~12.1:1 | AAA ✓ |
| Secondary Text | #94A3B8 (Slate 400) | #1E293B (Slate 800) | ~4.5:1 | AA |
| Link | #60A5FA (Blue 400) | #0F172A (Slate 900) | ~4.8:1 | AA |
| Border Subtle | #334155 (Slate 700) | #0F172A (Slate 900) | ~1.9:1 | 装饰性 |

**设计权衡**: 次要文本 (#94A3B8 on #1E293B) 符合 WCAG AA 标准 (4.5:1)，但未达到 AAA (7:1)。这是为了保持视觉层次而做的有意权衡。如需 AAA 合规，可将次要文本改为 #CBD5E1 (Slate 300)，但会减弱主次文本的视觉区分度。

### 1.2 保持产品一致性
- **主色调不变**: Primary Color (#3B82F6) 在暗色模式下保持不变，确保品牌识别度
- **Canvas First 优先**: 画布背景应"退后"，让节点内容成为视觉焦点
- **空间语境保持**: 高亮路径和置灰分支的效果在暗色下应更加明显

### 1.3 专业工具感
- **IDE 风格**: 参考 VS Code、Figma 等专业工具的暗色主题
- **沉浸体验**: 适合长时间使用的低饱和度配色

---

## 2. 完整色彩系统 (Color System)

### 2.1 基础色彩板

| 用途 | 亮色模式 (当前) | 暗色模式 (提案) | 设计理由 |
|:---|:---|:---|:---|
| **Canvas Background** | #F8FAFC (Slate 50) | **#0F172A** (Slate 900) | 深蓝灰色，比纯黑更柔和，适合长时间观看 |
| **Primary** | #2563EB (Royal Blue) | **#3B82F6** (Blue 500) | 保持主色，略提亮以增强在深色背景上的可见性 |
| **Accent** | #3B82F6 (Blue 500) | **#60A5FA** (Blue 400) | 辅助高亮色，用于 hover 状态 |
| **Border Subtle** | #E2E8F0 (Slate 200) | **#334155** (Slate 700) | 边框和分隔线 |
| **Border Active** | #CBD5E1 (Slate 300) | **#475569** (Slate 600) | 激活状态边框 |

### 2.2 节点组件色彩

#### User Node (用户节点)
| 属性 | 亮色模式 | 暗色模式 | 设计理由 |
|:---|:---|:---|:---|
| **Background** | #F1F5F9 (Slate 100) | **#1E293B** (Slate 800) | 略深于画布，保持层次 |
| **Border (Default)** | #E2E8F0 (Slate 200) | **#334155** (Slate 700) | 默认边框 |
| **Border (Selected)** | #2563EB (Primary) | **#3B82F6** (Primary) | 选中高亮 |
| **Text** | #1E293B (Slate 800) | **#F1F5F9** (Slate 100) | 主文本 |
| **Text Secondary** | #64748B (Slate 500) | **#94A3B8** (Slate 400) | 次要文本 |
| **Icon Background** | #CBD5E1 (Slate 300) | **#475569** (Slate 600) | 图标容器背景 |
| **Icon Color** | #475569 (Slate 600) | **#E2E8F0** (Slate 200) | 图标颜色 |

#### AI Node (AI 节点)
| 属性 | 亮色模式 | 暗色模式 | 设计理由 |
|:---|:---|:---|:---|
| **Background** | #FFFFFF (White) | **#1E293B** (Slate 800) | 与 UserNode 相同，突出内容差异而非背景 |
| **Border (Default)** | #E2E8F0 (Slate 200) | **#334155** (Slate 700) | 默认边框 |
| **Border (Selected)** | #2563EB (Primary) | **#3B82F6** (Primary) | 选中高亮 |
| **Text** | #1E293B (Slate 800) | **#F1F5F9** (Slate 100) | 主文本 |
| **Code Background** | #F8FAFC (Slate 50) | **#0F172A** (Slate 900) | 代码块背景 |
| **Icon Background** | #DBEAFE (Blue 100) | **#1E3A8A** (Blue 900) | AI 图标背景（蓝色系） |
| **Icon Color** | #2563EB (Blue 600) | **#60A5FA** (Blue 400) | AI 图标颜色 |

### 2.3 阴影系统 (Shadows)

暗色模式下的阴影使用 **光晕 (Glow)** 效果而非传统阴影：

| 状态 | 亮色模式 | 暗色模式 |
|:---|:---|:---|
| **Default** | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | `0 1px 3px 0 rgb(0 0 0 / 0.5)` |
| **Hover** | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | `0 4px 12px 0 rgb(0 0 0 / 0.6)` |
| **Selected** | `0 0 0 2px #2563EB, 0 10px 15px -3px rgb(0 0 0 / 0.1)` | `0 0 0 2px #3B82F6, 0 0 20px 0 rgb(59 130 246 / 0.3)` |

---

## 3. 界面层级 (Interface Layers)

### 3.1 画布 (Canvas)

```css
/* Canvas Background */
background: #0F172A;

/* Dot Pattern */
radial-gradient(#334155 1px, transparent 1px);
opacity: 0.4;
```

**设计理由**:
- 深蓝灰色 (#0F172A) 比纯黑更柔和
- 点阵使用 Slate 700 (#334155)，低透明度确保不抢占内容注意力

### 3.2 顶部导航 (Top Header)

| 元素 | 暗色模式 |
|:---|:---|
| **Background** | `rgba(15, 23, 42, 0.8)` (Slate 900 + blur) |
| **Border** | `#334155` (Slate 700) |
| **Text** | `#F1F5F9` (Slate 100) |
| **Text Muted** | `#94A3B8` (Slate 400) |

**效果**: Glassmorphism (毛玻璃) 效果，使用 `backdrop-filter: blur(8px)`

### 3.3 右侧面板 (Inspector Panel)

| 元素 | 暗色模式 |
|:---|:---|
| **Background** | `#1E293B` (Slate 800) |
| **Border** | `#334155` (Slate 700) |
| **Header Background** | `#1E293B` (Slate 800) |
| **Header Border** | `#334155` (Slate 700) |

### 3.4 底部工具栏 (Floating Toolbar)

| 元素 | 暗色模式 |
|:---|:---|
| **Background** | `rgba(30, 41, 59, 0.9)` (Slate 800) |
| **Border** | `#334155` (Slate 700) |
| **Shadow** | `0 4px 20px 0 rgb(0 0 0 / 0.6)` |

---

## 4. 交互状态 (Interactive States)

### 4.1 连线 (Edges)

| 状态 | 亮色模式 | 暗色模式 |
|:---|:---|:---|
| **Default** | #CBD5E1 (Slate 300) | **#475569** (Slate 600) |
| **Active (Path)** | #2563EB (Primary) | **#3B82F6** (Primary) |
| **Dimmed** | opacity: 0.3 | **opacity: 0.2** |
| **Width (Default)** | 2px | 2px |
| **Width (Active)** | 3px | 3px |

### 4.2 节点交互

#### Hover 状态
- **边框**: #475569 → #3B82F6
- **阴影**: 增强光晕效果
- **Action Bar**: 背景从 `#1E293B` 变为 `#0F172A`

#### Selected 状态
- **边框**: 2px Primary + 外发光
- **阴影**: `0 0 20px 0 rgb(59 130 246 / 0.3)`

---

## 5. 组件特定调整

### 5.1 输入组件

#### Textarea / Input
| 属性 | 暗色模式 |
|:---|:---|
| **Background** | `#0F172A` (Slate 900) |
| **Border** | `#334155` (Slate 700) |
| **Border Focus** | `#3B82F6` (Primary) |
| **Text** | `#F1F5F9` (Slate 100) |
| **Placeholder** | `#64748B` (Slate 500) |

#### Button (Primary)
| 属性 | 暗色模式 |
|:---|:---|
| **Background** | `#3B82F6` (Blue 500) |
| **Background Hover** | `#2563EB` (Blue 600) |
| **Text** | `#FFFFFF` |

#### Button (Secondary)
| 属性 | 暗色模式 |
|:---|:---|
| **Background** | `#334155` (Slate 700) |
| **Background Hover** | `#475569` (Slate 600) |
| **Text** | `#F1F5F9` (Slate 100) |

### 5.2 Markdown 渲染

#### 代码块 (Code Blocks)
使用 Shiki 的暗色主题：
- **推荐主题**:
  - `catppuccin-mocha` (与现有 `catppuccin-latte` 配对，保持一致性)
  - `github-dark` 或 `dracula` (备选方案)
- **背景**: `#0F172A` (Slate 900)
- **边框**: `#334155` (Slate 700)

**实现注意**: 当前 `src/lib/shiki-singleton.ts:50` 使用 `catppuccin-latte`（亮色主题）。需要在 Shiki 配置中同时加载两个主题，并根据当前主题动态选择：

```ts
// 伪代码示例
const theme = resolvedTheme === "dark" ? "catppuccin-mocha" : "catppuccin-latte";
```

#### 文本样式
| 元素 | 暗色模式 |
|:---|:---|
| **Headings** | `#F1F5F9` (Slate 100) |
| **Body** | `#CBD5E1` (Slate 300) |
| **Link** | `#60A5FA` (Blue 400) |
| **Link Hover** | `#93C5FD` (Blue 300) |
| **Blockquote Border** | `#475569` (Slate 600) |
| **Blockquote Text** | `#94A3B8` (Slate 400) |
| **List Bullet** | `#64748B` (Slate 500) |

---

## 6. Dashboard 特定调整

### 6.1 项目卡片 (Project Cards)

| 属性 | 暗色模式 |
|:---|:---|
| **Background** | `#1E293B` (Slate 800) |
| **Border** | `#334155` (Slate 700) |
| **Hover Border** | `#475569` (Slate 600) |
| **Shadow Default** | `0 1px 3px 0 rgb(0 0 0 / 0.5)` |
| **Shadow Hover** | `0 4px 12px 0 rgb(0 0 0 / 0.6)` |

### 6.2 创建新项目卡片

| 属性 | 暗色模式 |
|:---|:---|
| **Background** | `transparent` |
| **Border** | `3px dashed #475569` (Slate 600) |
| **Border Hover** | `3px dashed #3B82F6` (Primary) |
| **Plus Icon** | `#94A3B8` (Slate 400) |

---

## 7. 实现方案 (Implementation Strategy)

### 7.1 CSS 变量方案

#### 现有 globals.css 状态

当前 `app/globals.css` 使用以下变量：

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

这与本文档提出的 Slate 基础色彩系统存在冲突。

#### 迁移路径

**阶段 1: 添加新变量，保留旧变量** (非破坏性)

```css
:root {
  /* 保留现有变量 (向后兼容) */
  --background: #ffffff;
  --foreground: #171717;

  /* 新增语义化变量 */
  --canvas-bg: #F8FAFC;
  --primary: #2563EB;
  --primary-hover: #1D4ED8;
  --node-user-bg: #F1F5F9;
  --node-ai-bg: #FFFFFF;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --border-subtle: #E2E8F0;
  --border-active: #CBD5E1;
}

:root[data-theme="dark"] {
  /* 保留现有变量 (向后兼容) */
  --background: #0F172A;  /* 更新为 Slate 900 */
  --foreground: #F1F5F9;

  /* 新增语义化变量 */
  --canvas-bg: #0F172A;
  --primary: #3B82F6;
  --primary-hover: #2563EB;
  --node-user-bg: #1E293B;
  --node-ai-bg: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border-subtle: #334155;
  --border-active: #475569;
}

/* Fallback for system preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --background: #0F172A;
    --foreground: #F1F5F9;
    --canvas-bg: #0F172A;
    --primary: #3B82F6;
    /* ... 其他暗色变量 */
  }
}
```

**阶段 2: 逐步迁移组件**

- 新组件使用新的语义化变量
- 旧组件在重构时迁移到新变量

**阶段 3: 清理旧变量** (可选)

当所有组件迁移完成后，可以移除 `--background` 和 `--foreground`。

### 7.2 Tailwind CSS 自定义

在 Tailwind 配置中使用 CSS 变量：

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas-bg)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'node-user': 'var(--node-user-bg)',
        'node-ai': 'var(--node-ai-bg)',
      },
    },
  },
};
```

### 7.3 避免硬编码颜色 (Avoid Hardcoded Colors)

#### 问题识别

当前代码库中存在硬编码的亮色模式 Tailwind 类，无法适配暗色主题：

- `src/components/markdown/MarkdownRenderer.tsx:64` - Copy button 使用 `bg-slate-700 hover:bg-slate-600`
- `src/components/markdown/MarkdownRenderer.tsx:118-178` - 文本颜色硬编码 (`text-slate-800`, `text-slate-900`, `text-blue-600`)

#### 解决方案

**方案 A: 使用 Tailwind `dark:` 前缀** (推荐用于简单场景)

```tsx
// Before (硬编码)
<div className="bg-slate-100 text-slate-800 border-slate-200">

// After (支持暗色)
<div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700">
```

**方案 B: 使用语义化 CSS 变量** (推荐用于可复用组件)

```tsx
// 定义语义化变量
--text-primary: #1E293B;
--text-primary-dark: #F1F5F9;

// 组件中使用
<div className="bg-[var(--node-user-bg)] text-[var(--text-primary)]">
```

**方案 C: 创建自定义 Tailwind 类**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-primary-dark': 'var(--text-primary-dark)',
      },
    },
  },
};
```

#### 迁移优先级

1. **高优先级**: 用户可见的文本和背景颜色
2. **中优先级**: 边框、分隔线、图标颜色
3. **低优先级**: 装饰性元素、内部状态

### 7.4 主题切换组件

```tsx
// components/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        setResolvedTheme(systemTheme);
        root.setAttribute("data-theme", systemTheme);
      } else {
        setResolvedTheme(theme);
        root.setAttribute("data-theme", theme);
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

---

## 8. 过渡动画 (Transitions)

### 推荐方案

使用 CSS transition 实现平滑的主题切换，但需要避免性能问题：

```css
/* 方案 1: 仅在根元素上应用过渡 */
:root {
  transition: background-color 200ms cubic-bezier(0.4, 0, 0.2, 1),
              color 200ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* 方案 2: 针对特定元素应用过渡 */
.theme-transition {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

### 性能注意事项

**避免在 `*` 通配符上应用过渡**，原因：

1. **性能开销**: 每个元素都会监听过渡，包括不可见元素
2. **意外动画**: 可能触发布局属性（如 width、height）的过渡
3. **调试困难**: 难以追踪哪些元素在执行过渡

**应排除的属性**:

- `box-shadow` / `drop-shadow`: 触发重绘
- `width` / `height`: 触发重排
- `top` / `left`: 触发重排
- `margin` / `padding`: 触发重排

**推荐使用的属性**:

- `color`, `background-color`: 仅触发重绘
- `border-color`: 仅触发重绘
- `fill`, `stroke`: SVG 属性，性能良好

### 尊重用户偏好

支持 `prefers-reduced-motion` 媒体查询：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

---

## 9. 可访问性检查清单

- [ ] 所有文本与背景对比度 ≥ 7:1 (WCAG AAA)
- [ ] 焦点状态在暗色模式下清晰可见
- [ ] 路径高亮效果在暗色模式下同样明显
- [ ] 代码块使用适当的暗色语法高亮主题
- [ ] 动画可被用户偏好设置禁用
- [ ] 主题切换不影响功能

---

## 10. 附录：完整颜色变量参考

### Slate 色系使用

| Slate | 亮色用途 | 暗色用途 |
|:---:|:---|:---|
| **50** | Canvas Background | - |
| **100** | User Node BG | Primary Text |
| **200** | Border | - |
| **300** | Edge Default | - |
| **400** | - | Body Text |
| **500** | Secondary Text | Placeholder |
| **600** | - | Border Active, Icon BG |
| **700** | - | Border Subtle, Edge Default |
| **800** | - | Node Background, Panel BG |
| **900** | - | Canvas Background |

### Blue 色系使用

| Blue | 亮色用途 | 暗色用途 |
|:---:|:---|:---|
| **400** | - | Accent, Link |
| **500** | Accent | Primary |
| **600** | Primary | Primary Hover, AI Icon |
| **900** | - | AI Icon Background |

---

## 设计审查清单

在实现暗色主题时，请确保：

1. **Canvas First**: 画布背景退后，节点内容突出
2. **Spatial Context**: 路径高亮和分支置灰效果在暗色下同样明显
3. **Fluidity**: 主题切换动画平滑自然
4. **专业感**: 参考 IDE 工具的成熟暗色主题
5. **一致性**: 与亮色模式保持相同的视觉层次和信息架构
