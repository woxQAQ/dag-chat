/**
 * UI-WORKSPACE-004: Vertical Tree Layout Algorithm
 *
 * Implements a vertical tree layout algorithm inspired by Reingold-Tilford.
 * Handles multiple root nodes, collision detection, and proper spacing.
 *
 * Features:
 * - Vertical orientation (root at top, children below)
 * - Automatic subtree width calculation
 * - Collision detection and resolution
 * - Support for multiple disconnected trees
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Vertical spacing between parent and child nodes
 * Reused from position-calculator.ts for consistency
 */
const PARENT_CHILD_VERTICAL_OFFSET = 150;

/**
 * Estimated width of a node on the canvas
 * Based on UserNode (280-400px) and AINode (320-500px) components
 */
const NODE_WIDTH = 350;

/**
 * Horizontal gap between sibling nodes
 */
const SIBLING_HORIZONTAL_GAP = 50;

/**
 * Horizontal gap between separate trees (multiple roots)
 */
const TREE_ROOT_GAP = 400;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Input node from graph data
 */
export interface LayoutInputNode {
	id: string;
	parentId: string | null;
}

/**
 * Internal tree node structure for layout calculation
 */
export interface LayoutNode {
	/** Unique node identifier */
	id: string;
	/** Parent node ID (null for root nodes) */
	parentId: string | null;
	/** Child nodes */
	children: LayoutNode[];
	/** Depth in tree (0 for root) */
	depth: number;
	/** Total width of this node's subtree */
	subtreeWidth: number;
	/** Calculated position on canvas */
	position: { x: number; y: number };
}

/**
 * Output layout result for a single node
 */
