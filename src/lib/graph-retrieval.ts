/**
 * API-002: Graph Retrieval Service
 *
 * Retrieves the complete graph structure for a project, including:
 * - Node content and metadata
 * - Position information (x, y coordinates)
 * - Connection relationships (parent-child edges)
 *
 * This is used by the frontend canvas to render the conversation tree.
 */

import { prisma } from "./prisma";

export type GraphNode = {
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

export type GraphEdge = {
	id: string; // Unique edge identifier (source-target format)
	source: string; // Parent node ID
	target: string; // Child node ID
};

export type GraphData = {
	nodes: GraphNode[];
	edges: GraphEdge[];
	rootNodeId: string | null;
};

type RawGraphNode = {
	id: string;
	projectId: string;
	parentId: string | null;
	role: string;
	content: string;
	positionX: number;
	positionY: number;
	metadata: unknown;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Retrieves the complete graph structure for a project.
 *
 * Fetches all nodes in a project and builds the edge list from
 * parent-child relationships. Suitable for React Flow or similar
 * canvas rendering libraries.
 *
 * @param projectId - The project ID to retrieve the graph for
 * @returns Promise<GraphData> with nodes array, edges array, and root node ID
 *
 * @example
 * ```ts
 * const graph = await getProjectGraph("project-uuid");
 * // Returns:
 * // {
 * //   nodes: [
 * //     { id: "node1", role: "USER", content: "Hello", positionX: 0, positionY: 0, ... },
 * //     { id: "node2", role: "ASSISTANT", content: "Hi!", positionX: 0, positionY: 100, ... }
 * //   ],
 * //   edges: [
 * //     { id: "node1-node2", source: "node1", target: "node2" }
 * //   ],
 * //   rootNodeId: "node1"
 * // }
 * ```
 */
export async function getProjectGraph(projectId: string): Promise<GraphData> {
	// Validate UUID format
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(projectId)) {
		throw new Error(`Invalid projectId format: ${projectId}`);
	}

	// Fetch project with root node info
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true, rootNodeId: true },
	});

	if (!project) {
		throw new Error(`Project not found: ${projectId}`);
	}

	// Fetch all nodes for the project using raw query for better performance
	const rawNodes = await prisma.$queryRaw<RawGraphNode[]>`
		SELECT
			id,
			"projectId",
			"parentId",
			role,
			content,
			"positionX",
			"positionY",
			metadata,
			"createdAt",
			"updatedAt"
		FROM "nodes"
		WHERE "projectId" = ${projectId}::text
		ORDER BY "createdAt" ASC
	`;

	// Convert to GraphNode format
	const nodes: GraphNode[] = rawNodes.map((row) => ({
		id: row.id,
		projectId: row.projectId,
		parentId: row.parentId,
		role: row.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: row.content,
		positionX: Number(row.positionX),
		positionY: Number(row.positionY),
		metadata: row.metadata,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}));

	// Build edges from parent-child relationships
	const edges: GraphEdge[] = [];
	for (const node of nodes) {
		if (node.parentId) {
			edges.push({
				id: `${node.parentId}-${node.id}`,
				source: node.parentId,
				target: node.id,
			});
		}
	}

	return {
		nodes,
		edges,
		rootNodeId: project.rootNodeId,
	};
}

/**
 * Retrieves a subgraph starting from a specific node.
 *
 * Useful for lazy loading or showing only a portion of the tree.
 * Returns the target node and all its descendants.
 *
 * @param nodeId - The root node ID of the subgraph
 * @returns Promise<GraphData> with nodes, edges, and the specified node as root
 *
 * @example
 * ```ts
 * const subgraph = await getNodeSubgraph("node-uuid");
 * // Returns the node and all its descendants
 * ```
 */
