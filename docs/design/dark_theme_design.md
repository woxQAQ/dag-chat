# MindFlow 暗色主题设计规范 (Dark Theme Design)

> 基于 [UI Design Specification](./ui_design_spec.md) v1.0
> 设计理念：Canvas First, Spatial Context, Fluidity

## 1. 设计原则 (Design Principles)

### 1.1 视觉舒适度
- **对比度管理**: 确保文本与背景符合 WCAG AAA 标准（7:1 对比度）
- **减少眼疲劳**: 避免纯黑 (#000000)，使用深灰色以减少 OLED 屏幕上的视觉疲劳和拖影
- **层次清晰**: 使用透明度和阴影来构建深度，而非仅依赖颜色变化

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
- **推荐主题**: `github-dark` 或 `dracula`
- **背景**: `#0F172A` (Slate 900)
- **边框**: `#334155` (Slate 700)

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

在 `globals.css` 中扩展 CSS 变量：

```css
:root {
  /* Light Mode (Default) */
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
  /* Dark Mode */
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
    --canvas-bg: #0F172A;
    --primary: #3B82F6;
    /* ... 其他暗色变量 */
  }
}
```

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

### 7.3 主题切换组件

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

使用 CSS transition 实现平滑的主题切换：

```css
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

**注意**: 某些属性（如 box-shadow）应排除在过渡之外，避免性能问题。

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
