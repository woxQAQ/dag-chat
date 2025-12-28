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
import { useCallback, useState } from "react";

// Re-export common types from React Flow for external use
export type { Edge, Node };
export { BackgroundVariant };

/**
 * Union type for background variant options
 */
export type CanvasBackgroundVariant = "dots" | "lines" | "cross";

/**
 * Viewport state type for move events
 */
export type Viewport = {
	x: number;
	y: number;
	zoom: number;
};

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

	/**
	 * UI-002-UPDATE: Show background dots only when panning.
	 * When true, dots are hidden when canvas is static and shown during pan/drag.
	 * Provides a cleaner, minimal look when not interacting with the canvas.
	 * (default: false for backward compatibility)
	 */
	showDotsOnPanOnly?: boolean;

	/**
	 * UI-002-UPDATE: Custom dot opacity (0-1).
	 * Default is 0.04 (4% opacity) for a very subtle appearance.
	 * Can be increased for more visible dots.
	 */
	dotOpacity?: number;
}

/**
 * InfiniteCanvas - Infinite canvas component with pan and zoom support.
 *
 * Built on top of React Flow (@xyflow/react), provides:
 * - Infinite panning and zooming
 * - Background grid pattern (dots/lines/cross) with very subtle opacity
 * - Optional dynamic dot display (show only when panning)
 * - Node and edge rendering
 * - Optional controls UI
 * - Keyboard shortcuts support
 *
 * @example
 * ```tsx
 * // Basic usage with subtle dots
 * <InfiniteCanvas
 *   nodes={nodes}
 *   edges={edges}
 *   onNodesChange={onNodesChange}
 *   onEdgesChange={onEdgesChange}
 * />
 *
 * // With dynamic dot display (dots appear only when panning)
 * <InfiniteCanvas
 *   nodes={nodes}
 *   edges={edges}
 *   showDotsOnPanOnly={true}
 *   dotOpacity={0.04}
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
	showDotsOnPanOnly = false,
	dotOpacity = 0.04,
	...restProps
}: InfiniteCanvasProps) {
	// UI-002-UPDATE: Track panning state for dynamic dot display
	const [isPanning, setIsPanning] = useState(false);

	// Handle canvas move start (panning begins)
	const onMoveStart = useCallback(
		(
			_event: React.MouseEvent<Element, MouseEvent> | TouchEvent | null,
			_viewport: Viewport,
		) => {
			if (showDotsOnPanOnly) {
				setIsPanning(true);
			}
		},
		[showDotsOnPanOnly],
	);

	// Handle canvas move end (panning ends)
	const onMoveEnd = useCallback(
		(
			_event: React.MouseEvent<Element, MouseEvent> | TouchEvent | null,
			_viewport: Viewport,
		) => {
			if (showDotsOnPanOnly) {
				setIsPanning(false);
			}
		},
		[showDotsOnPanOnly],
	);

	// UI-002-UPDATE: Calculate dot color with opacity
	// Use rgba for opacity control, defaulting to a very subtle 4%
	const dotColor = `rgba(203, 213, 225, ${dotOpacity})`; // #cbd5e1 at 4% opacity

	// UI-002-UPDATE: Conditionally render background
	// - If showDotsOnPanOnly is false, always show dots (default behavior)
	// - If showDotsOnPanOnly is true, only show dots when panning
	const shouldShowBackground = !showDotsOnPanOnly || isPanning;

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
			// biome-ignore lint/suspicious/noExplicitAny: ReactFlow onMoveStart/onMoveEnd types not properly exported
			onMoveStart={onMoveStart as any}
			// biome-ignore lint/suspicious/noExplicitAny: ReactFlow onMoveStart/onMoveEnd types not properly exported
			onMoveEnd={onMoveEnd as any}
			{...restProps}
			onPaneClick={restProps.onPaneClick}
		>
			{shouldShowBackground && (
				<Background
					variant={backgroundVariant as BackgroundVariant}
					gap={backgroundGap}
					size={1}
					color={dotColor}
				/>
			)}
			{showControls && <Controls />}
		</ReactFlow>
	);
}
