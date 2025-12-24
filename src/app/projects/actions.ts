/**
 * API-001: Server Actions for Project Management
 *
 * This file provides Server Actions for Next.js App Router to manage projects.
 * Server Actions allow you to call server-side code directly from components.
 *
 * Key features:
 * - Create, read, update, delete projects
 * - List projects with pagination
 * - Get project statistics
 * - Form validation and error handling
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getProjects } from "@/app/projects/actions";
 *
 * const projects = await getProjects();
 * ```
 *
 * @example
 * ```tsx
 * // In a Client Component
 * import { createProject } from "@/app/projects/actions";
 *
 * <form action={createProject}>
 *   <input name="name" />
 *   <button type="submit">Create</button>
 * </form>
 * ```
 */

"use server";

import {
	createProject as createProjectCrud,
	getProject as getProjectCrud,
	listProjects as listProjectsCrud,
	updateProject as updateProjectCrud,
	deleteProject as deleteProjectCrud,
	getProjectStats as getProjectStatsCrud,
	listProjectsWithStats as listProjectsWithStatsCrud,
	type ProjectResult,
	type ProjectListResult,
	type ProjectStats,
} from "@/lib/project-crud";

// ============================================================================
// Type Definitions
// ============================================================================

export type CreateProjectFormData = {
	name?: string;
	description?: string;
};

export type UpdateProjectFormData = {
	name?: string;
	description?: string;
};

export type ListProjectsOptions = {
	skip?: number;
	take?: number;
	orderBy?: "createdAt" | "updatedAt";
	orderDirection?: "asc" | "desc";
};

export type ActionState<T = void> = {
	success: boolean;
	data?: T;
	error?: string;
};

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Creates a new project.
 *
 * This Server Action can be called directly from a form or from client code.
 *
 * @param formData - Form data with optional name and description
 * @returns Promise<ActionState<ProjectResult>> with created project or error
 *
 * @example
 * ```tsx
 * // In a Client Component with form
 * <form action={createProject}>
 *   <input name="name" placeholder="Project name" />
 *   <textarea name="description" placeholder="Description" />
 *   <button type="submit">Create Project</button>
 * </form>
 * ```
 *
 * @example
 * ```tsx
 * // In a Client Component with direct call
 * const result = await createProject({ name: "My Project" });
 * if (result.success) {
 *   console.log(result.data.id);
 * }
 * ```
 */
export async function createProject(
	formData: CreateProjectFormData,
): Promise<ActionState<ProjectResult>> {
	try {
		const project = await createProjectCrud({
			name: formData.name,
			description: formData.description,
		});

		return { success: true, data: project };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create project",
		};
	}
}

/**
 * Gets a single project by ID.
 *
 * This function can be used in Server Components to fetch project data.
 *
 * @param projectId - The project ID to retrieve
 * @param withStats - Whether to include node count statistics
 * @returns Promise<ActionState<ProjectResult>> with project data or error
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getProject } from "@/app/projects/actions";
 *
 * export default async function Page({ params }) {
 *   const result = await getProject(params.id);
 *
 *   if (!result.success) {
 *     return <div>{result.error}</div>;
 *   }
 *
 *   return <div>{result.data.name}</div>;
 * }
 * ```
 */
export async function getProject(
	projectId: string,
	withStats = false,
): Promise<ActionState<ProjectResult>> {
	try {
		const project = await getProjectCrud(projectId, withStats);
		return { success: true, data: project };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to get project",
		};
	}
}

/**
 * Lists all projects with pagination and sorting.
 *
 * This function can be used in Server Components to fetch project lists.
 *
 * @param options - Pagination and sorting options
 * @returns Promise<ActionState<ProjectListResult>> with projects list or error
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { listProjects } from "@/app/projects/actions";
 *
 * export default async function Page() {
 *   const result = await listProjects({ take: 10 });
 *
 *   if (!result.success) {
 *     return <div>{result.error}</div>;
 *   }
 *
 *   return (
 *     <ul>
 *       {result.data.projects.map(p => (
 *         <li key={p.id}>{p.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export async function listProjects(
	options: ListProjectsOptions = {},
): Promise<ActionState<ProjectListResult>> {
	try {
		const result = await listProjectsCrud(options);
		return { success: true, data: result };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to list projects",
		};
	}
}

/**
 * Lists projects with node count statistics.
 *
 * This is a convenience function that combines listProjects with stats.
 *
 * @param options - Pagination and sorting options
 * @returns Promise<ActionState<ProjectListResult>> with projects including node counts or error
 *
 * @example
 * ```tsx
 * import { listProjectsWithStats } from "@/app/projects/actions";
 *
 * const result = await listProjectsWithStats({ take: 20 });
 * result.data.projects.forEach(p => {
 *   console.log(`${p.name}: ${p._nodeCount} nodes`);
 * });
 * ```
 */
