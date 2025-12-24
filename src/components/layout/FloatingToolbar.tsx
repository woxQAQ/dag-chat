import type { ReactNode } from "react";

export type ToolMode = "select" | "hand" | "connect";

export interface FloatingToolbarProps {
	/**
	 * Current active tool mode
	 */
	mode?: ToolMode;

	/**
	 * Callback when tool mode changes
	 */
	onModeChange?: (mode: ToolMode) => void;

	/**
	 * Callback when add node is clicked
	 */
	onAddNode?: () => void;

	/**
	 * Callback when layout is clicked
	 */
	onLayout?: () => void;

	/**
	 * Custom toolbar content (overrides default)
	 */
	children?: ReactNode;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * FloatingToolbar - Bottom center floating toolbar for MindFlow workspace.
 *
 * Features:
 * - Glassmorphism effect (blur + semi-transparent)
 * - Pill/capsule shape
 * - Tool mode selection (Select, Hand, Connect)
 * - Add Node button (primary action)
 * - Auto Layout button
 * - Keyboard shortcuts displayed
 *
 * @example
 * ```tsx
 * <FloatingToolbar
 *   mode="select"
 *   onModeChange={(mode) => setMode(mode)}
 *   onAddNode={() => createNode()}
 * />
 * ```
 */
export function FloatingToolbar({
	mode = "select",
	onModeChange,
	onAddNode,
	onLayout,
	children,
	className = "",
}: FloatingToolbarProps) {
	const buttonClass = (active: boolean) =>
		`flex items-center justify-center w-10 h-10 rounded-lg border-0 cursor-pointer transition-all duration-120 ${
			active
				? "bg-blue-500 text-white"
				: "bg-transparent text-slate-600 hover:bg-slate-200/60"
		}`;

	const primaryButtonClass =
		"flex items-center gap-2 px-4 h-10 bg-blue-500 text-white rounded-lg border-0 cursor-pointer font-medium transition-all duration-120 hover:bg-blue-600 shadow-sm";

	if (children) {
		return (
			<div
				className={`flex items-center gap-1 px-2 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-slate-200/60 ${className}`}
			>
				{children}
			</div>
		);
	}

	return (
		<div
			className={`flex items-center gap-1 px-2 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-slate-200/60 ${className}`}
		>
			{/* Select Tool */}
			<button
				type="button"
				className={buttonClass(mode === "select")}
				onClick={() => onModeChange?.("select")}
				aria-label="Select mode (V)"
				title="Select (V)"
			>
				<svg
					aria-hidden="true"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
				</svg>
			</button>

			{/* Hand Tool */}
			<button
				type="button"
				className={buttonClass(mode === "hand")}
				onClick={() => onModeChange?.("hand")}
				aria-label="Hand mode (H)"
				title="Hand (H)"
			>
				<svg
					aria-hidden="true"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
					<path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
					<path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
					<path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
				</svg>
			</button>

			{/* Connect Tool */}
			<button
				type="button"
				className={buttonClass(mode === "connect")}
				onClick={() => onModeChange?.("connect")}
				aria-label="Connect mode (L)"
				title="Connect (L)"
			>
				<svg
					aria-hidden="true"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<circle cx="6" cy="6" r="3" />
					<circle cx="18" cy="18" r="3" />
					<path d="M8.5 8.5l7 7" />
				</svg>
			</button>

			{/* Divider */}
			<div className="w-px h-6 bg-slate-200 mx-1" />

			{/* Add Node Button (Primary) */}
			<button
				type="button"
				className={primaryButtonClass}
				onClick={onAddNode}
				aria-label="Add node (N)"
				title="Add Node (N)"
			>
				<svg
					aria-hidden="true"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2.5"
				>
					<path d="M12 5v14M5 12h14" />
				</svg>
				<span>Add</span>
			</button>

			{/* Layout Button */}
			<button
				type="button"
				className="flex items-center justify-center w-10 h-10 rounded-lg border-0 bg-transparent text-slate-600 cursor-pointer transition-all duration-120 hover:bg-slate-200/60"
				onClick={onLayout}
				aria-label="Auto layout"
				title="Auto Layout"
			>
				<svg
					aria-hidden="true"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<rect x="3" y="3" width="7" height="7" />
					<rect x="14" y="3" width="7" height="7" />
					<rect x="14" y="14" width="7" height="7" />
					<rect x="3" y="14" width="7" height="7" />
				</svg>
			</button>
		</div>
	);
}
