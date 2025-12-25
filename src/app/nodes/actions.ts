/**
 * UI-NEW-002: Branching Interaction Server Actions
 * UI-NEW-004: Node Content Editing Server Actions
 *
 * Server Actions for creating child nodes during branching interaction,
 * and for updating node content during editing.
 * Wraps API-003 node-crud service for use in client components.
 */

"use server";

import { revalidatePath } from "next/cache";
import type { GraphData } from "@/lib/graph-retrieval";
import { createNode, updateNodeContent } from "@/lib/node-crud";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreateChildNodeInput {
	projectId: string;
	parentNodeId: string;
	role?: "USER" | "ASSISTANT";
	content?: string;
	positionX?: number;
	positionY?: number;
	metadata?: Record<string, unknown>;
}

export interface UpdateNodeContentInput {
	nodeId: string;
	content: string;
	metadata?: Record<string, unknown>;
}

export interface ActionState<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// Re-export GraphData types for client components
export type { GraphData, GraphEdge, GraphNode } from "@/lib/graph-retrieval";

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Gets the project graph data for rendering on the canvas.
 *
 * This Server Action wraps API-002's getProjectGraph for client components.
 *
 * @param projectId - The project ID to fetch graph data for
 * @returns The complete graph with nodes, edges, and root node ID
 */
export async function getProjectGraphAction(
	projectId: string,
): Promise<ActionState<GraphData>> {
	try {
		const { getProjectGraph } = await import("@/lib/graph-retrieval");
		const graph = await getProjectGraph(projectId);
		return {
			success: true,
			data: graph,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to load graph",
		};
	}
}

/**
 * Creates a child node from a parent node during branching interaction.
 *
 * This is the primary action for UI-NEW-002: when user clicks the "+" button
 * on a node, a new USER node is created as a child of the parent node.
 *
 * @param input - Child node creation parameters
 * @returns ActionState with created node data or error
 *
 * @example
 * ```tsx
 * const result = await createChildNode({
 *   projectId: "project-uuid",
 *   parentNodeId: "parent-uuid",
 *   role: "USER",
 *   content: "",
 *   positionX: 100,
 *   positionY: 200
 * });
 * ```
 */
export async function createChildNode(
	input: CreateChildNodeInput,
): Promise<
	ActionState<{ nodeId: string; positionX: number; positionY: number }>
> {
	try {
		const node = await createNode({
			projectId: input.projectId,
			parentId: input.parentNodeId,
			role: input.role || "USER",
			content: input.content || "",
			positionX: input.positionX ?? 0,
			positionY: input.positionY ?? 0,
			metadata: input.metadata ?? {},
		});

		// Revalidate workspace page to refresh node data
		revalidatePath("/workspace");

		return {
			success: true,
			data: {
				nodeId: node.id,
				positionX: node.positionX,
				positionY: node.positionY,
			},
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create child node",
		};
	}
}

/**
 * Creates a child node with automatic position calculation.
 *
 * Positions the new child node below the parent node with a horizontal offset.
 *
 * @param input - Child node creation parameters (without position)
 * @returns ActionState with created node data including calculated position
 */
export async function createChildNodeAutoPosition(
	input: Omit<CreateChildNodeInput, "positionX" | "positionY">,
): Promise<
	ActionState<{ nodeId: string; positionX: number; positionY: number }>
> {
	try {
		// Import graph-retrieval to get parent node position
		const { getProjectGraph } = await import("@/lib/graph-retrieval");
		const graph = await getProjectGraph(input.projectId);

		// Find parent node to get its position
		const parentNode = graph.nodes.find((n) => n.id === input.parentNodeId);

		// Calculate child position: below parent with slight random horizontal offset
		// to prevent perfect overlap when creating multiple children
		const parentX = parentNode?.positionX ?? 0;
		const parentY = parentNode?.positionY ?? 0;
		const verticalSpacing = 150; // Space between parent and child
		const horizontalOffset = Math.floor(Math.random() * 40) - 20; // -20 to +20

		const childX = parentX + horizontalOffset;
		const childY = parentY + verticalSpacing;

		return createChildNode({
			...input,
			positionX: childX,
			positionY: childY,
		});
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create child node",
		};
	}
}

/**
 * UI-NEW-004: Updates the content of an existing node.
 *
 * This Server Action wraps API-003's updateNodeContent for client components.
 * Used when user edits a node's content via double-click and save.
 *
 * @param input - Node content update parameters
 * @returns ActionState with updated node data or error
 *
 * @example
 * ```tsx
 * const result = await updateNodeContentAction({
 *   nodeId: "node-uuid",
 *   content: "Updated message content"
 * });
 * ```
 */
export async function updateNodeContentAction(
	input: UpdateNodeContentInput,
): Promise<ActionState<{ nodeId: string; content: string }>> {
	try {
		const node = await updateNodeContent(input.nodeId, {
			content: input.content,
			metadata: input.metadata,
		});

		// Revalidate workspace page to refresh node data
		revalidatePath("/workspace");

		return {
			success: true,
			data: {
				nodeId: node.id,
				content: node.content,
			},
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to update node content",
		};
	}
}
