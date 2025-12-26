import type { ReactNode } from "react";

export interface CanvasLayoutProps {
	/**
	 * Header component (Top navigation bar)
	 */
	header?: ReactNode;

	/**
	 * Main canvas content (will be infinite canvas in UI-002)
	 */
	children: ReactNode;

	/**
	 * Floating toolbar component (bottom center)
	 */
	toolbar?: ReactNode;

	/**
	 * Inspector panel component (right side)
	 */
	inspector?: ReactNode;

	/**
	 * Inspector panel open state
	 */
	inspectorOpen?: boolean;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * CanvasLayout - Full-screen canvas layout wrapper for MindFlow workspace.
 *
 * Provides the structural foundation for the canvas workspace with:
 * - Full-screen viewport container
 * - Grid background (dot pattern)
 * - Positioned slots for header (floating), toolbar, and inspector panel
 * - Responsive canvas area that fills remaining space
 * - Header is rendered as-is (uses fixed positioning in TopHeader)
 *
 * @example
 * ```tsx
 * <CanvasLayout
 *   header={<TopHeader onBack={handleBack} />}
 *   toolbar={<FloatingToolbar />}
 *   inspector={<InspectorPanel />}
 *   inspectorOpen={true}
 * >
 *   <InfiniteCanvas />
 * </CanvasLayout>
 * ```
 */
export function CanvasLayout({
	header,
	children,
	toolbar,
	inspector,
	inspectorOpen = false,
	className = "",
}: CanvasLayoutProps) {
	return (
		<div
			className={`relative w-screen h-screen overflow-hidden bg-slate-50 ${className}`}
		>
			{/* Grid Background - Dot Pattern */}
			<div
				className="absolute inset-0 opacity-40 pointer-events-none"
				style={{
					backgroundImage:
						"radial-gradient(circle, rgb(203 213 225) 1px, transparent 1px)",
					backgroundSize: "24px 24px",
				}}
			/>

			{/* Header (rendered as-is for floating components) */}
			{header}

			{/* Main Canvas Area */}
			<div className="absolute inset-0 z-10 overflow-hidden">{children}</div>

			{/* Bottom Floating Toolbar */}
			{toolbar && (
				<div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
					{toolbar}
				</div>
			)}

			{/* Right Inspector Panel */}
			{inspector && (
				<div
					className={`absolute top-0 right-0 bottom-0 w-[400px] max-w-full z-25 transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
						inspectorOpen ? "translate-x-0" : "translate-x-full"
					}`}
				>
					{inspector}
				</div>
			)}
		</div>
	);
}