export interface LayoutResult {
	/** Node identifier */
	nodeId: string;
	/** X coordinate on canvas */
	positionX: number;
	/** Y coordinate on canvas */
	positionY: number;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Calculate vertical tree layout for all nodes in a project.
 *
 * @param nodes - Flat array of nodes with parent-child relationships
 * @returns Array of layout results with calculated positions
 *
 * @example
 * ```ts
 * const nodes = [
 *   { id: "root", parentId: null },
 *   { id: "child1", parentId: "root" },
 *   { id: "child2", parentId: "root" }
 * ];
 * const layout = calculateTreeLayout(nodes);
 * // Returns: [
 * //   { nodeId: "root", positionX: 175, positionY: 0 },
 * //   { nodeId: "child1", positionX: 0, positionY: 150 },
 * //   { nodeId: "child2", positionX: 400, positionY: 150 }
 * // ]
 * ```
 */
export function calculateTreeLayout(nodes: LayoutInputNode[]): LayoutResult[] {
	// Early exit for empty project
	if (nodes.length === 0) {
		return [];
	}

	// Step 1: Build hierarchical tree structure
	const roots = buildTreeStructure(nodes);

	// Step 2: Calculate subtree widths (post-order traversal)
	for (const root of roots) {
		calculateSubtreeWidths(root);
	}

	// Step 3: Assign positions (pre-order traversal)
	let currentX = 0;
	for (const root of roots) {
		// Center the root at its position
		const rootX = currentX + root.subtreeWidth / 2;
		assignPositions(root, rootX, 0);

		// Move to next tree position
		currentX += root.subtreeWidth + TREE_ROOT_GAP;
	}

	// Step 4: Collect results from all trees
	const results: LayoutResult[] = [];
	collectResults(roots, results);

	// Step 5: Detect and resolve collisions
	const finalResults = resolveCollisions(results);

	return finalResults;
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Build hierarchical tree structure from flat node array.
 *
 * Creates a map of all nodes, then builds parent-child relationships.
 * Orphan nodes (missing parent) are treated as separate roots.
 *
 * @param nodes - Flat array of nodes
 * @returns Array of root nodes
 */
function buildTreeStructure(nodes: LayoutInputNode[]): LayoutNode[] {
	const nodeMap = new Map<string, LayoutNode>();
	const roots: LayoutNode[] = [];

	// First pass: create all nodes
	for (const node of nodes) {
		nodeMap.set(node.id, {
			id: node.id,
			parentId: node.parentId,
			children: [],
			depth: 0,
			subtreeWidth: 0,
			position: { x: 0, y: 0 },
		});
	}

	// Second pass: build parent-child relationships
	for (const node of nodes) {
		const layoutNode = nodeMap.get(node.id)!;

		if (node.parentId) {
			const parent = nodeMap.get(node.parentId);
			if (parent) {
				parent.children.push(layoutNode);
				layoutNode.depth = parent.depth + 1;
			} else {
				// Orphan node (parent not found), treat as root
				roots.push(layoutNode);
			}
		} else {
			// Root node (no parent)
			roots.push(layoutNode);
		}
	}

	return roots;
}

/**
 * Calculate subtree widths using post-order traversal.
 *
 * For each node:
 * - Leaf node: width = NODE_WIDTH
 * - Parent node: width = max(NODE_WIDTH, sum of children's widths + gaps)
 *
 * @param node - Root node to calculate from
 * @returns Width of this node's subtree
 */
function calculateSubtreeWidths(node: LayoutNode): number {
	if (node.children.length === 0) {
		// Leaf node
		node.subtreeWidth = NODE_WIDTH;
		return node.subtreeWidth;
	}

	// Calculate total width of all children
	let totalWidth = 0;
	for (const child of node.children) {
		totalWidth += calculateSubtreeWidths(child);
	}

	// Add gaps between children
	totalWidth += (node.children.length - 1) * SIBLING_HORIZONTAL_GAP;

	// Parent is at least as wide as its children
	node.subtreeWidth = Math.max(NODE_WIDTH, totalWidth);
	return node.subtreeWidth;
}

/**
 * Assign positions to nodes using pre-order traversal.
 *
 * Places parent at given position, then recursively positions children
 * centered below the parent.
 *
 * @param node - Root node to assign positions from
 * @param x - X coordinate for this node's center
 * @param y - Y coordinate for this node
 */
function assignPositions(node: LayoutNode, x: number, y: number): void {
	node.position = { x, y };

	if (node.children.length === 0) {
		return;
	}

	// Calculate the total width of all children combined
	const totalChildrenWidth = node.children.reduce(
		(sum, child) => sum + child.subtreeWidth,
		0,
	);
	const totalGaps = (node.children.length - 1) * SIBLING_HORIZONTAL_GAP;
	const totalWidth = totalChildrenWidth + totalGaps;

	// Starting X position so that children are centered below parent
	const startX = x - totalWidth / 2;
	const childY = y + PARENT_CHILD_VERTICAL_OFFSET;

	let currentX = startX;
	for (const child of node.children) {
		// Center child within its subtree width
		const childX = currentX + child.subtreeWidth / 2;
		assignPositions(child, childX, childY);

		// Move to next child position
		currentX += child.subtreeWidth + SIBLING_HORIZONTAL_GAP;
	}
}

/**
 * Collect layout results from tree structure.
 *
 * Traverses all trees and collects node positions.
 *
 * @param nodes - Root nodes to collect from
 * @param results - Output array to append results to
 */
function collectResults(nodes: LayoutNode[], results: LayoutResult[]): void {
	for (const node of nodes) {
		results.push({
			nodeId: node.id,
			positionX: node.position.x,
			positionY: node.position.y,
		});
		collectResults(node.children, results);
	}
}

/**
 * Detect if any nodes overlap in the layout.
 *
 * Uses simple bounding box collision detection.
 *
 * @param layout - Layout results to check
 * @returns True if collisions detected
 */
function detectCollisions(layout: LayoutResult[]): boolean {
	// Build map of positions for O(1) lookup
	const nodePositions = new Map<string, { x: number; y: number }>();
	for (const node of layout) {
		nodePositions.set(node.nodeId, {
			x: node.positionX,
			y: node.positionY,
		});
	}

	// Check each node against all others
	for (const node of layout) {
		for (const [otherId, otherPos] of nodePositions) {
			if (node.nodeId === otherId) continue;

			const dx = Math.abs(node.positionX - otherPos.x);
			const dy = Math.abs(node.positionY - otherPos.y);

			// Check if nodes overlap (with some margin)
			// Nodes on same level shouldn't overlap horizontally
			if (dy < 50 && dx < NODE_WIDTH - SIBLING_HORIZONTAL_GAP) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Resolve collisions by shifting conflicting nodes.
 *
 * This is a simple implementation that handles collisions within each
 * Y-level independently. Nodes at different Y levels are not considered
 * for collision resolution since they should not overlap vertically.
 *
 * @param layout - Layout results to resolve
 * @returns Resolved layout results
 */
function resolveCollisions(layout: LayoutResult[]): LayoutResult[] {
	// Group nodes by Y level
	const nodesByY = new Map<number, LayoutResult[]>();
	for (const node of layout) {
		if (!nodesByY.has(node.positionY)) {
			nodesByY.set(node.positionY, []);
		}
		nodesByY.get(node.positionY)!.push(node);
	}

	// Resolve collisions within each Y level
	const resolved: LayoutResult[] = [];
	for (const [y, nodes] of nodesByY) {
		// Sort by X position
		const sorted = [...nodes].sort((a, b) => a.positionX - b.positionX);

		const occupiedRanges: Array<{ left: number; right: number }> = [];

		for (const node of sorted) {
			const nodeLeft = node.positionX - NODE_WIDTH / 2;
			const nodeRight = node.positionX + NODE_WIDTH / 2;

			// Find the rightmost occupied range that overlaps
			let shiftX = 0;
			for (const range of occupiedRanges) {
				if (nodeLeft < range.right + SIBLING_HORIZONTAL_GAP) {
					shiftX = range.right + SIBLING_HORIZONTAL_GAP - nodeLeft;
					break;
				}
			}

			// Apply shift
			const shiftedNode: LayoutResult = {
				...node,
				positionX: node.positionX + shiftX,
			};

			resolved.push(shiftedNode);
			occupiedRanges.push({
				left: shiftedNode.positionX - NODE_WIDTH / 2,
				right: shiftedNode.positionX + NODE_WIDTH / 2,
			});
		}
	}

	return resolved;
}
