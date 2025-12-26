import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";

// Clean up all test data after all tests in this file complete
afterAll(async () => {
	await prisma.node.deleteMany({});
	await prisma.project.deleteMany({});
});

describe("Database Schema - Project", () => {
	let _projectId: string;

	afterEach(async () => {
		// Clean up all test data
		await prisma.node.deleteMany({});
		await prisma.project.deleteMany({});
	});

	it("should create a project with default values", async () => {
		const project = await prisma.project.create({
			data: {},
		});

		expect(project.id).toBeDefined();
		expect(project.name).toBe("Untitled Project");
		expect(project.description).toBeNull();
		expect(project.createdAt).toBeInstanceOf(Date);
		expect(project.updatedAt).toBeInstanceOf(Date);
		expect(project.rootNodeId).toBeNull();
	});

	it("should create a project with custom name and description", async () => {
		const project = await prisma.project.create({
			data: {
				name: "Test Project",
				description: "This is a test project",
			},
		});

		expect(project.name).toBe("Test Project");
		expect(project.description).toBe("This is a test project");
	});

	it("should fetch a project by id", async () => {
		const created = await prisma.project.create({
			data: { name: "Fetch Test" },
		});

		const fetched = await prisma.project.findUnique({
			where: { id: created.id },
		});

		expect(fetched).not.toBeNull();
		expect(fetched?.name).toBe("Fetch Test");
	});

	it("should update a project", async () => {
		const project = await prisma.project.create({
			data: { name: "Original Name" },
		});

		const updated = await prisma.project.update({
			where: { id: project.id },
			data: { name: "Updated Name" },
		});

		expect(updated.name).toBe("Updated Name");
	});

	it("should delete a project", async () => {
		const project = await prisma.project.create({
			data: { name: "To Delete" },
		});

		await prisma.project.delete({
			where: { id: project.id },
		});

		const found = await prisma.project.findUnique({
			where: { id: project.id },
		});

		expect(found).toBeNull();
	});

	it("should cascade delete nodes when project is deleted", async () => {
		const project = await prisma.project.create({
			data: {
				name: "Cascade Test",
				nodes: {
					create: [
						{ role: "USER", content: "Hello" },
						{ role: "ASSISTANT", content: "Hi there" },
					],
				},
			},
		});

		const nodeCountBefore = await prisma.node.count({
			where: { projectId: project.id },
		});
		expect(nodeCountBefore).toBe(2);

		await prisma.project.delete({
			where: { id: project.id },
		});

		const nodeCountAfter = await prisma.node.count({
			where: { projectId: project.id },
		});
		expect(nodeCountAfter).toBe(0);
	});
});

