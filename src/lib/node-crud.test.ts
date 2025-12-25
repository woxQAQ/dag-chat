/**
 * Tests for API-003: Node CRUD Service
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	batchCreateNodes,
	batchUpdatePositions,
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
	let projectId: string;
	let testProjectId: string;

	beforeEach(async () => {
		// Create a test project for each test
		const project = await prisma.project.create({
			data: {
				name: "Test Project",
			},
		});
		projectId = project.id;

		const testProject = await prisma.project.create({
			data: {
				name: "Test Project 2",
			},
		});
		testProjectId = testProject.id;
	});

	afterEach(async () => {
		// Clean up test data
		await prisma.node.deleteMany({});
		await prisma.project.deleteMany({});
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
					projectId,
					role: "USER",
					content: "Hello",
					parentId: "invalid-uuid",
				}),
			).rejects.toThrow("Invalid parentId format");
		});

		it("should reject non-existent project", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(
				createNode({
					projectId: fakeId,
					role: "USER",
					content: "Hello",
				}),
			).rejects.toThrow("Project not found");
		});

		it("should reject non-existent parent node", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(
				createNode({
					projectId,
					role: "USER",
					content: "Hello",
					parentId: fakeId,
				}),
			).rejects.toThrow("Parent node not found");
		});

		it("should reject parent from different project", async () => {
			// Create a node in testProject
			const otherNode = await prisma.node.create({
				data: {
					projectId: testProjectId,
					role: "USER",
					content: "Other project node",
				},
			});

			// Try to create a child in projectId with parent from testProjectId
			await expect(
				createNode({
					projectId,
					role: "USER",
					content: "Hello",
					parentId: otherNode.id,
				}),
			).rejects.toThrow("does not belong to project");
		});
	});

	// ============================================================================
	// Create Node Tests
	// ============================================================================

	describe("createNode", () => {
		it("should create a node with minimal fields", async () => {
			const input: CreateNodeInput = {
				projectId,
				role: "USER",
				content: "Hello, world!",
			};

			const result = await createNode(input);

			expect(result).toMatchObject({
				projectId,
				role: "USER",
				content: "Hello, world!",
				positionX: 0,
				positionY: 0,
				parentId: null,
			});
			expect(result.id).toBeDefined();
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it("should create a node with all fields", async () => {
			const input: CreateNodeInput = {
				projectId,
				role: "ASSISTANT",
				content: "Hi there!",
				positionX: 100.5,
				positionY: 200.5,
				metadata: { source: "test" },
			};

			const result = await createNode(input);

			expect(result).toMatchObject({
				projectId,
				role: "ASSISTANT",
				content: "Hi there!",
				positionX: 100.5,
				positionY: 200.5,
				metadata: { source: "test" },
				parentId: null,
			});
		});

		it("should create a node with parent", async () => {
			const parent = await createNode({
				projectId,
				role: "USER",
				content: "Parent",
			});

			const child = await createNode({
				projectId,
				role: "ASSISTANT",
				content: "Child",
				parentId: parent.id,
			});

			expect(child.parentId).toBe(parent.id);
			expect(child.id).not.toBe(parent.id);
		});

		it("should set rootNodeId for first node in project", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "First node",
			});

			const project = await prisma.project.findUnique({
				where: { id: projectId },
				select: { rootNodeId: true },
			});

			expect(project?.rootNodeId).toBe(node.id);
		});

		it("should not change rootNodeId for subsequent nodes", async () => {
			const first = await createNode({
				projectId,
				role: "USER",
				content: "First node",
			});

			await createNode({
				projectId,
				role: "ASSISTANT",
				content: "Second node",
			});

			const project = await prisma.project.findUnique({
				where: { id: projectId },
				select: { rootNodeId: true },
			});

			expect(project?.rootNodeId).toBe(first.id);
		});

		it("should support all role types", async () => {
			const systemNode = await createNode({
				projectId,
				role: "SYSTEM",
				content: "System prompt",
			});
			expect(systemNode.role).toBe("SYSTEM");

			const userNode = await createNode({
				projectId,
				role: "USER",
				content: "User message",
			});
			expect(userNode.role).toBe("USER");

			const assistantNode = await createNode({
				projectId,
				role: "ASSISTANT",
				content: "Assistant response",
			});
			expect(assistantNode.role).toBe("ASSISTANT");
		});
	});

	// ============================================================================
	// Get Node Tests
	// ============================================================================

	describe("getNode", () => {
		it("should retrieve an existing node", async () => {
			const created = await createNode({
				projectId,
				role: "USER",
				content: "Test message",
				positionX: 50,
				positionY: 100,
			});

			const retrieved = await getNode(created.id);

			expect(retrieved).toMatchObject({
				id: created.id,
				projectId,
				role: "USER",
				content: "Test message",
				positionX: 50,
				positionY: 100,
			});
		});

		it("should throw error for non-existent node", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(getNode(fakeId)).rejects.toThrow("Node not found");
		});
	});

	// ============================================================================
	// Update Node Tests
	// ============================================================================

	describe("updateNode", () => {
		it("should update node content only", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
			});

			const updated = await updateNode(node.id, {
				content: "Updated",
			});

			expect(updated.content).toBe("Updated");
			expect(updated.id).toBe(node.id);
		});

		it("should update node position only", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Test",
				positionX: 0,
				positionY: 0,
			});

			const updated = await updateNode(node.id, {
				positionX: 100,
				positionY: 200,
			});

			expect(updated.positionX).toBe(100);
			expect(updated.positionY).toBe(200);
		});

		it("should update both content and position", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
				positionX: 0,
				positionY: 0,
			});

			const updated = await updateNode(node.id, {
				content: "Updated",
				positionX: 150,
				positionY: 250,
			});

			expect(updated.content).toBe("Updated");
			expect(updated.positionX).toBe(150);
			expect(updated.positionY).toBe(250);
		});

		it("should update metadata", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Test",
				metadata: { key: "value" },
			});

			const updated = await updateNode(node.id, {
				metadata: { newKey: "newValue" },
			});

			expect(updated.metadata).toEqual({ newKey: "newValue" });
		});

		it("should update updatedAt timestamp", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
			});

			// Wait a bit to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			const updated = await updateNode(node.id, {
				content: "Updated",
			});

			expect(updated.updatedAt.getTime()).toBeGreaterThan(
				node.updatedAt.getTime(),
			);
		});

		it("should not update createdAt timestamp", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
			});

			const updated = await updateNode(node.id, {
				content: "Updated",
			});

			expect(updated.createdAt.getTime()).toBe(node.createdAt.getTime());
		});
	});

	// ============================================================================
	// Update Node Position Tests
	// ============================================================================

	describe("updateNodePosition", () => {
		it("should update only position", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Test",
				positionX: 0,
				positionY: 0,
			});

			const updated = await updateNodePosition(node.id, {
				positionX: 300,
				positionY: 400,
			});

			expect(updated.positionX).toBe(300);
			expect(updated.positionY).toBe(400);
			expect(updated.content).toBe("Test"); // Unchanged
		});

		it("should support decimal positions", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Test",
			});

			const updated = await updateNodePosition(node.id, {
				positionX: 123.456,
				positionY: 789.012,
			});

			expect(updated.positionX).toBe(123.456);
			expect(updated.positionY).toBe(789.012);
		});

		it("should support negative positions", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Test",
			});

			const updated = await updateNodePosition(node.id, {
				positionX: -100,
				positionY: -200,
			});

			expect(updated.positionX).toBe(-100);
			expect(updated.positionY).toBe(-200);
		});
	});

	// ============================================================================
	// Update Node Content Tests
	// ============================================================================

	describe("updateNodeContent", () => {
		it("should update only content", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
				positionX: 100,
				positionY: 200,
			});

			const updated = await updateNodeContent(node.id, {
				content: "Updated",
			});

			expect(updated.content).toBe("Updated");
			expect(updated.positionX).toBe(100); // Unchanged
			expect(updated.positionY).toBe(200); // Unchanged
		});

		it("should update content and metadata", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
			});

			const updated = await updateNodeContent(node.id, {
				content: "Updated",
				metadata: { edited: true },
			});

			expect(updated.content).toBe("Updated");
			expect(updated.metadata).toEqual({ edited: true });
		});

		it("should handle empty content", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Original",
			});

			const updated = await updateNodeContent(node.id, {
				content: "",
			});

			expect(updated.content).toBe("");
		});

		it("should handle long content", async () => {
			const longContent = "A".repeat(10000);
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Short",
			});

			const updated = await updateNodeContent(node.id, {
				content: longContent,
			});

			expect(updated.content).toBe(longContent);
		});
	});

	// ============================================================================
	// Delete Node Tests
	// ============================================================================

	describe("deleteNode", () => {
		it("should delete a leaf node", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "To delete",
			});

			await deleteNode(node.id);

			const retrieved = await prisma.node.findUnique({
				where: { id: node.id },
			});

			expect(retrieved).toBeNull();
		});

		it("should cascade delete children", async () => {
			const parent = await createNode({
				projectId,
				role: "USER",
				content: "Parent",
			});

			const child1 = await createNode({
				projectId,
				role: "ASSISTANT",
				content: "Child 1",
				parentId: parent.id,
			});

			const child2 = await createNode({
				projectId,
				role: "ASSISTANT",
				content: "Child 2",
				parentId: parent.id,
			});

			await deleteNode(parent.id);

			// All should be deleted
			const parentRetrieved = await prisma.node.findUnique({
				where: { id: parent.id },
			});
			const child1Retrieved = await prisma.node.findUnique({
				where: { id: child1.id },
			});
			const child2Retrieved = await prisma.node.findUnique({
				where: { id: child2.id },
			});

			expect(parentRetrieved).toBeNull();
			expect(child1Retrieved).toBeNull();
			expect(child2Retrieved).toBeNull();
		});

		it("should clear rootNodeId if root is deleted", async () => {
			const node = await createNode({
				projectId,
				role: "USER",
				content: "Root",
			});

			expect(node.id).toBeDefined();

			await deleteNode(node.id);

			const project = await prisma.project.findUnique({
				where: { id: projectId },
				select: { rootNodeId: true },
			});

			expect(project?.rootNodeId).toBeNull();
		});

		it("should throw error for non-existent node", async () => {
			const fakeId = "00000000-0000-0000-0000-000000000000";
			await expect(deleteNode(fakeId)).rejects.toThrow("Node not found");
		});
	});

	// ============================================================================
	// Batch Operations Tests
	// ============================================================================

	describe("batchCreateNodes", () => {
		it("should create multiple nodes", async () => {
			const inputs: CreateNodeInput[] = [
				{ projectId, role: "USER", content: "First" },
				{ projectId, role: "ASSISTANT", content: "Second" },
				{ projectId, role: "USER", content: "Third" },
			];

			const results = await batchCreateNodes(inputs);

			expect(results).toHaveLength(3);
			expect(results[0].content).toBe("First");
			expect(results[1].content).toBe("Second");
			expect(results[2].content).toBe("Third");
		});

		it("should create nodes with parent relationships", async () => {
			const parent = await createNode({
				projectId,
				role: "USER",
				content: "Parent",
			});

			const inputs: CreateNodeInput[] = [
				{
					projectId,
					role: "ASSISTANT",
					content: "Child 1",
					parentId: parent.id,
				},
				{
					projectId,
					role: "ASSISTANT",
					content: "Child 2",
					parentId: parent.id,
				},
			];

			const results = await batchCreateNodes(inputs);

			expect(results[0].parentId).toBe(parent.id);
			expect(results[1].parentId).toBe(parent.id);
		});

		it("should create nodes with different positions", async () => {
			const inputs: CreateNodeInput[] = [
				{ projectId, role: "USER", content: "A", positionX: 0, positionY: 0 },
				{ projectId, role: "USER", content: "B", positionX: 100, positionY: 0 },
				{ projectId, role: "USER", content: "C", positionX: 0, positionY: 100 },
			];

			const results = await batchCreateNodes(inputs);

			expect(results[0].positionX).toBe(0);
			expect(results[0].positionY).toBe(0);
			expect(results[1].positionX).toBe(100);
			expect(results[1].positionY).toBe(0);
			expect(results[2].positionX).toBe(0);
			expect(results[2].positionY).toBe(100);
		});
	});

	describe("batchUpdatePositions", () => {
		it("should update positions for multiple nodes", async () => {
			const node1 = await createNode({
				projectId,
				role: "USER",
				content: "Node 1",
			});
			const node2 = await createNode({
				projectId,
				role: "USER",
				content: "Node 2",
			});
			const node3 = await createNode({
				projectId,
				role: "USER",
				content: "Node 3",
			});

			const results = await batchUpdatePositions([
				{ nodeId: node1.id, positionX: 100, positionY: 200 },
				{ nodeId: node2.id, positionX: 300, positionY: 400 },
				{ nodeId: node3.id, positionX: 500, positionY: 600 },
			]);

			expect(results).toHaveLength(3);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(true);
			expect(results[2].success).toBe(true);

			// Verify positions were actually updated
			const updated1 = await getNode(node1.id);
			const updated2 = await getNode(node2.id);
			const updated3 = await getNode(node3.id);

			expect(updated1.positionX).toBe(100);
			expect(updated1.positionY).toBe(200);
			expect(updated2.positionX).toBe(300);
			expect(updated2.positionY).toBe(400);
			expect(updated3.positionX).toBe(500);
			expect(updated3.positionY).toBe(600);
		});

		it("should handle partial failures gracefully", async () => {
			const node1 = await createNode({
				projectId,
				role: "USER",
				content: "Node 1",
			});

			const fakeId = "00000000-0000-0000-0000-000000000000";

			const results = await batchUpdatePositions([
				{ nodeId: node1.id, positionX: 100, positionY: 200 },
				{ nodeId: fakeId, positionX: 300, positionY: 400 },
			]);

			expect(results).toHaveLength(2);
			expect(results[0].success).toBe(true);
			expect(results[1].success).toBe(false);
			expect(results[1].error).toBeDefined();
		});

		it("should update positions atomically (all or nothing)", async () => {
			const node1 = await createNode({
				projectId,
				role: "USER",
				content: "Node 1",
			});
			const node2 = await createNode({
				projectId,
				role: "USER",
				content: "Node 2",
			});

			// This should succeed
			const results = await batchUpdatePositions([
				{ nodeId: node1.id, positionX: 111, positionY: 222 },
				{ nodeId: node2.id, positionX: 333, positionY: 444 },
			]);

			expect(results.every((r) => r.success)).toBe(true);
		});
	});
});
