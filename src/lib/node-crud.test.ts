/**
 * Tests for API-003: Node CRUD Service
 *
 * Note: Database integration tests have been removed.
 * Tests now use mocked database operations.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the prisma client
vi.mock("./prisma", () => ({
	prisma: {
		node: {
			deleteMany: vi.fn(),
			delete: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			findUnique: vi.fn(),
			findMany: vi.fn(),
			count: vi.fn(),
		},
		project: {
			deleteMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			findUnique: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

import {
	type CreateNodeInput,
	createNode,
	deleteNode,
	getNode,
	updateNode,
	updateNodeContent,
	updateNodePosition,
} from "./node-crud";
import { prisma } from "./prisma";

describe("Node CRUD Service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ============================================================================
	// Validation Tests
	// ============================================================================

	describe("Validation", () => {
		it("should reject invalid projectId format", async () => {
			await expect(
				createNode({
					projectId: "invalid-uuid",
					role: "USER",
					content: "Hello",
				}),
			).rejects.toThrow("Invalid projectId format");
		});

		it("should reject invalid nodeId format", async () => {
			await expect(getNode("invalid-uuid")).rejects.toThrow(
				"Invalid nodeId format",
			);
		});

		it("should reject invalid parentId format", async () => {
			await expect(
				createNode({
					projectId: "00000000-0000-0000-0000-000000000001",
					role: "USER",
					content: "Hello",
					parentId: "invalid-uuid",
				}),
			).rejects.toThrow("Invalid parentId format");
		});
	});

	// ============================================================================
	// Create Node Tests
	// ============================================================================

	describe("createNode", () => {
		it("should create a node with minimal fields", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000001",
				projectId: "00000000-0000-0000-0000-000000000002",
				role: "USER" as const,
				content: "Hello, world!",
				positionX: 0,
				positionY: 0,
				parentId: null,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue({
				id: mockNode.projectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			vi.mocked(prisma.node.count).mockResolvedValue(0);
			vi.mocked(prisma.node.create).mockResolvedValue(mockNode);
			vi.mocked(prisma.project.update).mockResolvedValue({} as never);

			const input: CreateNodeInput = {
				projectId: mockNode.projectId,
				role: "USER",
				content: "Hello, world!",
			};

			const result = await createNode(input);

			expect(result).toMatchObject({
				projectId: mockNode.projectId,
				role: "USER",
				content: "Hello, world!",
				positionX: 0,
				positionY: 0,
				parentId: null,
			});
		});
	});

	// ============================================================================
	// Get Node Tests
	// ============================================================================

	describe("getNode", () => {
		it("should retrieve an existing node", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000001",
				projectId: "00000000-0000-0000-0000-000000000002",
				role: "USER" as const,
				content: "Test message",
				positionX: 50,
				positionY: 100,
				parentId: null,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);

			const result = await getNode(mockNode.id);

			expect(result).toMatchObject({
				id: mockNode.id,
				projectId: mockNode.projectId,
				role: "USER",
				content: "Test message",
				positionX: 50,
				positionY: 100,
			});
		});
	});

	// ============================================================================
	// Update Node Tests
	// ============================================================================

	describe("updateNode", () => {
		it("should update node content only", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000001",
				projectId: "00000000-0000-0000-0000-000000000002",
				role: "USER" as const,
				content: "Updated",
				positionX: 0,
				positionY: 0,
				parentId: null,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.node.update).mockResolvedValue(mockNode);

			const result = await updateNode(mockNode.id, {
				content: "Updated",
			});

			expect(result.content).toBe("Updated");
			expect(result.id).toBe(mockNode.id);
		});
	});

	// ============================================================================
	// Update Node Position Tests
	// ============================================================================

	describe("updateNodePosition", () => {
		it("should update only position", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000001",
				projectId: "00000000-0000-0000-0000-000000000002",
				role: "USER" as const,
				content: "Test",
				positionX: 300,
				positionY: 400,
				parentId: null,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.node.update).mockResolvedValue(mockNode);

			const result = await updateNodePosition(mockNode.id, {
				positionX: 300,
				positionY: 400,
			});

			expect(result.positionX).toBe(300);
			expect(result.positionY).toBe(400);
			expect(result.content).toBe("Test"); // Unchanged
		});
	});

	// ============================================================================
	// Update Node Content Tests
	// ============================================================================

	describe("updateNodeContent", () => {
		it("should update only content", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000001",
				projectId: "00000000-0000-0000-0000-000000000002",
				role: "USER" as const,
				content: "Updated",
				positionX: 100,
				positionY: 200,
				parentId: null,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.node.update).mockResolvedValue(mockNode);

			const result = await updateNodeContent(mockNode.id, {
				content: "Updated",
			});

			expect(result.content).toBe("Updated");
			expect(result.positionX).toBe(100); // Unchanged
			expect(result.positionY).toBe(200); // Unchanged
		});
	});

	// ============================================================================
	// Delete Node Tests
	// ============================================================================

	describe("deleteNode", () => {
		it("should delete a leaf node", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000001",
				projectId: "00000000-0000-0000-0000-000000000002",
				role: "USER" as const,
				content: "To delete",
				positionX: 0,
				positionY: 0,
				parentId: null,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
			vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
			vi.mocked(prisma.node.findMany).mockResolvedValue([]);
			vi.mocked(prisma.node.delete).mockResolvedValue(mockNode);
			vi.mocked(prisma.project.update).mockResolvedValue({} as never);

			await deleteNode(mockNode.id);

			expect(prisma.node.delete).toHaveBeenCalledWith({
				where: { id: mockNode.id },
			});
		});
	});
});
