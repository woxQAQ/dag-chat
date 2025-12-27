/**
 * Tests for API-001: Project CRUD Service
 *
 * Note: Database integration tests have been removed.
 * Tests now use mocked database operations.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the prisma client
vi.mock("./prisma", () => ({
	prisma: {
		project: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
			deleteMany: vi.fn(),
		},
		node: {
			deleteMany: vi.fn(),
			create: vi.fn(),
			createMany: vi.fn(),
			count: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

import { prisma } from "./prisma";
import {
	type CreateProjectInput,
	createProject,
	deleteProject,
	getProject,
	getProjectStats,
	listProjects,
	updateProject,
} from "./project-crud";

describe("Project CRUD Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ============================================================================
	// Create Project Tests
	// ============================================================================
	describe("createProject", () => {
		it("should create a project with default name", async () => {
			const mockProject = {
				id: "00000000-0000-0000-0000-000000000001",
				name: "Untitled Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.create).mockResolvedValue(mockProject);

			const result = await createProject();

			expect(result).toHaveProperty("id");
			expect(result.name).toBe("Untitled Project");
			expect(result.description).toBeNull();
			expect(result.rootNodeId).toBeNull();
		});

		it("should create a project with custom name", async () => {
			const mockProject = {
				id: "00000000-0000-0000-0000-000000000001",
				name: "My Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.create).mockResolvedValue(mockProject);

			const input: CreateProjectInput = {
				name: "My Test Project",
			};
			const result = await createProject(input);

			expect(result.name).toBe("My Test Project");
		});

		it("should reject empty name", async () => {
			await expect(createProject({ name: "" })).rejects.toThrow(
				"Project name cannot be empty",
			);
		});
	});

	// ============================================================================
	// Get Project Tests
	// ============================================================================
	describe("getProject", () => {
		it("should retrieve a project by ID", async () => {
			const mockProject = {
				id: "00000000-0000-0000-0000-000000000001",
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);

			const result = await getProject(mockProject.id);

			expect(result.id).toBe(mockProject.id);
			expect(result.name).toBe("Test Project");
		});

		it("should throw error for invalid UUID format", async () => {
			await expect(getProject("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});
	});

	// ============================================================================
	// List Projects Tests
	// ============================================================================
	describe("listProjects", () => {
		it("should list all projects with default options", async () => {
			const mockProjects = [
				{
					id: "00000000-0000-0000-0000-000000000001",
					name: "Project A",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "00000000-0000-0000-0000-000000000002",
					name: "Project B",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(prisma.project.findMany).mockResolvedValue(mockProjects);
			vi.mocked(prisma.project.count).mockResolvedValue(2);

			const result = await listProjects();

			expect(result.projects).toHaveLength(2);
			expect(result.total).toBe(2);
			expect(result.hasMore).toBe(false);
		});
	});

	// ============================================================================
	// Update Project Tests
	// ============================================================================
	describe("updateProject", () => {
		it("should update project name", async () => {
			const mockProject = {
				id: "00000000-0000-0000-0000-000000000001",
				name: "Updated Name",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
			vi.mocked(prisma.project.update).mockResolvedValue(mockProject);

			const result = await updateProject(mockProject.id, {
				name: "Updated Name",
			});

			expect(result.name).toBe("Updated Name");
		});

		it("should reject empty name", async () => {
			await expect(
				updateProject("00000000-0000-0000-0000-000000000001", { name: "" }),
			).rejects.toThrow("Project name cannot be empty");
		});
	});

	// ============================================================================
	// Delete Project Tests
	// ============================================================================
	describe("deleteProject", () => {
		it("should delete a project", async () => {
			const mockProject = {
				id: "00000000-0000-0000-0000-000000000001",
				name: "To Delete",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
			vi.mocked(prisma.project.delete).mockResolvedValue(mockProject);

			await deleteProject(mockProject.id);

			expect(prisma.project.delete).toHaveBeenCalledWith({
				where: { id: mockProject.id },
			});
		});

		it("should throw error for invalid UUID format", async () => {
			await expect(deleteProject("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});
	});

	// ============================================================================
	// Project Stats Tests
	// ============================================================================
	describe("getProjectStats", () => {
		it("should return zero stats for empty project", async () => {
			const mockProject = {
				id: "00000000-0000-0000-0000-000000000001",
				name: "Empty",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
			vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

			const stats = await getProjectStats(mockProject.id);

			expect(stats.totalNodes).toBe(0);
			expect(stats.userNodes).toBe(0);
			expect(stats.assistantNodes).toBe(0);
			expect(stats.systemNodes).toBe(0);
			expect(stats.maxDepth).toBe(0);
			expect(stats.leafNodes).toBe(0);
		});
	});
});