export async function getNodeSubgraph(nodeId: string): Promise<GraphData> {
	// Validate UUID format
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(nodeId)) {
		throw new Error(`Invalid nodeId format: ${nodeId}`);
	}

	// Verify node exists and get projectId
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { id: true, projectId: true },
	});

	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}

	// Use recursive CTE to fetch all descendants
	const rawNodes = await prisma.$queryRaw<
		Array<RawGraphNode & { depth: number }>
	>`
		WITH RECURSIVE node_tree AS (
			-- Base case: start from the target node
			SELECT
				id,
				"projectId",
				"parentId",
				role,
				content,
				"positionX",
				"positionY",
				metadata,
				"createdAt",
				"updatedAt",
				0 as depth
			FROM "nodes"
			WHERE id = ${nodeId}::text

			UNION ALL

			-- Recursive case: traverse down to children
			SELECT
				n.id,
				n."projectId",
				n."parentId",
				n.role,
				n.content,
				n."positionX",
				n."positionY",
				n.metadata,
				n."createdAt",
				n."updatedAt",
				nt.depth + 1
			FROM "nodes" n
			INNER JOIN node_tree nt ON n."parentId" = nt.id
		)
		SELECT
			id,
			"projectId",
			"parentId",
			role,
			content,
			"positionX",
			"positionY",
			metadata,
			"createdAt",
			"updatedAt",
			depth
		FROM node_tree
		ORDER BY depth ASC, "createdAt" ASC
	`;

	// Convert to GraphNode format
	const nodes: GraphNode[] = rawNodes.map((row) => ({
		id: row.id,
		projectId: row.projectId,
		parentId: row.parentId,
		role: row.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: row.content,
		positionX: Number(row.positionX),
		positionY: Number(row.positionY),
		metadata: row.metadata,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}));

	// Build edges from parent-child relationships
	// Only create edges where both source and target are in the result set
	const nodeIds = new Set(nodes.map((n) => n.id));
	const edges: GraphEdge[] = [];
	for (const row of rawNodes) {
		if (row.parentId && nodeIds.has(row.parentId)) {
			edges.push({
				id: `${row.parentId}-${row.id}`,
				source: row.parentId,
				target: row.id,
			});
		}
	}

	return {
		nodes,
		edges,
		rootNodeId: nodeId,
	};
}

/**
 * Retrieves node statistics for a project.
 *
 * Useful for dashboard displays and analytics.
 *
 * @param projectId - The project ID to get statistics for
 * @returns Promise with node counts by role and tree depth
 */
export async function getProjectGraphStats(projectId: string): Promise<{
	totalNodes: number;
	nodeCountsByRole: Record<string, number>;
	maxDepth: number;
	leafNodeCount: number;
}> {
	// Validate UUID format
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(projectId)) {
		throw new Error(`Invalid projectId format: ${projectId}`);
	}

	// Verify project exists
	const project = await prisma.project.findUnique({
		where: { id: projectId },
		select: { id: true },
	});

	if (!project) {
		throw new Error(`Project not found: ${projectId}`);
	}

	// Get all nodes with their depth from root
	const result = await prisma.$queryRaw<
		Array<{ role: string; depth: number | null; child_count: bigint }>
	>`
		WITH RECURSIVE node_depths AS (
			-- Base case: root nodes (no parent)
			SELECT
				id,
				role,
				0 as depth
			FROM "nodes"
			WHERE "projectId" = ${projectId}::text
				AND "parentId" IS NULL

			UNION ALL

			-- Recursive case: traverse down
			SELECT
				n.id,
				n.role,
				nd.depth + 1
			FROM "nodes" n
			INNER JOIN node_depths nd ON n."parentId" = nd.id
		)
		SELECT
			nd.role,
			nd.depth,
			COUNT(c.id) as child_count
		FROM node_depths nd
		LEFT JOIN "nodes" c ON c."parentId" = nd.id
		GROUP BY nd.role, nd.depth, nd.id
	`;

	const nodeCountsByRole: Record<string, number> = {
		SYSTEM: 0,
		USER: 0,
		ASSISTANT: 0,
	};
	let maxDepth = 0;
	let leafNodeCount = 0;

	for (const row of result) {
		const role = row.role as keyof typeof nodeCountsByRole;
		if (nodeCountsByRole[role] !== undefined) {
			nodeCountsByRole[role]++;
		}

		if (row.depth !== null && row.depth > maxDepth) {
			maxDepth = row.depth;
		}

		if (row.child_count === 0n) {
			leafNodeCount++;
		}
	}

	return {
		totalNodes: result.length,
		nodeCountsByRole,
		maxDepth,
		leafNodeCount,
	};
}
