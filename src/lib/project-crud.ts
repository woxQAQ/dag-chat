/**
 * API-001: Project CRUD Service
 *
 * Provides create, read, update, and delete operations for projects.
 * Supports Server Components and Server Actions for Next.js App Router.
 *
 * Key features:
 * - Create projects with optional name and description
 * - List projects with pagination and sorting
 * - Get single project by ID
 * - Update project name and description
 * - Delete projects (cascade deletes all nodes)
 * - Get project statistics
 */

import { prisma } from "./prisma";

// ============================================================================
// Type Definitions
// ============================================================================

export type CreateProjectInput = {
	name?: string;
	description?: string;
};

export type UpdateProjectInput = {
	name?: string;
	description?: string;
};

export type ListProjectsOptions = {
	/**
	 * Number of items to skip (for pagination)
	 * @default 0
	 */
	skip?: number;
	/**
	 * Number of items to return
	 * @default 20
	 */
	take?: number;
	/**
	 * Sort order
	 * @default "updatedAt"
	 */
	orderBy?: "createdAt" | "updatedAt";
	/**
	 * Sort direction
	 * @default "desc"
	 */
	orderDirection?: "asc" | "desc";
};

export type ProjectResult = {
	id: string;
	name: string;
	description: string | null;
	rootNodeId: string | null;
	createdAt: Date;
	updatedAt: Date;
	_nodeCount?: number; // Optional: included when withStats is true
};

export type ProjectListResult = {
	projects: ProjectResult[];
	total: number;
	hasMore: boolean;
};

export type ProjectStats = {
	totalNodes: number;
	userNodes: number;
	assistantNodes: number;
	systemNodes: number;
	maxDepth: number;
	leafNodes: number;
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

function validateProjectName(name: string): void {
	if (!name || name.trim().length === 0) {
		throw new Error("Project name cannot be empty");
	}
	if (name.length > 100) {
		throw new Error("Project name cannot exceed 100 characters");
	}
}

function validateProjectDescription(description: string): void {
	if (description.length > 1000) {
		throw new Error("Project description cannot exceed 1000 characters");
	}
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Creates a new project.
 *
 * @param input - Project creation parameters
 * @returns Promise<ProjectResult> with the created project data
 *
 * @example
 * ```ts
 * const project = await createProject({
 *   name: "My Conversation",
 *   description: "A project about AI"
 * });
 * ```
 */
export async function createProject(
	input: CreateProjectInput = {},
): Promise<ProjectResult> {
	const name = input.name?.trim() ?? "Untitled Project";
	const description = input.description?.trim() ?? null;

	// Validate name
	validateProjectName(name);

	// Validate description if provided
	if (description) {
		validateProjectDescription(description);
	}

	const project = await prisma.project.create({
		data: {
			name,
			description,
		},
	});

	return {
		id: project.id,
		name: project.name,
		description: project.description,
		rootNodeId: project.rootNodeId,
		createdAt: project.createdAt,
		updatedAt: project.updatedAt,
	};
}

/**
 * Retrieves a single project by ID.
 *
 * @param projectId - The project ID to retrieve
 * @param withStats - Whether to include node count statistics
 * @returns Promise<ProjectResult> with the project data
 *
 * @example
 * ```ts
 * const project = await getProject("project-uuid");
 * const projectWithStats = await getProject("project-uuid", true);
 * ```
 */
export async function getProject(
	projectId: string,
	withStats = false,
): Promise<ProjectResult> {
	validateUUID(projectId, "projectId");

	const project = await prisma.project.findUnique({
		where: { id: projectId },
	});

	if (!project) {
		throw new Error(`Project not found: ${projectId}`);
	}

	const result: ProjectResult = {
		id: project.id,
		name: project.name,
		description: project.description,
		rootNodeId: project.rootNodeId,
		createdAt: project.createdAt,
		updatedAt: project.updatedAt,
	};

	if (withStats) {
		const nodeCount = await prisma.node.count({
			where: { projectId: project.id },
		});
		result._nodeCount = nodeCount;
	}

	return result;
}

/**
 * Lists all projects with pagination and sorting.
 *
 * @param options - Pagination and sorting options
 * @returns Promise<ProjectListResult> with projects array and metadata
 *
 * @example
 * ```ts
 * // Get first 20 projects, sorted by updatedAt desc
 * const result = await listProjects();
 *
 * // Get next page
 * const nextPage = await listProjects({ skip: 20, take: 20 });
 *
 * // Sort by creation date
 * const byDate = await listProjects({ orderBy: "createdAt", orderDirection: "desc" });
 * ```
 */
export async function listProjects(
	options: ListProjectsOptions = {},
): Promise<ProjectListResult> {
	const { skip = 0, take = 20, orderBy = "updatedAt", orderDirection = "desc" } =
		options;

	const [projects, total] = await Promise.all([
		prisma.project.findMany({
			skip,
			take,
			orderBy: { [orderBy]: orderDirection },
		}),
		prisma.project.count(),
	]);

	const hasMore = skip + projects.length < total;

	return {
		projects: projects.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			rootNodeId: p.rootNodeId,
			createdAt: p.createdAt,
			updatedAt: p.updatedAt,
		})),
		total,
		hasMore,
	};
}

