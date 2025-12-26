/**
 * UI-NEW-001 / UI-NEW-003: Empty State Canvas Component
 *
 * Empty state overlay for the canvas. Shows a centered hint message
 * when the project has no nodes, guiding users to double-click to create
 * the first node.
 *
 * When onDoubleClick is provided, the overlay becomes clickable.
 */

"use client";

import { memo } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export interface EmptyStateCanvasProps {
	/** Whether to show the empty state */
	show: boolean;
	/** Optional custom message to display */
	message?: string;
	/** Optional double-click handler for creating the first node */
	onDoubleClick?: (event: React.MouseEvent) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Empty state overlay for canvas.
 *
 * Shows a centered hint message when the project has no nodes.
 * When onDoubleClick is provided, allows double-click to create first node.
 *
 * @example
 * ```tsx
 * <EmptyStateCanvas
 *   show={nodes.length === 0}
 *   message="Double click anywhere to start your thought flow"
 *   onDoubleClick={(e) => createRootNode(e.clientX, e.clientY)}
 * />
 * ```
 */
export const EmptyStateCanvas = memo<EmptyStateCanvasProps>(
	function EmptyStateCanvas({ show, message, onDoubleClick }) {
		if (!show) return null;

		const defaultMessage = "Double click anywhere to start your thought flow";
		const displayMessage = message || defaultMessage;
		const hasClickHandler = !!onDoubleClick;

		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: Canvas area requires double-click interaction
			<div
				className="absolute inset-0 flex items-center justify-center"
				style={{ zIndex: 1 }} // Above ReactFlow canvas (which has z-index: 0 by default)
				onDoubleClick={onDoubleClick}
			>
				<div
					className="text-center"
					style={{ pointerEvents: hasClickHandler ? "none" : "auto" }}
				>
					<p className="text-lg text-slate-400 font-light tracking-wide">
						{displayMessage}
					</p>
				</div>
			</div>
		);
	},
);
