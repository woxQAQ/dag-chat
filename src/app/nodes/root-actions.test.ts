/**
 * UI-NEW-001: Root Node Creation Server Action Tests
 *
 * Tests for the createRootNode Server Action.
 */

import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createProject } from "@/lib/project-crud";
import { createRootNode } from "./root-actions";

// Mock revalidatePath
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("createRootNode Server Action", () => {
	let testProjectId: string;

	// Clean up database before each test
	beforeEach(async () => {
		// Delete all nodes first
		await prisma.node.deleteMany({});
		// Then delete all projects
		await prisma.project.deleteMany({});

		// Create a test project for each test
		const project = await createProject({ name: "Test Project" });
		testProjectId = project.id;
	});

	// Clean up all test data after all tests in this file complete
	afterAll(async () => {
		await prisma.node.deleteMany({});
		await prisma.project.deleteMany({});
	});

	describe("Success Cases", () => {
		it("should create root node for empty project", async () => {
			const positionX = 100;
			const positionY = 200;
			const content = "Test prompt";

			const result = await createRootNode({
				projectId: testProjectId,
				content,
				positionX,
				positionY,
			});

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.nodeId).toBeDefined();
			expect(result.data?.positionX).toBe(positionX);
			expect(result.data?.positionY).toBe(positionY);
		});

		it("should set project.rootNodeId after creation", async () => {
			await createRootNode({
				projectId: testProjectId,
				content: "Root node content",
				positionX: 0,
				positionY: 0,
			});

			// Refresh project from database
			const project = await prisma.project.findUnique({
				where: { id: testProjectId },
			});

			expect(project?.rootNodeId).toBeDefined();
			expect(project?.rootNodeId).not.toBeNull();
		});

		it("should create USER role node", async () => {
			const result = await createRootNode({
				projectId: testProjectId,
				content: "User message",
				positionX: 0,
				positionY: 0,
			});

			if (result.success && result.data) {
				const node = await prisma.node.findUnique({
					where: { id: result.data.nodeId },
				});

				expect(node?.role).toBe("USER");
			}
		});

		it("should create node with content from prompt", async () => {
			const testContent = "What is the meaning of life?";
			const result = await createRootNode({
				projectId: testProjectId,
				content: testContent,
				positionX: 0,
				positionY: 0,
			});

			if (result.success && result.data) {
				const node = await prisma.node.findUnique({
					where: { id: result.data.nodeId },
				});

				expect(node?.content).toBe(testContent);
			}
		});

		it("should create node with isRoot metadata", async () => {
			const result = await createRootNode({
				projectId: testProjectId,
				content: "Test",
				positionX: 0,
				positionY: 0,
			});

			if (result.success && result.data) {
				const node = await prisma.node.findUnique({
					where: { id: result.data.nodeId },
				});

				expect(node?.metadata).toEqual({ isRoot: true });
			}
		});

		it("should create node with no parentId (root)", async () => {
			const result = await createRootNode({
				projectId: testProjectId,
				content: "Test",
				positionX: 0,
				positionY: 0,
			});

			if (result.success && result.data) {
				const node = await prisma.node.findUnique({
					where: { id: result.data.nodeId },
				});

				expect(node?.parentId).toBeNull();
			}
		});

		it("should create node with specified position", async () => {
			const positionX = 150;
			const positionY = 300;

			const result = await createRootNode({
				projectId: testProjectId,
				content: "Position test",
				positionX,
				positionY,
			});

			if (result.success && result.data) {
				const node = await prisma.node.findUnique({
					where: { id: result.data.nodeId },
				});

				expect(node?.positionX).toBe(positionX);
				expect(node?.positionY).toBe(positionY);
			}
		});
	});

	describe("Forest Structure Support", () => {
		it("should allow creating multiple root nodes", async () => {
			// Create first root node
			const root1 = await createRootNode({
				projectId: testProjectId,
				content: "First root",
				positionX: 0,
				positionY: 0,
			});
			expect(root1.success).toBe(true);

			// Try to create another root node
			const root2 = await createRootNode({
				projectId: testProjectId,
				content: "Second root",
				positionX: 100,
				positionY: 100,
			});

			expect(root2.success).toBe(true);
			expect(root2.data?.nodeId).toBeDefined();
			expect(root2.data?.nodeId).not.toBe(root1.data?.nodeId);

			// Verify both are roots
			const node1 = await prisma.node.findUnique({
				where: { id: root1.data?.nodeId },
			});
			const node2 = await prisma.node.findUnique({
				where: { id: root2.data?.nodeId },
			});

			expect(node1?.parentId).toBeNull();
			expect(node2?.parentId).toBeNull();
		});

		it("should reject if project does not exist", async () => {
			const fakeProjectId = "00000000-0000-0000-0000-000000000000";

			const result = await createRootNode({
				projectId: fakeProjectId,
				content: "Test",
				positionX: 0,
				positionY: 0,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("should reject invalid project ID format", async () => {
			const result = await createRootNode({
				projectId: "invalid-uuid",
				content: "Test",
				positionX: 0,
				positionY: 0,
			});

			expect(result.success).toBe(false);
		});
	});

	describe("Position Handling", () => {
		it("should accept zero position", async () => {
			const result = await createRootNode({
				projectId: testProjectId,
				content: "Zero position test",
				positionX: 0,
				positionY: 0,
			});

			expect(result.success).toBe(true);
			expect(result.data?.positionX).toBe(0);
			expect(result.data?.positionY).toBe(0);
		});

		it("should accept negative positions", async () => {
			const result = await createRootNode({
				projectId: testProjectId,
				content: "Negative position test",
				positionX: -100,
				positionY: -200,
			});

			expect(result.success).toBe(true);
			expect(result.data?.positionX).toBe(-100);
			expect(result.data?.positionY).toBe(-200);
		});

		it("should accept very large positions", async () => {
			const result = await createRootNode({
				projectId: testProjectId,
				content: "Large position test",
				positionX: 999999,
				positionY: 999999,
			});

			expect(result.success).toBe(true);
		});
	});
});
