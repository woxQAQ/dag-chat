/**
 * UI-NEW-001: Root Node Creation Server Action Tests
 *
 * Tests for the createRootNode Server Action.
 *
 * Note: Database integration tests have been removed.
 * Tests now use mocked database operations.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock revalidatePath
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Mock the prisma client
vi.mock("@/lib/prisma", () => ({
	prisma: {
		node: {
			deleteMany: vi.fn(),
			create: vi.fn(),
			findUnique: vi.fn(),
		},
		project: {
			deleteMany: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
		},
	},
}));

// Mock project-crud and node-crud
const mockGetProject = vi.fn();
const mockCreateNode = vi.fn();

vi.mock("@/lib/project-crud", () => ({
	getProject: (...args: unknown[]) => mockGetProject(...args),
}));

vi.mock("@/lib/node-crud", () => ({
	createNode: (...args: unknown[]) => mockCreateNode(...args),
}));

import { createRootNode } from "./root-actions";

describe("createRootNode Server Action", () => {
	const mockProjectId = "00000000-0000-0000-0000-000000000001";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Success Cases", () => {
		it("should create root node for empty project", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNode = {
				id: "00000000-0000-0000-0000-000000000002",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Test prompt",
				positionX: 100,
				positionY: 200,
				metadata: { isRoot: true },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockGetProject.mockResolvedValue(mockProject);
			mockCreateNode.mockResolvedValue(mockNode);

			const result = await createRootNode({
				projectId: mockProjectId,
				content: "Test prompt",
				positionX: 100,
				positionY: 200,
			});

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.nodeId).toBeDefined();
			expect(result.data?.positionX).toBe(100);
			expect(result.data?.positionY).toBe(200);
		});

		it("should create USER role node", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNode = {
				id: "00000000-0000-0000-0000-000000000002",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "User message",
				positionX: 0,
				positionY: 0,
				metadata: { isRoot: true },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockGetProject.mockResolvedValue(mockProject);
			mockCreateNode.mockResolvedValue(mockNode);

			const result = await createRootNode({
				projectId: mockProjectId,
				content: "User message",
				positionX: 0,
				positionY: 0,
			});

			expect(result.success).toBe(true);
			expect(mockCreateNode).toHaveBeenCalledWith(
				expect.objectContaining({ role: "USER" }),
			);
		});
	});

	describe("Forest Structure Support", () => {
		it("should allow creating multiple root nodes", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNode1 = {
				id: "00000000-0000-0000-0000-000000000002",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "First root",
				positionX: 0,
				positionY: 0,
				metadata: { isRoot: true },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNode2 = {
				id: "00000000-0000-0000-0000-000000000003",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Second root",
				positionX: 100,
				positionY: 100,
				metadata: { isRoot: true },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockGetProject.mockResolvedValue(mockProject);
			mockCreateNode
				.mockResolvedValueOnce(mockNode1)
				.mockResolvedValueOnce(mockNode2);

			const root1 = await createRootNode({
				projectId: mockProjectId,
				content: "First root",
				positionX: 0,
				positionY: 0,
			});
			expect(root1.success).toBe(true);

			const root2 = await createRootNode({
				projectId: mockProjectId,
				content: "Second root",
				positionX: 100,
				positionY: 100,
			});

			expect(root2.success).toBe(true);
			expect(root2.data?.nodeId).toBeDefined();
			expect(root2.data?.nodeId).not.toBe(root1.data?.nodeId);
		});
	});

	describe("Position Handling", () => {
		it("should accept zero position", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNode = {
				id: "00000000-0000-0000-0000-000000000002",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Zero position test",
				positionX: 0,
				positionY: 0,
				metadata: { isRoot: true },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockGetProject.mockResolvedValue(mockProject);
			mockCreateNode.mockResolvedValue(mockNode);

			const result = await createRootNode({
				projectId: mockProjectId,
				content: "Zero position test",
				positionX: 0,
				positionY: 0,
			});

			expect(result.success).toBe(true);
			expect(result.data?.positionX).toBe(0);
			expect(result.data?.positionY).toBe(0);
		});

		it("should accept negative positions", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNode = {
				id: "00000000-0000-0000-0000-000000000002",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Negative position test",
				positionX: -100,
				positionY: -200,
				metadata: { isRoot: true },
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			mockGetProject.mockResolvedValue(mockProject);
			mockCreateNode.mockResolvedValue(mockNode);

			const result = await createRootNode({
				projectId: mockProjectId,
				content: "Negative position test",
				positionX: -100,
				positionY: -200,
			});

			expect(result.success).toBe(true);
			expect(result.data?.positionX).toBe(-100);
			expect(result.data?.positionY).toBe(-200);
		});
	});
});
