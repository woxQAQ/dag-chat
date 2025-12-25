"use client";

import {
	Background,
	BackgroundVariant,
	Controls,
	type Edge,
	type Node,
	ReactFlow,
	type ReactFlowProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Re-export common types from React Flow for external use
export type { Edge, Node };
export { BackgroundVariant };

/**
 * Union type for background variant options
 */
export type CanvasBackgroundVariant = "dots" | "lines" | "cross";

/**
 * Props for InfiniteCanvas component
 */
export interface InfiniteCanvasProps
	extends Omit<
		ReactFlowProps,
		"fitView" | "snapToGrid" | "defaultEdgeOptions" | "children"
	> {
	/**
	 * Canvas nodes
	 */
	nodes?: Node[];

	/**
	 * Canvas edges
	 */
	edges?: Edge[];

	/**
	 * Enable pan on drag (default: true)
	 */
	panOnDrag?: boolean;

	/**
	 * Enable zoom on scroll (default: true)
	 */
	zoomOnScroll?: boolean;

	/**
	 * Enable zoom on pinch (default: true)
	 */
	zoomOnPinch?: boolean;

	/**
	 * Enable panning on scroll (default: false)
	 */
	panOnScroll?: boolean;

	/**
	 * Background variant (dots, lines, or cross)
	 */
	backgroundVariant?: CanvasBackgroundVariant;

	/**
	 * Background gap size in pixels (default: 24)
	 */
	backgroundGap?: number;

	/**
	 * Show minimap controls (default: false)
	 */
	showControls?: boolean;

	/**
	 * Initial viewport state
	 */
	initialViewport?: {
		x: number;
		y: number;
		zoom: number;
	};
}

/**
 * InfiniteCanvas - Infinite canvas component with pan and zoom support.
 *
 * Built on top of React Flow (@xyflow/react), provides:
 * - Infinite panning and zooming
 * - Background grid pattern (dots/lines/cross)
 * - Node and edge rendering
 * - Optional controls UI
 * - Keyboard shortcuts support
 *
 * @example
 * ```tsx
 * <InfiniteCanvas
 *   nodes={nodes}
 *   edges={edges}
 *   onNodesChange={onNodesChange}
 *   onEdgesChange={onEdgesChange}
 *   backgroundVariant="dots"
 * />
 * ```
 */
export function InfiniteCanvas({
	nodes = [],
	edges = [],
	panOnDrag = true,
	zoomOnScroll = true,
	zoomOnPinch = true,
	panOnScroll = false,
	backgroundVariant = "dots",
	backgroundGap = 24,
	showControls = false,
	initialViewport = { x: 0, y: 0, zoom: 1 },
	...restProps
}: InfiniteCanvasProps) {
	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			fitView
			snapToGrid
			defaultEdgeOptions={{
				animated: false,
				type: "smoothstep",
				style: { stroke: "#cbd5e1", strokeWidth: 2 },
			}}
			panOnDrag={panOnDrag}
			zoomOnScroll={zoomOnScroll}
			zoomOnPinch={zoomOnPinch}
			panOnScroll={panOnScroll}
			defaultViewport={initialViewport}
			minZoom={0.1}
			maxZoom={4}
			{...restProps}
		>
			<Background
				variant={backgroundVariant as BackgroundVariant}
				gap={backgroundGap}
				size={1}
				color="#cbd5e1"
			/>
			{showControls && <Controls />}
		</ReactFlow>
	);
}
