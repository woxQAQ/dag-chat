import type { ReactNode } from "react";

export interface InspectorPanelProps {
	/**
	 * Thread tab content (linear conversation flow)
	 */
	threadContent?: ReactNode;

	/**
	 * Panel close handler
	 */
	onClose?: () => void;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * InspectorPanel - Right slide-out panel for MindFlow workspace.
 *
 * Features:
 * - Shows linear conversation flow from Root to selected node
 * - Smooth slide-in/slide-out animation
 * - Backdrop overlay
 * - Close button
 *
 * @example
 * ```tsx
 * <InspectorPanel
 *   threadContent={<ThreadView nodeId={selectedNodeId} />}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
export function InspectorPanel({
	threadContent,
	onClose,
	className = "",
}: InspectorPanelProps) {
	return (
		<aside
			className={`flex flex-col h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-lg ${className}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
				<h2 className="text-sm font-medium text-[var(--color-text-primary)]">
					Thread
				</h2>

				<button
					type="button"
					className="flex items-center justify-center w-8 h-8 border-0 bg-transparent text-[var(--color-text-muted)] cursor-pointer rounded-md hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text-secondary)] transition-colors"
					onClick={onClose}
					aria-label="Close panel"
				>
					<svg
						aria-hidden="true"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{threadContent || (
					<div className="flex items-center justify-center h-full px-4">
						<p className="text-sm text-[var(--color-text-muted)]">
							Select a node to view conversation thread
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}
