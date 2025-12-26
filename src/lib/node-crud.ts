/**
 * API-003: Node CRUD Service
 *
 * Provides create, read, update, and delete operations for nodes.
 * Supports position persistence for canvas drag operations.
 *
 * Key features:
 * - Create nodes with parent-child relationships
 * - Update node content and position independently
 * - Batch operations for multiple nodes
 * - Cascade delete for entire subtrees
 */

import { prisma } from "./prisma";

// ============================================================================
// Type Definitions
// ============================================================================

export type CreateNodeInput = {
	projectId: string;
	role: "SYSTEM" | "USER" | "ASSISTANT";
	content: string;
	parentId?: string;
	positionX?: number;
	positionY?: number;
	metadata?: unknown;
};

export type UpdateNodeInput = {
	content?: string;
	positionX?: number;
	positionY?: number;
	metadata?: unknown;
};

export type UpdateNodePositionInput = {
	positionX: number;
	positionY: number;
};

export type UpdateNodeContentInput = {
	content: string;
	metadata?: unknown;
};

export type BatchUpdatePositionInput = Array<{
	nodeId: string;
	positionX: number;
	positionY: number;
}>;

export type NodeResult = {
	id: string;
	projectId: string;
	parentId: string | null;
	role: "SYSTEM" | "USER" | "ASSISTANT";
	content: string;
	positionX: number;
	positionY: number;
	metadata: unknown;
	createdAt: Date;
	updatedAt: Date;
};

export type BatchOperationResult = {
	success: boolean;
	nodeId: string;
	error?: string;
};

// ============================================================================
// Validation Helpers
// ============================================================================

function validateUUID(id: string, fieldName: string): void {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(id)) {
		throw new Error(`Invalid ${fieldName} format: ${id}`);
	}
}

async function validateProjectExists(projectId: string): Promise<void> {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true },
	});
	if (!project) {
		throw new Error(`Project not found: ${projectId}`);
	}
}

async function validateNodeExists(nodeId: string): Promise<void> {
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { id: true },
	});
	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}
}

async function validateParentInProject(
	parentId: string,
	projectId: string,
): Promise<void> {
	const parent = await prisma.node.findUnique({
		where: { id: parentId },
		select: { id: true, projectId: true },
	});
	if (!parent) {
		throw new Error(`Parent node not found: ${parentId}`);
	}
	if (parent.projectId !== projectId) {
		throw new Error(
			`Parent node ${parentId} does not belong to project ${projectId}`,
		);
	}
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Creates a new node in the specified project.
 *
 * @param input - Node creation parameters
 * @returns Promise<NodeResult> with the created node data
 *
 * @example
 * ```ts
 * const node = await createNode({
 *   projectId: "project-uuid",
 *   role: "USER",
 *   content: "Hello, world!",
 *   parentId: "parent-node-uuid", // optional
 *   positionX: 100,
 *   positionY: 200
 * });
 * ```
 */
export async function createNode(input: CreateNodeInput): Promise<NodeResult> {
	// Validate UUIDs
	validateUUID(input.projectId, "projectId");
	if (input.parentId) {
		validateUUID(input.parentId, "parentId");
	}

	// Validate project exists
	await validateProjectExists(input.projectId);

	// Validate parent exists and belongs to project
	if (input.parentId) {
		await validateParentInProject(input.parentId, input.projectId);
	}

	// Create the node
	const node = await prisma.node.create({
		data: {
			projectId: input.projectId,
			parentId: input.parentId,
			role: input.role,
			content: input.content,
			positionX: input.positionX ?? 0,
			positionY: input.positionY ?? 0,
			metadata: input.metadata ?? {},
		},
	});

	// Update project root node if this is the first node
	const projectNodeCount = await prisma.node.count({
		where: { projectId: input.projectId },
	});
	if (projectNodeCount === 1) {
		await prisma.project.update({
			where: { id: input.projectId },
			data: { rootNodeId: node.id },
		});
	}

	return {
		id: node.id,
		projectId: node.projectId,
		parentId: node.parentId,
		role: node.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: node.content,
		positionX: Number(node.positionX),
		positionY: Number(node.positionY),
		metadata: node.metadata,
		createdAt: node.createdAt,
		updatedAt: node.updatedAt,
	};
}

/**
 * Retrieves a single node by ID.
 *
 * @param nodeId - The node ID to retrieve
 * @returns Promise<NodeResult> with the node data
 *
 * @example
 * ```ts
 * const node = await getNode("node-uuid");
 * ```
 */
export async function getNode(nodeId: string): Promise<NodeResult> {
	validateUUID(nodeId, "nodeId");

	const node = await prisma.node.findUnique({
		where: { id: nodeId },
	});

	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}

	return {
		id: node.id,
		projectId: node.projectId,
		parentId: node.parentId,
		role: node.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: node.content,
		positionX: Number(node.positionX),
		positionY: Number(node.positionY),
		metadata: node.metadata,
		createdAt: node.createdAt,
		updatedAt: node.updatedAt,
	};
}

