/**
 * Tests for API-001: Project CRUD Service
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
	createProject,
	getProject,
	listProjects,
	updateProject,
	deleteProject,
	getProjectStats,
	listProjectsWithStats,
	type CreateProjectInput,
	type UpdateProjectInput,
	type ListProjectsOptions,
} from "./project-crud";
import { prisma } from "./prisma";

describe("Project CRUD Service", () => {
	// Clean up database before each test
	beforeEach(async () => {
		// Delete all nodes first (cascade from projects)
		await prisma.node.deleteMany({});
		// Then delete all projects
		await prisma.project.deleteMany({});
	});

	// ============================================================================
	// Create Project Tests
	// ============================================================================
	describe("createProject", () => {
		it("should create a project with default name", async () => {
			const result = await createProject();

			expect(result).toHaveProperty("id");
			expect(result.name).toBe("Untitled Project");
			expect(result.description).toBeNull();
			expect(result.rootNodeId).toBeNull();
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it("should create a project with custom name", async () => {
			const input: CreateProjectInput = {
				name: "My Test Project",
			};
			const result = await createProject(input);

			expect(result.name).toBe("My Test Project");
		});

		it("should create a project with name and description", async () => {
			const input: CreateProjectInput = {
				name: "AI Conversation",
				description: "A project about artificial intelligence",
			};
			const result = await createProject(input);

			expect(result.name).toBe("AI Conversation");
			expect(result.description).toBe("A project about artificial intelligence");
		});

		it("should trim whitespace from name", async () => {
			const result = await createProject({ name: "  Spaced Name  " });

			expect(result.name).toBe("Spaced Name");
		});

		it("should trim whitespace from description", async () => {
			const result = await createProject({
				name: "Test",
				description: "  Spaced Description  ",
			});

			expect(result.description).toBe("Spaced Description");
		});

		it("should reject empty name", async () => {
			await expect(createProject({ name: "" })).rejects.toThrow(
				"Project name cannot be empty",
			);
		});

		it("should reject whitespace-only name", async () => {
			await expect(createProject({ name: "   " })).rejects.toThrow(
				"Project name cannot be empty",
			);
		});

		it("should reject name exceeding 100 characters", async () => {
			const longName = "a".repeat(101);
			await expect(createProject({ name: longName })).rejects.toThrow(
				"Project name cannot exceed 100 characters",
			);
		});

		it("should reject description exceeding 1000 characters", async () => {
			const longDesc = "a".repeat(1001);
			await expect(createProject({ description: longDesc })).rejects.toThrow(
				"Project description cannot exceed 1000 characters",
			);
		});
	});

	// ============================================================================
	// Get Project Tests
	// ============================================================================
	describe("getProject", () => {
		it("should retrieve a project by ID", async () => {
			const created = await createProject({ name: "Test Project" });
			const result = await getProject(created.id);

			expect(result.id).toBe(created.id);
			expect(result.name).toBe("Test Project");
		});

		it("should include node count when withStats is true", async () => {
			const project = await createProject({ name: "Stats Test" });

			// Create some nodes
			await prisma.node.create({
				data: {
					projectId: project.id,
					role: "USER",
					content: "Hello",
				},
			});
			await prisma.node.create({
				data: {
					projectId: project.id,
					role: "ASSISTANT",
					content: "Hi there",
					parentId: (
						await prisma.node.findFirst({
							where: { projectId: project.id },
						})
					)?.id,
				},
			});

			const result = await getProject(project.id, true);

			expect(result._nodeCount).toBe(2);
		});

		it("should not include node count when withStats is false", async () => {
			const project = await createProject({ name: "No Stats" });
			const result = await getProject(project.id, false);

			expect(result._nodeCount).toBeUndefined();
		});

		it("should throw error for invalid UUID format", async () => {
			await expect(getProject("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(getProject(fakeId)).rejects.toThrow("Project not found");
		});
	});

	// ============================================================================
	// List Projects Tests
	// ============================================================================
	describe("listProjects", () => {
		beforeEach(async () => {
			// Create some test projects
			await createProject({ name: "Project A" });
			await createProject({ name: "Project B" });
			await createProject({ name: "Project C" });
		});

		it("should list all projects with default options", async () => {
			const result = await listProjects();

			expect(result.projects).toHaveLength(3);
			expect(result.total).toBe(3);
			expect(result.hasMore).toBe(false);
		});

		it("should return correct hasMore flag", async () => {
			const result = await listProjects({ take: 2 });

			expect(result.projects).toHaveLength(2);
			expect(result.total).toBe(3);
			expect(result.hasMore).toBe(true);
		});

		it("should support pagination with skip", async () => {
			const page1 = await listProjects({ take: 2, skip: 0 });
			const page2 = await listProjects({ take: 2, skip: 2 });

			expect(page1.projects).toHaveLength(2);
			expect(page2.projects).toHaveLength(1);
			expect(page2.hasMore).toBe(false);
		});

		it("should sort by updatedAt desc by default", async () => {
			// Delete existing projects and create fresh ones with time gaps
			await prisma.project.deleteMany({});

			const proj1 = await createProject({ name: "Project 1" });
			// Add small delay to ensure different timestamps
			await new Promise((resolve) => setTimeout(resolve, 10));
			const proj2 = await createProject({ name: "Project 2" });
			await new Promise((resolve) => setTimeout(resolve, 10));
			const newProject = await createProject({ name: "Newest" });

			const result = await listProjects({ orderBy: "updatedAt", orderDirection: "desc" });

			expect(result.projects[0].id).toBe(newProject.id);
			expect(result.projects[1].id).toBe(proj2.id);
			expect(result.projects[2].id).toBe(proj1.id);
		});

		it("should sort by createdAt asc", async () => {
			const result = await listProjects({
				orderBy: "createdAt",
				orderDirection: "asc",
			});

			// Verify ascending order
			for (let i = 1; i < result.projects.length; i++) {
				expect(result.projects[i].createdAt.getTime()).toBeGreaterThanOrEqual(
					result.projects[i - 1].createdAt.getTime(),
				);
			}
		});

		it("should handle empty result set", async () => {
			// Clear all projects
			await prisma.project.deleteMany({});

			const result = await listProjects();

			expect(result.projects).toHaveLength(0);
			expect(result.total).toBe(0);
			expect(result.hasMore).toBe(false);
		});
	});

	// ============================================================================
	// Update Project Tests
	// ============================================================================
	describe("updateProject", () => {
		it("should update project name", async () => {
			const project = await createProject({ name: "Original Name" });
			const result = await updateProject(project.id, { name: "Updated Name" });

			expect(result.name).toBe("Updated Name");
		});

		it("should update project description", async () => {
			const project = await createProject({ name: "Test" });
			const result = await updateProject(project.id, {
				description: "New description",
			});

			expect(result.description).toBe("New description");
		});

		it("should update both name and description", async () => {
			const project = await createProject({
				name: "Original",
				description: "Original desc",
			});
			const result = await updateProject(project.id, {
				name: "Updated",
				description: "Updated desc",
			});

			expect(result.name).toBe("Updated");
			expect(result.description).toBe("Updated desc");
		});

		it("should set description to null when empty string provided", async () => {
			const project = await createProject({
				name: "Test",
				description: "Has description",
			});
			const result = await updateProject(project.id, { description: "" });

			expect(result.description).toBeNull();
		});

		it("should trim whitespace from updated name", async () => {
			const project = await createProject({ name: "Original" });
			const result = await updateProject(project.id, { name: "  Updated  " });

			expect(result.name).toBe("Updated");
		});

		it("should reject empty name", async () => {
			const project = await createProject({ name: "Test" });

			await expect(updateProject(project.id, { name: "" })).rejects.toThrow(
				"Project name cannot be empty",
			);
		});

		it("should reject name exceeding 100 characters", async () => {
			const project = await createProject({ name: "Test" });
			const longName = "a".repeat(101);

			await expect(updateProject(project.id, { name: longName })).rejects.toThrow(
				"Project name cannot exceed 100 characters",
			);
		});

		it("should reject description exceeding 1000 characters", async () => {
			const project = await createProject({ name: "Test" });
			const longDesc = "a".repeat(1001);

			await expect(
				updateProject(project.id, { description: longDesc }),
			).rejects.toThrow("Project description cannot exceed 1000 characters");
		});

		it("should throw error for invalid UUID format", async () => {
			await expect(
				updateProject("invalid-uuid", { name: "Test" }),
			).rejects.toThrow("Invalid projectId format");
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(updateProject(fakeId, { name: "Test" })).rejects.toThrow(
				"Project not found",
			);
		});

		it("should return existing project when no updates provided", async () => {
			const project = await createProject({ name: "Test" });
			const result = await updateProject(project.id, {});

			expect(result.id).toBe(project.id);
			expect(result.name).toBe("Test");
		});
	});

	// ============================================================================
	// Delete Project Tests
	// ============================================================================
	describe("deleteProject", () => {
		it("should delete a project", async () => {
			const project = await createProject({ name: "To Delete" });

			await deleteProject(project.id);

			const exists = await prisma.project.findUnique({
				where: { id: project.id },
			});
			expect(exists).toBeNull();
		});

		it("should cascade delete all nodes in project", async () => {
			const project = await createProject({ name: "With Nodes" });

			// Create some nodes
			const rootNode = await prisma.node.create({
				data: {
					projectId: project.id,
					role: "USER",
					content: "Root",
				},
			});

			await prisma.node.create({
				data: {
					projectId: project.id,
					role: "ASSISTANT",
					content: "Child",
					parentId: rootNode.id,
				},
			});

			// Delete project
			await deleteProject(project.id);

			// Verify nodes are deleted
			const nodes = await prisma.node.findMany({
				where: { projectId: project.id },
			});
			expect(nodes).toHaveLength(0);
		});

		it("should throw error for invalid UUID format", async () => {
			await expect(deleteProject("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(deleteProject(fakeId)).rejects.toThrow("Project not found");
		});
	});

	// ============================================================================
	// Project Stats Tests
	// ============================================================================
	describe("getProjectStats", () => {
		it("should return zero stats for empty project", async () => {
			const project = await createProject({ name: "Empty" });
			const stats = await getProjectStats(project.id);

			expect(stats.totalNodes).toBe(0);
			expect(stats.userNodes).toBe(0);
			expect(stats.assistantNodes).toBe(0);
			expect(stats.systemNodes).toBe(0);
			expect(stats.maxDepth).toBe(0);
			expect(stats.leafNodes).toBe(0);
		});

		it("should count nodes by role correctly", async () => {
			const project = await createProject({ name: "Mixed Roles" });

			// Create nodes of different roles
			await prisma.node.createMany({
				data: [
					{ projectId: project.id, role: "USER", content: "User 1" },
					{ projectId: project.id, role: "USER", content: "User 2" },
					{ projectId: project.id, role: "ASSISTANT", content: "AI 1" },
					{ projectId: project.id, role: "ASSISTANT", content: "AI 2" },
					{ projectId: project.id, role: "ASSISTANT", content: "AI 3" },
					{ projectId: project.id, role: "SYSTEM", content: "System" },
				],
			});

			const stats = await getProjectStats(project.id);

			expect(stats.totalNodes).toBe(6);
			expect(stats.userNodes).toBe(2);
			expect(stats.assistantNodes).toBe(3);
			expect(stats.systemNodes).toBe(1);
		});

		it("should calculate max depth correctly", async () => {
			const project = await createProject({ name: "Deep Tree" });

			// Create a tree with depth 3
			const root = await prisma.node.create({
				data: {
					projectId: project.id,
					role: "USER",
					content: "Root",
				},
			});

			const child = await prisma.node.create({
				data: {
					projectId: project.id,
					role: "ASSISTANT",
					content: "Child",
					parentId: root.id,
				},
			});

			await prisma.node.create({
				data: {
					projectId: project.id,
					role: "USER",
					content: "Grandchild",
					parentId: child.id,
				},
			});

			const stats = await getProjectStats(project.id);

			expect(stats.maxDepth).toBe(2); // 0-indexed depth
		});

		it("should count leaf nodes correctly", async () => {
			const project = await createProject({ name: "Leaf Test" });

			// Create a tree structure
			const root = await prisma.node.create({
				data: {
					projectId: project.id,
					role: "USER",
					content: "Root",
				},
			});

			const child1 = await prisma.node.create({
				data: {
					projectId: project.id,
					role: "ASSISTANT",
					content: "Child 1",
					parentId: root.id,
				},
			});

			await prisma.node.create({
				data: {
					projectId: project.id,
					role: "ASSISTANT",
					content: "Child 2 (leaf)",
					parentId: root.id,
				},
			});

			await prisma.node.create({
				data: {
					projectId: project.id,
					role: "USER",
					content: "Grandchild (leaf)",
					parentId: child1.id,
				},
			});

			const stats = await getProjectStats(project.id);

			expect(stats.leafNodes).toBe(2); // Child 2 and Grandchild
		});

		it("should throw error for invalid UUID format", async () => {
			await expect(getProjectStats("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(getProjectStats(fakeId)).rejects.toThrow("Project not found");
		});
	});

	// ============================================================================
	// List Projects with Stats Tests
	// ============================================================================
	describe("listProjectsWithStats", () => {
		beforeEach(async () => {
			// Create projects with different node counts
			const p1 = await createProject({ name: "Project A" });
			const p2 = await createProject({ name: "Project B" });
			const p3 = await createProject({ name: "Project C" });

			// Add nodes to some projects
			await prisma.node.create({
				data: { projectId: p1.id, role: "USER", content: "Node 1" },
			});
			await prisma.node.create({
				data: { projectId: p1.id, role: "USER", content: "Node 2" },
			});
			await prisma.node.create({
				data: { projectId: p2.id, role: "USER", content: "Node 1" },
			});
			// p3 has no nodes
		});

		it("should include node count for each project", async () => {
			const result = await listProjectsWithStats();

			expect(result.projects).toHaveLength(3);
			expect(result.projects[0]).toHaveProperty("_nodeCount");
			expect(result.projects[1]).toHaveProperty("_nodeCount");
			expect(result.projects[2]).toHaveProperty("_nodeCount");
		});

		it("should have correct node counts", async () => {
			const result = await listProjectsWithStats();

			const counts = result.projects.map((p) => p._nodeCount).sort((a, b) => a! - b!);
			expect(counts).toEqual([0, 1, 2]);
		});

		it("should support pagination", async () => {
			const result = await listProjectsWithStats({ take: 2 });

			expect(result.projects).toHaveLength(2);
			expect(result.hasMore).toBe(true);
		});
	});
});
