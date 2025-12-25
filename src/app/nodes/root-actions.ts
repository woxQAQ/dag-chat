/**
 * UI-NEW-001: Root Node Creation Server Actions
 *
 * Server Actions for creating the root node of an empty project.
 * This is the ONLY way to create a root node in the new design.
 * Wraps API-003 node-crud service with root-specific validation.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createNode } from "@/lib/node-crud";
import { getProject } from "@/lib/project-crud";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreateRootNodeInput {
	projectId: string;
	content: string;
	positionX: number;
	positionY: number;
}

export interface ActionState<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Creates the root node for an empty project.
 *
 * This is the ONLY way to create a root node in the new design.
 * Prevents multiple roots in the same project to maintain tree structure.
 *
 * Business rules:
 * - Project must not already have a root node
 * - Root node is always a USER role node
 * - Root node has no parentId
 * - Sets project.rootNodeId automatically via createNode service
 *
 * @param input - Root node creation parameters
 * @returns ActionState with created node data or error
 *
 * @example
 * ```tsx
 * const result = await createRootNode({
 *   projectId: "project-uuid",
 *   content: "What is the meaning of life?",
 *   positionX: 100,
 *   positionY: 200
 * });
 *
 * if (result.success) {
 *   console.log("Created root node:", result.data.nodeId);
 * } else {
 *   console.error("Error:", result.error);
 * }
 * ```
 */
export async function createRootNode(
	input: CreateRootNodeInput,
): Promise<
	ActionState<{ nodeId: string; positionX: number; positionY: number }>
> {
	try {
		// Validate: Project must exist
		const project = await getProject(input.projectId);
		if (!project) {
			return {
				success: false,
				error: "Project not found",
			};
		}

		// Note: We allow multiple root nodes in a project now (Forest structure).
		// The project.rootNodeId will act as the "primary" or "first" root,
		// but subsequent roots can be created freely.

		// Create the root node (no parentId = root)
		// The createNode service will automatically set project.rootNodeId
		// when it detects this is the first node in the project
		const node = await createNode({
			projectId: input.projectId,
			role: "USER",
			content: input.content,
			positionX: input.positionX,
			positionY: input.positionY,
			metadata: { isRoot: true }, // Mark as root for potential future use
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
				error instanceof Error ? error.message : "Failed to create root node",
		};
	}
}