export async function listProjectsWithStats(
	options: ListProjectsOptions = {},
): Promise<ActionState<ProjectListResult>> {
	try {
		const result = await listProjectsWithStatsCrud(options);
		return { success: true, data: result };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to list projects with stats",
		};
	}
}

/**
 * Updates a project's name and/or description.
 *
 * This Server Action can be called from a form or client code.
 *
 * @param projectId - The project ID to update
 * @param formData - Form data with optional name and description
 * @returns Promise<ActionState<ProjectResult>> with updated project or error
 *
 * @example
 * ```tsx
 * // In a Client Component
 * import { updateProject } from "@/app/projects/actions";
 *
 * <form action={(formData) => updateProject(projectId, formData)}>
 *   <input name="name" defaultValue={project.name} />
 *   <textarea name="description" defaultValue={project.description || ""} />
 *   <button type="submit">Save Changes</button>
 * </form>
 * ```
 */
export async function updateProject(
	projectId: string,
	formData: UpdateProjectFormData,
): Promise<ActionState<ProjectResult>> {
	try {
		const project = await updateProjectCrud(projectId, {
			name: formData.name,
			description: formData.description,
		});

		return { success: true, data: project };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to update project",
		};
	}
}

/**
 * Deletes a project and all its nodes.
 *
 * WARNING: This is a destructive operation. All nodes in the project
 * will be deleted.
 *
 * @param projectId - The project ID to delete
 * @returns Promise<ActionState> indicating success or failure
 *
 * @example
 * ```tsx
 * // In a Client Component
 * import { deleteProject } from "@/app/projects/actions";
 *
 * <button
 *   onClick={async () => {
 *     const result = await deleteProject(projectId);
 *     if (result.success) {
 *       router.push("/projects");
 *     }
 *   }}
 * >
 *   Delete Project
 * </button>
 * ```
 */
export async function deleteProject(
	projectId: string,
): Promise<ActionState> {
	try {
		await deleteProjectCrud(projectId);
		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to delete project",
		};
	}
}

/**
 * Gets detailed statistics for a project.
 *
 * @param projectId - The project ID to get statistics for
 * @returns Promise<ActionState<ProjectStats>> with project statistics or error
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { getProjectStats } from "@/app/projects/actions";
 *
 * export default async function ProjectStats({ params }) {
 *   const result = await getProjectStats(params.id);
 *
 *   if (!result.success) {
 *     return <div>{result.error}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Total Nodes: {result.data.totalNodes}</p>
 *       <p>Max Depth: {result.data.maxDepth}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export async function getProjectStats(
	projectId: string,
): Promise<ActionState<ProjectStats>> {
	try {
		const stats = await getProjectStatsCrud(projectId);
		return { success: true, data: stats };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to get project stats",
		};
	}
}

// ============================================================================
// Re-exports
// ============================================================================

/**
 * @deprecated Use `createProject` action instead. For direct CRUD access, import from `@/lib/project-crud`.
 */
export { createProject as createProjectCrud } from "@/lib/project-crud";

/**
 * @deprecated Use `getProject` action instead. For direct CRUD access, import from `@/lib/project-crud`.
 */
export { getProject as getProjectCrud } from "@/lib/project-crud";

/**
 * @deprecated Use `listProjects` action instead. For direct CRUD access, import from `@/lib/project-crud`.
 */
export { listProjects as listProjectsCrud } from "@/lib/project-crud";

/**
 * @deprecated Use `updateProject` action instead. For direct CRUD access, import from `@/lib/project-crud`.
 */
export { updateProject as updateProjectCrud } from "@/lib/project-crud";

/**
 * @deprecated Use `deleteProject` action instead. For direct CRUD access, import from `@/lib/project-crud`.
 */
export { deleteProject as deleteProjectCrud } from "@/lib/project-crud";

/**
 * @deprecated Use `getProjectStats` action instead. For direct CRUD access, import from `@/lib/project-crud`.
 */
export { getProjectStats as getProjectStatsCrud } from "@/lib/project-crud";

// Export types for consumer use
export type { ProjectResult, ProjectListResult, ProjectStats };
