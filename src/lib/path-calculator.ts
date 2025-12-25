/**
 * UI-005: Path Calculator Utility
 *
 * Calculates the path from a selected node to the root node
 * for visual highlighting in the canvas.
 *
 * This is a client-side utility that operates on ReactFlow nodes and edges.
 */

import type { Edge, Node } from "@xyflow/react";

/**
 * Result of path calculation containing highlighted and dimmed elements
 */
export interface PathHighlightResult {
	/** Node IDs that are on the active path (root to selected) */
	highlightedNodeIds: Set<string>;
	/** Edge IDs that are on the active path */
	highlightedEdgeIds: Set<string>;
	/** Node IDs that should be dimmed (not on active path) */
	dimmedNodeIds: Set<string>;
	/** Edge IDs that should be dimmed (not on active path) */
	dimmedEdgeIds: Set<string>;
	/** The complete path from root to selected node (ordered) */
	pathNodeIds: string[];
}

/**
 * Builds a parent-child map from edges for efficient traversal
 *
 * @param edges - ReactFlow edges array
 * @returns Map of child ID to parent ID
 */
function buildParentMap(edges: Edge[]): Map<string, string> {
	const parentMap = new Map<string, string>();

	for (const edge of edges) {
		// Edge source is parent, target is child (based on our data model)
		parentMap.set(edge.target, edge.source);
	}

	return parentMap;
}

/**
 * Finds the root node ID in the graph
 *
 * Root node is defined as a node with no parent (no incoming edges)
 *
 * @param nodes - ReactFlow nodes array
 * @param parentMap - Map of child ID to parent ID
 * @returns Root node ID or null if no root found
 */
function findRootNodeId(
	nodes: Node[],
	parentMap: Map<string, string>,
): string | null {
	for (const node of nodes) {
		// Root node has no parent
		if (!parentMap.has(node.id)) {
			return node.id;
		}
	}

	// Fallback: check for isRoot metadata
	for (const node of nodes) {
		const data = node.data as { metadata?: Record<string, unknown> };
		if (data?.metadata?.isRoot === true) {
			return node.id;
		}
	}

	return null;
}

/**
 * Calculates the path from root to a selected node
 *
 * @param selectedNodeId - The ID of the selected node
 * @param parentMap - Map of child ID to parent ID
 * @returns Array of node IDs from root to selected (inclusive)
 */
function calculatePathToRoot(
	selectedNodeId: string,
	parentMap: Map<string, string>,
): string[] {
	const path: string[] = [];
	let currentId = selectedNodeId;

	// Traverse up from selected node to root
	while (currentId) {
		path.unshift(currentId); // Add to beginning of path
		currentId = parentMap.get(currentId) || "";
	}

	return path;
}

/**
 * Main function to calculate path highlighting for a selected node
 *
 * When a node is selected:
 * - Highlights the path from root to the selected node (nodes + edges)
 * - Dims all other nodes and edges (not on the active path)
 *
 * @param selectedNodeId - The ID of the selected node, or null for no selection
 * @param nodes - ReactFlow nodes array
 * @param edges - ReactFlow edges array
 * @returns PathHighlightResult with highlighted and dimmed element IDs
 *
 * @example
 * ```ts
 * const result = calculatePathHighlight(
 *   "node-3",
 *   [{ id: "node-1", ... }, { id: "node-2", ... }, { id: "node-3", ... }],
 *   [{ id: "edge-1-2", source: "node-1", target: "node-2" }, ...]
 * );
 * // Returns:
 * // {
 * //   highlightedNodeIds: Set(["node-1", "node-2", "node-3"]),
 * //   highlightedEdgeIds: Set(["edge-1-2", "edge-2-3"]),
 * //   dimmedNodeIds: Set(["node-4", "node-5"]),
 * //   dimmedEdgeIds: Set(["edge-1-4"]),
 * //   pathNodeIds: ["node-1", "node-2", "node-3"]
 * // }
 * ```
 */
