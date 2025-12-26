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
import { createNode, getNode, updateNodeContent } from "@/lib/node-crud";

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

export interface ForkUserNodeInput {
	nodeId: string;
	newContent: string;
	positionX: number;
	positionY: number;
}

export interface ActionState<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// Re-export GraphData types for client components
export type { GraphData, GraphEdge, GraphNode } from "@/lib/graph-retrieval";

// Re-export ContextBuilder types for client components
export type { ContextMessage, ContextResult } from "@/lib/context-builder";

// ============================================================================
// Server Actions
// ============================================================================

import type { ContextResult } from "@/lib/context-builder";

/**
 * UI-004: Builds conversation context from root to target node.
 *
 * This Server Action wraps SVC-001's buildConversationContext for client components.
 * Used by ThreadView to display linear conversation flow.
 *
 * @param nodeId - The target node ID to build context to
 * @returns ActionState with context messages, path length, and token count
 *
 * @example
 * ```tsx
 * const result = await getConversationContextAction("node-uuid");
 * if (result.success) {
 *   const { messages, pathLength, totalTokens } = result.data;
 * }
 * ```
 */
export async function getConversationContextAction(
	nodeId: string,
): Promise<ActionState<ContextResult>> {
	try {
		const { buildConversationContext } = await import(
			"@/lib/context-builder"
		);
		const context = await buildConversationContext(nodeId);
		return {
			success: true,
			data: context,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to load conversation",
		};
	}
}

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

/**
 * UI-NEW-005: Forks a USER node to create a parallel branch.
 *
 * This Server Action creates a new USER node as a sibling of the original node,
 * preserving the original node's content (non-destructive editing).
 * It then triggers an AI response for the new USER node.
 *
 * Behavior:
 * - If original node has a parent: creates sibling (same parent)
 * - If original node is root (no parent): creates new root node
 * - Only USER nodes can be forked (ASSISTANT nodes will throw error)
 *
 * @param input - Fork node parameters
 * @returns ActionState with created node IDs or error
 *
 * @example
 * ```tsx
 * const result = await forkUserNodeAction({
 *   nodeId: "user-node-uuid",
 *   newContent: "Modified question",
 *   positionX: 400,
 *   positionY: 100
 * });
 * // result.data.userNodeId: ID of new USER node
 * // result.data.aiNodeId: ID of streaming ASSISTANT node (may be null initially)
 * ```
 */
export async function forkUserNodeAction(
	input: ForkUserNodeInput,
): Promise<ActionState<{ userNodeId: string; aiNodeId: string | null }>> {
	try {
		// 1. Get original node
		const originalNode = await getNode(input.nodeId);

		// 2. Validate it's a USER node (ASSISTANT nodes cannot be edited)
		if (originalNode.role !== "USER") {
			return {
				success: false,
				error: "Only USER nodes can be edited. ASSISTANT nodes are read-only.",
			};
		}

		// 3. Create new USER node as fork
		// - If original has parent: create sibling (same parent)
		// - If original is root: create new root (parentId = undefined)
		const newUserNode = await createNode({
			projectId: originalNode.projectId,
			parentId: originalNode.parentId ?? undefined, // Convert null to undefined for root nodes
			role: "USER",
			content: input.newContent,
			positionX: input.positionX,
			positionY: input.positionY,
			metadata: {
				forkedFrom: input.nodeId, // Track origin
			},
		});

		// 4. Build conversation context for AI response
		// Import dynamically to avoid circular dependency
		const { buildConversationContext, formatContextForAI } = await import(
			"@/lib/context-builder"
		);

		// Build context from the new USER node (includes all ancestors)
		const context = await buildConversationContext(newUserNode.id);
		const aiMessages = formatContextForAI(context);

		// 5. Trigger AI response using streamChatWithNode
		// This creates an ASSISTANT node as child of the new USER node
		const { streamChatWithNode } = await import("@/lib/ai-stream");
		const aiPositionY = input.positionY + 150; // Position below USER node

		const aiResult = await streamChatWithNode({
			messages: aiMessages,
			projectId: originalNode.projectId,
			parentId: newUserNode.id,
			positionX: input.positionX,
			positionY: aiPositionY,
			metadata: {
				forkedBranch: true, // Mark as part of a forked branch
			},
		});

		// 6. Revalidate workspace page to refresh node data
		revalidatePath("/workspace");

		return {
			success: true,
			data: {
				userNodeId: newUserNode.id,
				aiNodeId: aiResult.nodeId, // ID of the streaming ASSISTANT node
			},
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to fork node",
		};
	}
}