/**
 * Updates a node's content and/or position.
 *
 * Use updateNodePosition() or updateNodeContent() for partial updates.
 *
 * @param nodeId - The node ID to update
 * @param input - Fields to update (all optional)
 * @returns Promise<NodeResult> with the updated node data
 *
 * @example
 * ```ts
 * const updated = await updateNode("node-uuid", {
 *   content: "Updated message",
 *   positionX: 150,
 *   positionY: 250
 * });
 * ```
 */
export async function updateNode(
	nodeId: string,
	input: UpdateNodeInput,
): Promise<NodeResult> {
	validateUUID(nodeId, "nodeId");
	await validateNodeExists(nodeId);

	const node = await prisma.node.update({
		where: { id: nodeId },
		data: {
			...(input.content !== undefined ? { content: input.content } : {}),
			...(input.positionX !== undefined ? { positionX: input.positionX } : {}),
			...(input.positionY !== undefined ? { positionY: input.positionY } : {}),
			...(input.metadata !== undefined
				? {
						// biome-ignore lint/suspicious/noExplicitAny: Prisma JsonValue type compatibility
						metadata: input.metadata as any,
					}
				: {}),
		},
	});

	return {
		id: node.id,
		projectId: node.projectId,
		parentId: node.parentId,
		role: node.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: node.content,
		positionX: Number(node.positionX),
		positionY: Number(node.positionY),
		metadata: node.metadata,
		createdAt: node.createdAt,
		updatedAt: node.updatedAt,
	};
}

/**
 * Updates only the position of a node.
 *
 * Optimized for drag-drop operations where only position changes.
 *
 * @param nodeId - The node ID to update
 * @param input - New position coordinates
 * @returns Promise<NodeResult> with the updated node data
 *
 * @example
 * ```ts
 * const updated = await updateNodePosition("node-uuid", {
 *   positionX: 300,
 *   positionY: 400
 * });
 * ```
 */
export async function updateNodePosition(
	nodeId: string,
	input: UpdateNodePositionInput,
): Promise<NodeResult> {
	validateUUID(nodeId, "nodeId");
	await validateNodeExists(nodeId);

	const node = await prisma.node.update({
		where: { id: nodeId },
		data: {
			positionX: input.positionX,
			positionY: input.positionY,
		},
	});

	return {
		id: node.id,
		projectId: node.projectId,
		parentId: node.parentId,
		role: node.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: node.content,
		positionX: Number(node.positionX),
		positionY: Number(node.positionY),
		metadata: node.metadata,
		createdAt: node.createdAt,
		updatedAt: node.updatedAt,
	};
}

/**
 * Updates only the content of a node.
 *
 * Optimized for edit operations where only content changes.
 *
 * @param nodeId - The node ID to update
 * @param input - New content and optional metadata
 * @returns Promise<NodeResult> with the updated node data
 *
 * @example
 * ```ts
 * const updated = await updateNodeContent("node-uuid", {
 *   content: "Edited message"
 * });
 * ```
 */
