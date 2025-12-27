/**
 * Tests for API-002: Graph Retrieval Service
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
			create: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
			findUnique: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

import {
	getNodeSubgraph,
	getProjectGraph,
	getProjectGraphStats,
} from "./graph-retrieval";
import { prisma } from "./prisma";

describe("Graph Retrieval Service", () => {
	const mockProjectId = "00000000-0000-0000-0000-000000000001";
	const mockRootNodeId = "00000000-0000-0000-0000-000000000002";

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("getProjectGraph", () => {
		it("should throw error for invalid UUID format", async () => {
			await expect(getProjectGraph("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

			await expect(getProjectGraph(fakeId)).rejects.toThrow(
				"Project not found",
			);
		});

		it("should return empty graph for project with no nodes", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Empty Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
			vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

			const graph = await getProjectGraph(mockProjectId);

			expect(graph.nodes).toEqual([]);
			expect(graph.edges).toEqual([]);
			expect(graph.rootNodeId).toBeNull();
		});

		it("should retrieve all nodes for a project", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: mockRootNodeId,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockNodes = [
				{
					id: mockRootNodeId,
					projectId: mockProjectId,
					parentId: null,
					role: "SYSTEM",
					content: "System prompt",
					positionX: 0,
					positionY: 0,
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: "00000000-0000-0000-0000-000000000003",
					projectId: mockProjectId,
					parentId: mockRootNodeId,
					role: "USER",
					content: "Hello",
					positionX: 100,
					positionY: 100,
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const graph = await getProjectGraph(mockProjectId);

			expect(graph.nodes).toHaveLength(2);
			expect(graph.nodes.map((n) => n.id)).toEqual(
				expect.arrayContaining([mockRootNodeId, mockNodes[1].id]),
			);
		});
	});

	describe("getNodeSubgraph", () => {
		it("should throw error for invalid UUID format", async () => {
			await expect(getNodeSubgraph("invalid-uuid")).rejects.toThrow(
				"Invalid nodeId format",
			);
		});

		it("should throw error for non-existent node", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			vi.mocked(prisma.node.findUnique).mockResolvedValue(null);

			await expect(getNodeSubgraph(fakeId)).rejects.toThrow("Node not found");
		});

		it("should return single node subgraph for leaf node", async () => {
			const mockNode = {
				id: "00000000-0000-0000-0000-000000000003",
				projectId: mockProjectId,
				parentId: mockRootNodeId,
				role: "USER" as const,
				content: "Leaf",
				positionX: 100,
				positionY: 200,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
				depth: 0,
			};

			vi.mocked(prisma.node.findUnique).mockResolvedValue({
				id: mockNode.id,
				projectId: mockNode.projectId,
				createdAt: new Date(),
				updatedAt: new Date(),
				parentId: mockRootNodeId,
				role: "USER" as const,
				content: "Leaf",
				positionX: 100,
				positionY: 200,
				metadata: {},
			});
			vi.mocked(prisma.$queryRaw).mockResolvedValue([mockNode]);

			const subgraph = await getNodeSubgraph(mockNode.id);

			expect(subgraph.nodes).toHaveLength(1);
			expect(subgraph.nodes[0].id).toBe(mockNode.id);
		});
	});

	describe("getProjectGraphStats", () => {
		it("should throw error for invalid UUID format", async () => {
			await expect(getProjectGraphStats("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

			await expect(getProjectGraphStats(fakeId)).rejects.toThrow(
				"Project not found",
			);
		});

		it("should return correct total node count", async () => {
			const mockProject = {
				id: mockProjectId,
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(prisma.project.findUnique).mockResolvedValue(mockProject);
			vi.mocked(prisma.$queryRaw).mockResolvedValue([
				{ role: "USER", depth: 0, child_count: BigInt(0) },
				{ role: "USER", depth: 1, child_count: BigInt(0) },
				{ role: "ASSISTANT", depth: 1, child_count: BigInt(1) },
				{ role: "SYSTEM", depth: 0, child_count: BigInt(2) },
			]);

			const stats = await getProjectGraphStats(mockProjectId);

			expect(stats.nodeCountsByRole.USER).toBe(2);
			expect(stats.nodeCountsByRole.ASSISTANT).toBe(1);
			expect(stats.nodeCountsByRole.SYSTEM).toBe(1);
			expect(stats.maxDepth).toBe(1);
			expect(stats.leafNodeCount).toBe(2);
		});
	});
});
