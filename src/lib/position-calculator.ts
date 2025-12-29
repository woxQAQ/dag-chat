/**
 * UI-NEW-005: Position Calculator Utility
 *
 * Provides functions for calculating node positions during fork operations.
 * Handles positioning for forked sibling nodes and AI response nodes.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface Position {
	x: number;
	y: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Horizontal spacing between parallel branches */
export const FORK_HORIZONTAL_OFFSET = 350;

/** Vertical spacing between parent and child nodes */
export const PARENT_CHILD_VERTICAL_OFFSET = 220;

/** Maximum horizontal offset before wrapping to new row */
export const MAX_HORIZONTAL_OFFSET = 1200;

// ============================================================================
// Fork Position Calculations
// ============================================================================

/**
 * Calculates the position for a forked sibling node.
 *
 * Places the new node to the right of the original node.
 * For multiple forks, staggers positions to prevent overlap.
 *
 * @param originalX - Original node's X position
 * @param originalY - Original node's Y position
 * @param forkIndex - Index of this fork (0 for first fork, 1 for second, etc.)
 * @returns Position coordinates for the forked node
 *
 * @example
 * ```ts
 * // First fork: position to the right
 * calculateForkPosition(100, 200, 0); // { x: 450, y: 200 }
 *
 * // Second fork: further to the right
 * calculateForkPosition(100, 200, 1); // { x: 800, y: 200 }
 * ```
 */
export function calculateForkPosition(
	originalX: number,
	originalY: number,
	forkIndex: number = 0,
): Position {
	// Calculate horizontal position with wrapping
	const horizontalOffset = FORK_HORIZONTAL_OFFSET * (forkIndex + 1);
	const wrappedX = originalX + (horizontalOffset % MAX_HORIZONTAL_OFFSET);

	// Calculate vertical position with row wrapping
	const rowOffset = Math.floor(horizontalOffset / MAX_HORIZONTAL_OFFSET);
	const wrappedY = originalY + rowOffset * FORK_HORIZONTAL_OFFSET;

	return { x: wrappedX, y: wrappedY };
}

/**
 * Calculates the position for an AI response node.
 *
 * Places the ASSISTANT node below the USER node with standard vertical spacing.
 *
 * @param userNodeX - USER node's X position
 * @param userNodeY - USER node's Y position
 * @returns Position coordinates for the AI response node
 *
 * @example
 * ```ts
 * calculateAIResponsePosition(100, 200); // { x: 100, y: 350 }
 * ```
 */
export function calculateAIResponsePosition(
	userNodeX: number,
	userNodeY: number,
): Position {
	return {
		x: userNodeX,
		y: userNodeY + PARENT_CHILD_VERTICAL_OFFSET,
	};
}

/**
 * Calculates how many times a node has been forked.
 *
 * Useful for determining the next fork index.
 *
 * @param existingForkCount - Current number of forks
 * @returns The index for the next fork
 *
 * @example
 * ```ts
 * // If node has 2 forks, next fork should use index 2
 * getNextForkIndex(2); // 2
 * ```
 */
export function getNextForkIndex(existingForkCount: number): number {
	return existingForkCount;
}

/**
 * Checks if a position would conflict with existing nodes.
 *
 * Simple distance-based collision detection.
 *
 * @param position - Position to check
 * @param existingPositions - Array of existing node positions
 * @param minDistance - Minimum distance between nodes (default: 100)
 * @returns True if position conflicts with existing nodes
 *
 * @example
 * ```ts
 * const wouldConflict = checkPositionConflict(
 *   { x: 100, y: 200 },
 *   [{ x: 150, y: 250 }, { x: 400, y: 200 }],
 *   100
 * ); // true (first node is too close)
 * ```
 */
export function checkPositionConflict(
	position: Position,
	existingPositions: Position[],
	minDistance: number = 100,
): boolean {
	return existingPositions.some((existing) => {
		const dx = position.x - existing.x;
		const dy = position.y - existing.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		return distance < minDistance;
	});
}