export async function updateNodeContent(
	nodeId: string,
	input: UpdateNodeContentInput,
): Promise<NodeResult> {
	validateUUID(nodeId, "nodeId");
	await validateNodeExists(nodeId);

	const node = await prisma.node.update({
		where: { id: nodeId },
		data: {
			content: input.content,
			...(input.metadata !== undefined
				? {
						// biome-ignore lint/suspicious/noExplicitAny: Prisma JsonValue type compatibility
						metadata: input.metadata as any,
					}
				: {}),
		},
	});

	return {
		id: node.id,
		projectId: node.projectId,
		parentId: node.parentId,
		role: node.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: node.content,
		positionX: Number(node.positionX),
		positionY: Number(node.positionY),
		metadata: node.metadata,
		createdAt: node.createdAt,
		updatedAt: node.updatedAt,
	};
}

/**
 * Deletes a node and all its descendants (cascade delete).
 *
 * WARNING: This is a destructive operation. All child nodes
 * will be deleted recursively.
 *
 * @param nodeId - The node ID to delete
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await deleteNode("node-uuid");
 * // Node and all children are deleted
 * ```
 */
export async function deleteNode(nodeId: string): Promise<void> {
	validateUUID(nodeId, "nodeId");

	// Check if node exists
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { id: true, projectId: true },
	});

	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}

	// Delete the node (cascade delete handles children via Prisma schema)
	await prisma.node.delete({
		where: { id: nodeId },
	});

	// Update project root node if we deleted the root
	const remainingNodes = await prisma.node.findMany({
		where: { projectId: node.projectId, parentId: null },
		take: 1,
	});

	if (remainingNodes.length === 0) {
		await prisma.project.update({
			where: { id: node.projectId },
			data: { rootNodeId: null },
		});
	}
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Creates multiple nodes in a single transaction.
 *
 * Useful for bulk operations like importing conversations.
 *
 * @param inputs - Array of node creation parameters
 * @returns Promise<Array<NodeResult>> with created nodes
 *
 * @example
 * ```ts
 * const nodes = await batchCreateNodes([
 *   { projectId: "proj-uuid", role: "USER", content: "First" },
 *   { projectId: "proj-uuid", role: "ASSISTANT", content: "Response" }
 * ]);
 * ```
 */
export async function batchCreateNodes(
	inputs: CreateNodeInput[],
): Promise<NodeResult[]> {
	const results: NodeResult[] = [];

	// Use transaction for atomicity
	await prisma.$transaction(async (tx) => {
		for (const input of inputs) {
			validateUUID(input.projectId, "projectId");
			if (input.parentId) {
				validateUUID(input.parentId, "parentId");
				await validateParentInProject(input.parentId, input.projectId);
			}

			const node = await tx.node.create({
				data: {
					projectId: input.projectId,
					parentId: input.parentId,
					role: input.role,
					content: input.content,
					positionX: input.positionX ?? 0,
					positionY: input.positionY ?? 0,
					metadata: input.metadata ?? {},
				},
			});

			results.push({
				id: node.id,
				projectId: node.projectId,
				parentId: node.parentId,
				role: node.role as "SYSTEM" | "USER" | "ASSISTANT",
				content: node.content,
				positionX: Number(node.positionX),
				positionY: Number(node.positionY),
				metadata: node.metadata,
				createdAt: node.createdAt,
				updatedAt: node.updatedAt,
			});
		}
	});

	return results;
}

/**
 * Updates positions for multiple nodes in a single transaction.
 *
 * Optimized for auto-layout operations that reposition many nodes.
 *
 * @param inputs - Array of node ID and position pairs
 * @returns Promise<BatchOperationResult[]> with operation results
 *
 * @example
 * ```ts
 * const results = await batchUpdatePositions([
 *   { nodeId: "node1", positionX: 100, positionY: 200 },
 *   { nodeId: "node2", positionX: 100, positionY: 300 }
 * ]);
 * ```
 */
export async function batchUpdatePositions(
	inputs: BatchUpdatePositionInput,
): Promise<BatchOperationResult[]> {
	const results: BatchOperationResult[] = [];

	// Use transaction for atomicity
	await prisma.$transaction(async (tx) => {
		for (const input of inputs) {
			try {
				validateUUID(input.nodeId, "nodeId");

				await tx.node.update({
					where: { id: input.nodeId },
					data: {
						positionX: input.positionX,
						positionY: input.positionY,
					},
				});

				results.push({ success: true, nodeId: input.nodeId });
			} catch (error) {
				results.push({
					success: false,
					nodeId: input.nodeId,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}
	});

	return results;
}
