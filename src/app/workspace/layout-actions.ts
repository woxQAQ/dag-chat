/**
 * UI-WORKSPACE-004: Auto Layout Server Action
 *
 * Server Action for applying auto-layout to all nodes in a project.
 * Calculates layout positions and persists them to the database.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getProjectGraphAction } from "@/app/nodes/actions";
import { batchUpdatePositions } from "@/lib/node-crud";
import { calculateTreeLayout } from "@/lib/tree-layout";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of applyAutoLayoutAction
 */
export type AutoLayoutResult = {
	/** Number of nodes whose positions were updated */
	updatedCount: number;
};

/**
 * Standard action state return type
 */
export type ActionState<T> = {
	success: boolean;
	data?: T;
	error?: string;
};

// ============================================================================
// Server Action
// ============================================================================

/**
 * Apply auto-layout to all nodes in a project.
 *
 * This action:
 * 1. Fetches all nodes in the project
 * 2. Calculates new positions using the tree layout algorithm
 * 3. Persists the new positions to the database
 * 4. Revalidates the workspace cache
 *
 * @param projectId - ID of the project to layout
 * @returns Action state with updated count or error message
 *
 * @example
 * ```ts
 * const result = await applyAutoLayoutAction(projectId);
 * if (result.success) {
 *   console.log(`Layout applied: ${result.data.updatedCount} nodes`);
 * }
 * ```
 */
export async function applyAutoLayoutAction(
	projectId: string,
): Promise<ActionState<AutoLayoutResult>> {
	try {
		// Step 1: Fetch all nodes in the project
		const graphResult = await getProjectGraphAction(projectId);
		if (!graphResult.success || !graphResult.data) {
			return {
				success: false,
				error: graphResult.error || "Failed to fetch project graph",
			};
		}

		const { nodes } = graphResult.data;

		// Early exit for empty projects
		if (nodes.length === 0) {
			return {
				success: true,
				data: { updatedCount: 0 },
			};
		}

		// Step 2: Calculate new positions using tree layout algorithm
		// Map full node objects to { id, parentId } format for layout algorithm
		const layoutInput = nodes.map((node) => ({
			id: node.id,
			parentId: node.parentId,
		}));
		const layoutResult = calculateTreeLayout(layoutInput);

		// Step 3: Convert layout result to batch update format
		const batchUpdates = layoutResult.map((layout) => ({
			nodeId: layout.nodeId,
			positionX: layout.positionX,
			positionY: layout.positionY,
		}));

		// Step 4: Persist to database
		await batchUpdatePositions(batchUpdates);

		// Step 5: Revalidate workspace cache
		revalidatePath("/workspace");

		return {
			success: true,
			data: { updatedCount: batchUpdates.length },
		};
	} catch (error) {
		console.error("Auto-layout error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
