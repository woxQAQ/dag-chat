/**
 * UI-005: Path Highlighting Hook
 *
 * Custom hook for managing path highlighting state in the canvas.
 * Handles node selection and computes which nodes/edges to highlight or dim.
 *
 * @example
 * ```tsx
 * const { highlightedNodes, highlightedEdges, selectedNodeId, setSelectedNodeId } = usePathHighlight({
 *   nodes,
 *   edges,
 *   highlightColor: "#2563eb",
 * });
 *
 * <InfiniteCanvas
 *   nodes={highlightedNodes}
 *   edges={highlightedEdges}
 *   onNodesChange={onNodesChange}
 *   onEdgesChange={onEdgesChange}
 *   onSelectionChange={(params) => setSelectedNodeId(params?.nodes[0]?.id || null)}
 * />
 * ```
 */

import { useMemo, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import {
	applyEdgeHighlightStyles,
	applyNodeHighlightStyles,
	calculatePathHighlight,
	type PathHighlightResult,
} from "@/lib/path-calculator";

export interface UsePathHighlightOptions {
	/** Current nodes in the canvas */
	nodes: Node[];
	/** Current edges in the canvas */
	edges: Edge[];
	/** Highlight color for active path (default: #2563eb) */
	highlightColor?: string;
	/** Dimmed color for inactive paths (default: #cbd5e1) */
	dimmedColor?: string;
	/** Optional callback when selection changes */
	onSelectionChange?: (nodeId: string | null) => void;
}

export interface UsePathHighlightResult {
	/** Nodes with highlighting/dimming styles applied */
	highlightedNodes: Node[];
	/** Edges with highlighting/dimming styles applied */
	highlightedEdges: Edge[];
	/** Currently selected node ID */
	selectedNodeId: string | null;
	/** Set the selected node ID */
	setSelectedNodeId: (nodeId: string | null) => void;
	/** Clear the selection (removes all highlighting) */
	clearSelection: () => void;
	/** Raw path highlight result (for advanced usage) */
	highlightResult: PathHighlightResult;
	/** Whether any highlighting is currently active */
	isHighlighting: boolean;
}

/**
 * Hook for managing path highlighting in the canvas
 *
 * When a node is selected:
 * - The path from root to the selected node is highlighted
 * - All other nodes and edges are dimmed (30% opacity)
 * - Edges on the path are animated
 *
 * @param options - Configuration options
 * @returns Path highlighting state and controls
 */
export function usePathHighlight(
	options: UsePathHighlightOptions,
): UsePathHighlightResult {
	const { nodes, edges, highlightColor = "#2563eb", dimmedColor = "#cbd5e1", onSelectionChange } =
		options;

	// State for selected node ID
	const [selectedNodeId, setSelectedNodeIdState] = useState<string | null>(null);

	// Memoized path highlight calculation
	const highlightResult = useMemo((): PathHighlightResult => {
		return calculatePathHighlight(selectedNodeId, nodes, edges);
	}, [selectedNodeId, nodes, edges]);

	// Apply styles to nodes
	const highlightedNodes = useMemo((): Node[] => {
		return applyNodeHighlightStyles(nodes, highlightResult);
	}, [nodes, highlightResult]);

	// Apply styles to edges
	const highlightedEdges = useMemo((): Edge[] => {
		return applyEdgeHighlightStyles(edges, highlightResult, highlightColor, dimmedColor);
	}, [edges, highlightResult, highlightColor, dimmedColor]);

	// Set selected node ID with optional callback
	const setSelectedNodeId = (nodeId: string | null) => {
		setSelectedNodeIdState(nodeId);
		onSelectionChange?.(nodeId);
	};

	// Clear selection helper
	const clearSelection = () => {
		setSelectedNodeId(null);
	};

	// Check if highlighting is active
	const isHighlighting = selectedNodeId !== null && highlightResult.pathNodeIds.length > 0;

	return {
		highlightedNodes,
		highlightedEdges,
		selectedNodeId,
		setSelectedNodeId,
		clearSelection,
		highlightResult,
		isHighlighting,
	};
}

/**
 * Extended hook options with inspector panel integration
 */
export interface UsePathHighlightWithInspectorOptions extends UsePathHighlightOptions {
	/** Callback when node is selected (opens inspector) */
	onNodeSelected?: (nodeId: string) => void;
	/** Callback when selection is cleared (closes inspector) */
	onSelectionCleared?: () => void;
}

/**
 * Extended result with inspector integration
 */
export interface UsePathHighlightWithInspectorResult extends UsePathHighlightResult {
	/** Handle node selection with inspector panel integration */
	handleNodeSelect: (nodeId: string) => void;
	/** Handle selection clear with inspector panel integration */
	handleSelectionClear: () => void;
}

/**
 * Hook for path highlighting with inspector panel integration
 *
 * This variant includes callbacks for opening/closing the inspector panel
 * when nodes are selected or deselected.
 *
 * @param options - Configuration options with inspector callbacks
 * @returns Path highlighting state with inspector-integrated handlers
 */
export function usePathHighlightWithInspector(
	options: UsePathHighlightWithInspectorOptions,
): UsePathHighlightWithInspectorResult {
	const baseHook = usePathHighlight(options);

	const handleNodeSelect = (nodeId: string) => {
		baseHook.setSelectedNodeId(nodeId);
		options.onNodeSelected?.(nodeId);
	};

	const handleSelectionClear = () => {
		baseHook.clearSelection();
		options.onSelectionCleared?.();
	};

	return {
		...baseHook,
		handleNodeSelect,
		handleSelectionClear,
	};
}