/**
 * Updates a project's name and/or description.
 *
 * @param projectId - The project ID to update
 * @param input - Fields to update (all optional)
 * @returns Promise<ProjectResult> with the updated project data
 *
 * @example
 * ```ts
 * // Update only name
 * const updated = await updateProject("project-uuid", { name: "New Name" });
 *
 * // Update both name and description
 * const updated2 = await updateProject("project-uuid", {
 *   name: "New Name",
 *   description: "New description"
 * });
 * ```
 */
export async function updateProject(
	projectId: string,
	input: UpdateProjectInput,
): Promise<ProjectResult> {
	validateUUID(projectId, "projectId");
	await validateProjectExists(projectId);

	// Build update data with validation
	const updateData: Record<string, string> = {};

	if (input.name !== undefined) {
		const name = input.name.trim();
		validateProjectName(name);
		updateData.name = name;
	}

	if (input.description !== undefined) {
		const description = input.description?.trim() ?? "";
		// Convert empty string to null
		const finalDescription = description || null;
		if (finalDescription) {
			validateProjectDescription(finalDescription);
		}
		updateData.description = finalDescription;
	}

	if (Object.keys(updateData).length === 0) {
		// No updates requested, return existing project
		return getProject(projectId);
	}

	const project = await prisma.project.update({
		where: { id: projectId },
		data: updateData,
	});

	return {
		id: project.id,
		name: project.name,
		description: project.description,
		rootNodeId: project.rootNodeId,
		createdAt: project.createdAt,
		updatedAt: project.updatedAt,
	};
}

/**
 * Deletes a project and all its nodes (cascade delete).
 *
 * WARNING: This is a destructive operation. All nodes
 * in the project will be deleted.
 *
 * @param projectId - The project ID to delete
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await deleteProject("project-uuid");
 * // Project and all nodes are deleted
 * ```
 */
export async function deleteProject(projectId: string): Promise<void> {
	validateUUID(projectId, "projectId");

	// Verify project exists before deleting
	await validateProjectExists(projectId);

	// Delete project (cascade delete handles all nodes via Prisma schema)
	await prisma.project.delete({
		where: { id: projectId },
	});
}

// ============================================================================
// Statistics Operations
// ============================================================================

/**
 * Gets detailed statistics for a project.
 *
 * @param projectId - The project ID to get statistics for
 * @returns Promise<ProjectStats> with node statistics
 *
 * @example
 * ```ts
 * const stats = await getProjectStats("project-uuid");
 * console.log(`Total nodes: ${stats.totalNodes}`);
 * console.log(`Max depth: ${stats.maxDepth}`);
 * ```
 */
export async function getProjectStats(projectId: string): Promise<ProjectStats> {
	validateUUID(projectId, "projectId");
	await validateProjectExists(projectId);

	// Get total count and counts by role
	const [totalNodes, userNodes, assistantNodes, systemNodes] = await Promise.all([
		prisma.node.count({ where: { projectId } }),
		prisma.node.count({ where: { projectId, role: "USER" } }),
		prisma.node.count({ where: { projectId, role: "ASSISTANT" } }),
		prisma.node.count({ where: { projectId, role: "SYSTEM" } }),
	]);

	// Calculate max depth using recursive CTE
	const depthQuery = `
		WITH RECURSIVE node_depth AS (
			SELECT id, "parentId", 0 as depth
			FROM nodes
			WHERE "projectId" = $1::text AND "parentId" IS NULL
			UNION ALL
			SELECT n.id, n."parentId", nd.depth + 1
			FROM nodes n
			INNER JOIN node_depth nd ON n."parentId" = nd.id
			WHERE n."projectId" = $1::text
		)
		SELECT MAX(depth) as max_depth FROM node_depth
	`;

	const depthResult = (await prisma.$queryRawUnsafe<{ max_depth: bigint }[]>(
		depthQuery,
		projectId,
	)) as Array<{ max_depth: bigint | null }>;
	const maxDepth = depthResult[0]?.max_depth
		? Number(depthResult[0].max_depth)
		: 0;

	// Count leaf nodes (nodes with no children)
	const leafNodes = await prisma.node.count({
		where: {
			projectId,
			children: { none: {} },
		},
	});

	return {
		totalNodes,
		userNodes,
		assistantNodes,
		systemNodes,
		maxDepth,
		leafNodes,
	};
}

/**
 * Gets projects with their node counts included.
 *
 * Convenience function that combines listProjects with stats.
 *
 * @param options - Pagination and sorting options
 * @returns Promise<ProjectListResult> with projects including node counts
 *
 * @example
 * ```ts
 * const result = await listProjectsWithStats();
 * result.projects.forEach(p => {
 *   console.log(`${p.name}: ${p._nodeCount} nodes`);
 * });
 * ```
 */
export async function listProjectsWithStats(
	options: ListProjectsOptions = {},
): Promise<ProjectListResult> {
	const { skip = 0, take = 20, orderBy = "updatedAt", orderDirection = "desc" } =
		options;

	const [projects, total] = await Promise.all([
		prisma.project.findMany({
			skip,
			take,
			orderBy: { [orderBy]: orderDirection },
		}),
		prisma.project.count(),
	]);

	const projectsWithStats = await Promise.all(
		projects.map(async (p) => {
			const nodeCount = await prisma.node.count({
				where: { projectId: p.id },
			});
			return {
				id: p.id,
				name: p.name,
				description: p.description,
				rootNodeId: p.rootNodeId,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
				_nodeCount: nodeCount,
			};
		}),
	);

	const hasMore = skip + projectsWithStats.length < total;

	return {
		projects: projectsWithStats,
		total,
		hasMore,
	};
}