describe("Database Schema - Node", () => {
	let projectId: string;

	beforeEach(async () => {
		const project = await prisma.project.create({
			data: { name: "Test Project" },
		});
		projectId = project.id;
	});

	afterEach(async () => {
		await prisma.node.deleteMany({});
		await prisma.project.deleteMany({});
	});

	it("should create a root node (no parent)", async () => {
		const node = await prisma.node.create({
			data: {
				projectId,
				role: "USER",
				content: "Hello, world!",
			},
		});

		expect(node.id).toBeDefined();
		expect(node.role).toBe("USER");
		expect(node.content).toBe("Hello, world!");
		expect(node.parentId).toBeNull();
		expect(node.positionX).toBe(0);
		expect(node.positionY).toBe(0);
	});

	it("should create a node with custom position", async () => {
		const node = await prisma.node.create({
			data: {
				projectId,
				role: "ASSISTANT",
				content: "Response",
				positionX: 100,
				positionY: 200,
			},
		});

		expect(node.positionX).toBe(100);
		expect(node.positionY).toBe(200);
	});

	it("should create a node with metadata", async () => {
		const metadata = {
			tokenCount: 42,
			model: "gpt-4",
			timestamp: "2024-01-01T00:00:00Z",
		};

		const node = await prisma.node.create({
			data: {
				projectId,
				role: "ASSISTANT",
				content: "AI response",
				metadata,
			},
		});

		expect(node.metadata).toEqual(metadata);
	});

	it("should create a child node (tree structure)", async () => {
		const parent = await prisma.node.create({
			data: {
				projectId,
				role: "USER",
				content: "Parent message",
			},
		});

		const child = await prisma.node.create({
			data: {
				projectId,
				parentId: parent.id,
				role: "ASSISTANT",
				content: "Child response",
			},
		});

		expect(child.parentId).toBe(parent.id);
	});

	it("should fetch node with parent relation", async () => {
		const parent = await prisma.node.create({
			data: {
				projectId,
				role: "USER",
				content: "Question",
			},
		});

		const child = await prisma.node.create({
			data: {
				projectId,
				parentId: parent.id,
				role: "ASSISTANT",
				content: "Answer",
			},
		});

		const childWithParent = await prisma.node.findUnique({
			where: { id: child.id },
			include: { parent: true },
		});

		expect(childWithParent?.parent).not.toBeNull();
		expect(childWithParent?.parent?.id).toBe(parent.id);
	});

	it("should fetch node with children relation", async () => {
		const parent = await prisma.node.create({
			data: {
				projectId,
				role: "USER",
				content: "Question",
			},
		});

		await prisma.node.createMany({
			data: [
				{
					projectId,
					parentId: parent.id,
					role: "ASSISTANT",
					content: "Answer 1",
				},
				{
					projectId,
					parentId: parent.id,
					role: "ASSISTANT",
					content: "Answer 2",
				},
			],
		});

		const parentWithChildren = await prisma.node.findUnique({
			where: { id: parent.id },
			include: { children: true },
		});

		expect(parentWithChildren?.children).toHaveLength(2);
	});

	it("should cascade delete children when parent is deleted", async () => {
		const parent = await prisma.node.create({
			data: {
				projectId,
				role: "USER",
				content: "Parent",
			},
		});

		await prisma.node.create({
			data: {
				projectId,
				parentId: parent.id,
				role: "ASSISTANT",
				content: "Child",
			},
		});

		await prisma.node.delete({
			where: { id: parent.id },
		});

		const childCount = await prisma.node.count({
			where: { parentId: parent.id },
		});
		expect(childCount).toBe(0);
	});

	it("should update node position", async () => {
		const node = await prisma.node.create({
			data: {
				projectId,
				role: "USER",
				content: "Drag me",
			},
		});

		const updated = await prisma.node.update({
			where: { id: node.id },
			data: { positionX: 300, positionY: 400 },
		});

		expect(updated.positionX).toBe(300);
		expect(updated.positionY).toBe(400);
	});

	it("should support all role types", async () => {
		const systemNode = await prisma.node.create({
			data: { projectId, role: "SYSTEM", content: "System prompt" },
		});
		const userNode = await prisma.node.create({
			data: { projectId, role: "USER", content: "User message" },
		});
		const assistantNode = await prisma.node.create({
			data: { projectId, role: "ASSISTANT", content: "AI response" },
		});

		expect(systemNode.role).toBe("SYSTEM");
		expect(userNode.role).toBe("USER");
		expect(assistantNode.role).toBe("ASSISTANT");
	});
});

describe("Database Schema - Tree Traversal", () => {
	let projectId: string;
	let rootNode: string;
	let branch1: string;
	let _branch2: string;

	beforeEach(async () => {
		const project = await prisma.project.create({
			data: { name: "Tree Test" },
		});
		projectId = project.id;

		// Create tree structure:
		//     root
		//    /    \
		// branch1 branch2
		rootNode = (
			await prisma.node.create({
				data: { projectId, role: "USER", content: "Root" },
			})
		).id;

		branch1 = (
			await prisma.node.create({
				data: {
					projectId,
					parentId: rootNode,
					role: "ASSISTANT",
					content: "Branch 1",
				},
			})
		).id;

		_branch2 = (
			await prisma.node.create({
				data: {
					projectId,
					parentId: rootNode,
					role: "ASSISTANT",
					content: "Branch 2",
				},
			})
		).id;
	});

	afterEach(async () => {
		await prisma.node.deleteMany({});
		await prisma.project.deleteMany({});
	});

	it("should query tree structure with recursive CTE", async () => {
		// Get all descendants of root
		const tree = await prisma.$queryRaw<
			{ id: string; content: string; depth: number }[]
		>`
			WITH RECURSIVE tree AS (
				SELECT id, content, 0 as depth
				FROM nodes
				WHERE id = ${rootNode}
				UNION ALL
				SELECT n.id, n.content, t.depth + 1
				FROM nodes n
				JOIN tree t ON n."parentId" = t.id
			)
			SELECT * FROM tree ORDER BY depth, content
		`;

		expect(tree).toHaveLength(3);
		expect(tree[0].depth).toBe(0);
		expect(tree[1].depth).toBe(1);
		expect(tree[2].depth).toBe(1);
	});

	it("should get path from root to a node", async () => {
		// Add a child to branch1
		const leaf = await prisma.node.create({
			data: {
				projectId,
				parentId: branch1,
				role: "USER",
				content: "Leaf",
			},
		});

		const path = await prisma.$queryRaw<{ id: string; content: string }[]>`
			WITH RECURSIVE path AS (
				SELECT id, content, "parentId"
				FROM nodes
				WHERE id = ${leaf.id}
				UNION ALL
				SELECT n.id, n.content, n."parentId"
				FROM nodes n
				JOIN path p ON n.id = p."parentId"
			)
			SELECT * FROM path
		`;

		expect(path).toHaveLength(3);
		expect(path[0].content).toBe("Leaf");
		expect(path[1].content).toBe("Branch 1");
		expect(path[2].content).toBe("Root");
	});
});