export function calculatePathHighlight(
	selectedNodeId: string | null,
	nodes: Node[],
	edges: Edge[],
): PathHighlightResult {
	// Initialize empty result
	const emptyResult: PathHighlightResult = {
		highlightedNodeIds: new Set<string>(),
		highlightedEdgeIds: new Set<string>(),
		dimmedNodeIds: new Set<string>(),
		dimmedEdgeIds: new Set<string>(),
		pathNodeIds: [],
	};

	// No selection: return empty result (everything normal)
	if (!selectedNodeId || nodes.length === 0) {
		return emptyResult;
	}

	// Build parent map for traversal
	const parentMap = buildParentMap(edges);

	// Find the path from root to selected node
	const pathNodeIds = calculatePathToRoot(selectedNodeId, parentMap);

	// Convert path to Set for efficient lookup
	const pathNodeSet = new Set(pathNodeIds);

	// Find highlighted edges (edges connecting nodes in the path)
	const highlightedEdgeIds = new Set<string>();
	for (const edge of edges) {
		// Edge is on path if both source and target are in path
		if (pathNodeSet.has(edge.source) && pathNodeSet.has(edge.target)) {
			// Verify it's a parent-child relationship in the correct direction
			// (source comes before target in path)
			const sourceIndex = pathNodeIds.indexOf(edge.source);
			const targetIndex = pathNodeIds.indexOf(edge.target);
			if (
				sourceIndex >= 0 &&
				targetIndex >= 0 &&
				targetIndex === sourceIndex + 1
			) {
				highlightedEdgeIds.add(edge.id);
			}
		}
	}

	// Dimmed nodes are those not on the path
	const dimmedNodeIds = new Set<string>();
	for (const node of nodes) {
		if (!pathNodeSet.has(node.id)) {
			dimmedNodeIds.add(node.id);
		}
	}

	// Dimmed edges are those not highlighted
	const dimmedEdgeIds = new Set<string>();
	for (const edge of edges) {
		if (!highlightedEdgeIds.has(edge.id)) {
			dimmedEdgeIds.add(edge.id);
		}
	}

	return {
		highlightedNodeIds: pathNodeSet,
		highlightedEdgeIds,
		dimmedNodeIds,
		dimmedEdgeIds,
		pathNodeIds,
	};
}

/**
 * Applies path highlighting styles to nodes
 *
 * @param nodes - Original ReactFlow nodes
 * @param highlightResult - Result from calculatePathHighlight
 * @returns New nodes array with updated styles
 */
export function applyNodeHighlightStyles<T extends Node = Node>(
	nodes: T[],
	highlightResult: PathHighlightResult,
): T[] {
	const { highlightedNodeIds, dimmedNodeIds } = highlightResult;

	return nodes.map((node) => {
		const isHighlighted = highlightedNodeIds.has(node.id);
		const isDimmed = dimmedNodeIds.has(node.id);

		// Create new node with updated style
		return {
			...node,
			style: {
				...node.style,
				opacity: isDimmed ? 0.3 : isHighlighted ? 1 : 1,
				transition: "opacity 0.2s ease-in-out",
			},
			className:
				`${node.className || ""} ${isHighlighted ? "node-highlighted" : ""} ${isDimmed ? "node-dimmed" : ""}`.trim(),
		};
	});
}

/**
 * Applies path highlighting styles to edges
 *
 * @param edges - Original ReactFlow edges
 * @param highlightResult - Result from calculatePathHighlight
 * @param highlightColor - Color for highlighted edges (default: #2563eb)
 * @param dimmedColor - Color for dimmed edges (default: #cbd5e1 with opacity)
 * @returns New edges array with updated styles
 */
export function applyEdgeHighlightStyles(
	edges: Edge[],
	highlightResult: PathHighlightResult,
	highlightColor = "#2563eb",
	dimmedColor = "#cbd5e1",
): Edge[] {
	const { highlightedEdgeIds, dimmedEdgeIds } = highlightResult;

	return edges.map((edge) => {
		const isHighlighted = highlightedEdgeIds.has(edge.id);
		const isDimmed = dimmedEdgeIds.has(edge.id);

		// Create new edge with updated style
		return {
			...edge,
			style: {
				...edge.style,
				stroke: isHighlighted
					? highlightColor
					: isDimmed
						? dimmedColor
						: (edge.style?.stroke as string) || "#cbd5e1",
				strokeWidth: isHighlighted
					? 3
					: isDimmed
						? 1
						: (edge.style?.strokeWidth as number) || 2,
				opacity: isDimmed ? 0.3 : 1,
				transition: "all 0.2s ease-in-out",
			},
			animated: isHighlighted,
			className:
				`${edge.className || ""} ${isHighlighted ? "edge-highlighted" : ""} ${isDimmed ? "edge-dimmed" : ""}`.trim(),
		};
	});
}
