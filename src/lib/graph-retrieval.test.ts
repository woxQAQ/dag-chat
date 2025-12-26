/**
 * Tests for API-002: Graph Retrieval Service
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	getNodeSubgraph,
	getProjectGraph,
	getProjectGraphStats,
} from "./graph-retrieval";
import { prisma } from "./prisma";

// Clean up all test data after all tests in this file complete
afterAll(async () => {
	await prisma.node.deleteMany({});
	await prisma.project.deleteMany({});
});

describe("Graph Retrieval Service", () => {
	let projectId: string;
	let rootNodeId: string;
	let childNodeId1: string;
	let childNodeId2: string;
	let grandchildNodeId: string;

	beforeAll(async () => {
		// Create a test project
		const project = await prisma.project.create({
			data: {
				name: "Test Graph Project",
				description: "Project for graph retrieval tests",
			},
		});
		projectId = project.id;
	});

	beforeEach(async () => {
		// Clean up nodes before each test
		await prisma.node.deleteMany({});

		// Create test nodes in a tree structure:
		//     root
		//     /  \
		// child1 child2
		//   |
		// grandchild

		const root = await prisma.node.create({
			data: {
				projectId,
				role: "SYSTEM",
				content: "System prompt",
				positionX: 0,
				positionY: 0,
				metadata: {},
			},
		});
		rootNodeId = root.id;

		const child1 = await prisma.node.create({
			data: {
				projectId,
				parentId: rootNodeId,
				role: "USER",
				content: "Hello from user 1",
				positionX: 100,
				positionY: 100,
				metadata: {},
			},
		});
		childNodeId1 = child1.id;

		const child2 = await prisma.node.create({
			data: {
				projectId,
				parentId: rootNodeId,
				role: "USER",
				content: "Hello from user 2",
				positionX: -100,
				positionY: 100,
				metadata: {},
			},
		});
		childNodeId2 = child2.id;

		const grandchild = await prisma.node.create({
			data: {
				projectId,
				parentId: childNodeId1,
				role: "ASSISTANT",
				content: "Response to user 1",
				positionX: 100,
				positionY: 200,
				metadata: {},
			},
		});
		grandchildNodeId = grandchild.id;

		// Update project with root node
		await prisma.project.update({
			where: { id: projectId },
			data: { rootNodeId },
		});
	});

	afterAll(async () => {
		// Clean up test data
		await prisma.node.deleteMany({});
		await prisma.project.deleteMany({});
	});

	describe("getProjectGraph", () => {
		it("should throw error for invalid UUID format", async () => {
			await expect(getProjectGraph("invalid-uuid")).rejects.toThrow(
				"Invalid projectId format",
			);
		});

		it("should throw error for non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(getProjectGraph(fakeId)).rejects.toThrow(
				"Project not found",
			);
		});

		it("should return empty graph for project with no nodes", async () => {
			// Create empty project
			const emptyProject = await prisma.project.create({
				data: { name: "Empty Project" },
			});

			const graph = await getProjectGraph(emptyProject.id);

			expect(graph.nodes).toEqual([]);
			expect(graph.edges).toEqual([]);
			expect(graph.rootNodeId).toBeNull();

			// Clean up
			await prisma.project.delete({ where: { id: emptyProject.id } });
		});

		it("should retrieve all nodes for a project", async () => {
			const graph = await getProjectGraph(projectId);

			expect(graph.nodes).toHaveLength(4);
			expect(graph.nodes.map((n) => n.id)).toEqual(
				expect.arrayContaining([
					rootNodeId,
					childNodeId1,
					childNodeId2,
					grandchildNodeId,
				]),
			);
		});

		it("should include node content and metadata", async () => {
			const graph = await getProjectGraph(projectId);

			const rootNode = graph.nodes.find((n) => n.id === rootNodeId);
			expect(rootNode).toBeDefined();
			expect(rootNode?.role).toBe("SYSTEM");
			expect(rootNode?.content).toBe("System prompt");
			expect(rootNode?.positionX).toBe(0);
			expect(rootNode?.positionY).toBe(0);
			expect(rootNode?.metadata).toEqual({});
		});

		it("should build edges from parent-child relationships", async () => {
			const graph = await getProjectGraph(projectId);

			// Should have 3 edges: root->child1, root->child2, child1->grandchild
			expect(graph.edges).toHaveLength(3);

			const edgeSources = graph.edges.map((e) => e.source).sort();
			const edgeTargets = graph.edges.map((e) => e.target).sort();

			expect(edgeSources).toEqual(
				expect.arrayContaining([rootNodeId, rootNodeId, childNodeId1]),
			);
			expect(edgeTargets).toEqual(
				expect.arrayContaining([childNodeId1, childNodeId2, grandchildNodeId]),
			);
		});

		it("should generate unique edge IDs", async () => {
			const graph = await getProjectGraph(projectId);

			const edgeIds = graph.edges.map((e) => e.id);
			const uniqueEdgeIds = new Set(edgeIds);

			expect(uniqueEdgeIds.size).toBe(edgeIds.length);
		});

		it("should return rootNodeId from project", async () => {
			const graph = await getProjectGraph(projectId);

			expect(graph.rootNodeId).toBe(rootNodeId);
		});

		it("should return nodes in chronological order (created_at ASC)", async () => {
			const graph = await getProjectGraph(projectId);

			// Verify nodes are sorted by creation time
			for (let i = 1; i < graph.nodes.length; i++) {
				const prev = graph.nodes[i - 1].createdAt;
				const curr = graph.nodes[i].createdAt;
				expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime());
			}
		});

		it("should handle all role types", async () => {
			const graph = await getProjectGraph(projectId);

			const roles = graph.nodes.map((n) => n.role);
			expect(roles).toContain("SYSTEM");
			expect(roles).toContain("USER");
			expect(roles).toContain("ASSISTANT");
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
			await expect(getNodeSubgraph(fakeId)).rejects.toThrow("Node not found");
		});

		it("should return single node subgraph for leaf node", async () => {
			const subgraph = await getNodeSubgraph(grandchildNodeId);

			expect(subgraph.nodes).toHaveLength(1);
			expect(subgraph.nodes[0].id).toBe(grandchildNodeId);
			expect(subgraph.edges).toHaveLength(0);
			expect(subgraph.rootNodeId).toBe(grandchildNodeId);
		});

		it("should return full subtree for branch node", async () => {
			const subgraph = await getNodeSubgraph(childNodeId1);

			// Should include childNodeId1 and grandchildNodeId
			expect(subgraph.nodes).toHaveLength(2);
			expect(subgraph.nodes.map((n) => n.id)).toEqual(
				expect.arrayContaining([childNodeId1, grandchildNodeId]),
			);
			expect(subgraph.edges).toHaveLength(1);
			expect(subgraph.edges[0].source).toBe(childNodeId1);
			expect(subgraph.edges[0].target).toBe(grandchildNodeId);
		});

		it("should return entire tree for root node", async () => {
			const subgraph = await getNodeSubgraph(rootNodeId);

			// Should include all 4 nodes
			expect(subgraph.nodes).toHaveLength(4);
			expect(subgraph.edges).toHaveLength(3);
			expect(subgraph.rootNodeId).toBe(rootNodeId);
		});

		it("should order nodes by depth then creation time", async () => {
			const subgraph = await getNodeSubgraph(rootNodeId);

			// root (depth 0) should be first
			expect(subgraph.nodes[0].id).toBe(rootNodeId);

			// children (depth 1) should come before grandchild (depth 2)
			const childIndices = subgraph.nodes
				.map((n, i) =>
					n.id === childNodeId1 || n.id === childNodeId2 ? i : -1,
				)
				.filter((i) => i >= 0);
			const grandchildIndex = subgraph.nodes.findIndex(
				(n) => n.id === grandchildNodeId,
			);

			for (const idx of childIndices) {
				expect(idx).toBeLessThan(grandchildIndex);
			}
		});

		it("should not include nodes from other branches", async () => {
			const subgraph = await getNodeSubgraph(childNodeId1);

			// Should only include child1 and its descendants
			const nodeIds = subgraph.nodes.map((n) => n.id);
			expect(nodeIds).toContain(childNodeId1);
			expect(nodeIds).toContain(grandchildNodeId);
			expect(nodeIds).not.toContain(childNodeId2); // From other branch
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
			await expect(getProjectGraphStats(fakeId)).rejects.toThrow(
				"Project not found",
			);
		});

		it("should return correct total node count", async () => {
			const stats = await getProjectGraphStats(projectId);

			expect(stats.totalNodes).toBe(4);
		});

		it("should count nodes by role correctly", async () => {
			const stats = await getProjectGraphStats(projectId);

			expect(stats.nodeCountsByRole.SYSTEM).toBe(1);
			expect(stats.nodeCountsByRole.USER).toBe(2);
			expect(stats.nodeCountsByRole.ASSISTANT).toBe(1);
		});

		it("should calculate max depth correctly", async () => {
			const stats = await getProjectGraphStats(projectId);

			// Tree depth: root(0) -> child(1) -> grandchild(2)
			expect(stats.maxDepth).toBe(2);
		});

		it("should count leaf nodes correctly", async () => {
			const stats = await getProjectGraphStats(projectId);

			// Leaf nodes: child2 and grandchild
			expect(stats.leafNodeCount).toBe(2);
		});

		it("should return zero stats for empty project", async () => {
			// Create empty project
			const emptyProject = await prisma.project.create({
				data: { name: "Empty Stats Project" },
			});

			const stats = await getProjectGraphStats(emptyProject.id);

			expect(stats.totalNodes).toBe(0);
			expect(stats.nodeCountsByRole.SYSTEM).toBe(0);
			expect(stats.nodeCountsByRole.USER).toBe(0);
			expect(stats.nodeCountsByRole.ASSISTANT).toBe(0);
			expect(stats.maxDepth).toBe(0);
			expect(stats.leafNodeCount).toBe(0);

			// Clean up
			await prisma.project.delete({ where: { id: emptyProject.id } });
		});

		it("should handle linear chain correctly", async () => {
			// Create a linear chain
			const chainProject = await prisma.project.create({
				data: { name: "Chain Project" },
			});

			const node1 = await prisma.node.create({
				data: {
					projectId: chainProject.id,
					role: "USER",
					content: "First",
					positionX: 0,
					positionY: 0,
				},
			});

			const _node2 = await prisma.node.create({
				data: {
					projectId: chainProject.id,
					parentId: node1.id,
					role: "ASSISTANT",
					content: "Second",
					positionX: 0,
					positionY: 100,
				},
			});

			const stats = await getProjectGraphStats(chainProject.id);

			expect(stats.totalNodes).toBe(2);
			expect(stats.maxDepth).toBe(1);
			expect(stats.leafNodeCount).toBe(1); // Only node2 is a leaf

			// Clean up
			await prisma.project.delete({ where: { id: chainProject.id } });
		});
	});

	describe("Edge case handling", () => {
		it("should handle nodes with null parentId", async () => {
			const graph = await getProjectGraph(projectId);

			const root = graph.nodes.find((n) => n.parentId === null);
			expect(root?.id).toBe(rootNodeId);
		});

		it("should handle float positions correctly", async () => {
			// Create node with float positions
			const floatNode = await prisma.node.create({
				data: {
					projectId,
					role: "USER",
					content: "Float position",
					positionX: 123.456,
					positionY: 789.012,
				},
			});

			const graph = await getProjectGraph(projectId);
			const node = graph.nodes.find((n) => n.id === floatNode.id);

			expect(node?.positionX).toBe(123.456);
			expect(node?.positionY).toBe(789.012);
		});

		it("should handle JSON metadata correctly", async () => {
			const metadata = { model: "gpt-4", temperature: 0.7, tags: ["test"] };
			const metaNode = await prisma.node.create({
				data: {
					projectId,
					role: "ASSISTANT",
					content: "Metadata test",
					positionX: 0,
					positionY: 0,
					metadata,
				},
			});

			const graph = await getProjectGraph(projectId);
			const node = graph.nodes.find((n) => n.id === metaNode.id);

			expect(node?.metadata).toEqual(metadata);
		});
	});
});
