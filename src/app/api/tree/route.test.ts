/**
 * Tests for API-002: Tree Retrieval Endpoint
 *
 * Tests the GET /api/tree endpoint functionality including:
 * - UUID validation
 * - Conversation existence check
 * - Tree building logic
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
	prisma: {
		conversation: {
			findUnique: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

// Import mocked prisma after the mock is defined
import { prisma } from "@/lib/prisma";

describe("GET /api/tree", () => {
	const mockConversationId = "123e4567-e89b-12d3-a456-426614174000";
	const mockConversation = {
		id: mockConversationId,
		title: "Test Conversation",
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockNodes = [
		{
			id: "node-1",
			conversation_id: mockConversationId,
			parent_id: null,
			role: "user",
			content: "Hello",
			created_at: new Date("2025-01-01T10:00:00Z"),
		},
		{
			id: "node-2",
			conversation_id: mockConversationId,
			parent_id: "node-1",
			role: "assistant",
			content: "Hi there!",
			created_at: new Date("2025-01-01T10:00:01Z"),
		},
		{
			id: "node-3",
			conversation_id: mockConversationId,
			parent_id: "node-1",
			role: "user",
			content: "How are you?",
			created_at: new Date("2025-01-01T10:00:02Z"),
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Parameter validation", () => {
		it("should return 400 when conversationId is missing", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/tree",
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({ error: "conversationId is required" });
		});

		it("should return 400 for invalid UUID format", async () => {
			const request = new NextRequest(
				"http://localhost:3000/api/tree?conversationId=invalid-uuid",
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({ error: "Invalid conversationId format" });
		});

		it("should accept valid UUID format", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);

			expect(response.status).not.toBe(400);
		});
	});

	describe("Conversation existence", () => {
		it("should return 404 when conversation does not exist", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				null,
			);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data).toEqual({ error: "Conversation not found" });
			expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
				where: { id: mockConversationId },
			});
		});

		it("should proceed when conversation exists", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);

			expect(response.status).not.toBe(404);
		});
	});

	describe("Tree building logic", () => {
		it("should return empty tree for conversation with no nodes", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.tree).toEqual([]);
			expect(data.nodeCount).toBe(0);
		});

		it("should build tree with single root node", async () => {
			const singleNode = [mockNodes[0]];
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(singleNode);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.tree).toHaveLength(1);
			expect(data.tree[0]).toMatchObject({
				id: "node-1",
				parentId: null,
				role: "user",
				content: "Hello",
			});
			expect(data.tree[0].children).toEqual([]);
			expect(data.nodeCount).toBe(1);
		});

		it("should build tree with parent-child relationships", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.tree).toHaveLength(1);
			expect(data.tree[0].id).toBe("node-1");
			expect(data.tree[0].children).toHaveLength(2);
			expect(data.tree[0].children[0].id).toBe("node-2");
			expect(data.tree[0].children[1].id).toBe("node-3");
			expect(data.nodeCount).toBe(3);
		});

		it("should handle orphaned nodes as root nodes", async () => {
			const orphanedNodes = [
				mockNodes[1], // node-2 has parent_id but parent not in list
				mockNodes[2], // node-3 has parent_id but parent not in list
			];
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(orphanedNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			// Both nodes should be treated as roots since their parent is not found
			expect(data.tree).toHaveLength(2);
			expect(data.nodeCount).toBe(2);
		});

		it("should include conversationId in response", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(data.conversationId).toBe(mockConversationId);
		});

		it("should convert role strings correctly", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			const userNode = data.tree[0].children.find(
				(n: { id: string }) => n.id === "node-3",
			);
			expect(userNode?.role).toBe("user");

			const assistantNode = data.tree[0].children.find(
				(n: { id: string }) => n.id === "node-2",
			);
			expect(assistantNode?.role).toBe("assistant");
		});
	});

	describe("Error handling", () => {
		it("should return 500 on database error", async () => {
			vi.mocked(prisma.conversation.findUnique).mockRejectedValue(
				new Error("Database connection failed"),
			);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to fetch conversation tree");
			expect(data.details).toBe("Database connection failed");
		});

		it("should handle query errors gracefully", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockRejectedValue(
				new Error("Query failed"),
			);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe("Failed to fetch conversation tree");
		});
	});

	describe("Prisma query parameters", () => {
		it("should query with correct UUID parameter", async () => {
			vi.mocked(prisma.conversation.findUnique).mockResolvedValue(
				mockConversation,
			);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockNodes);

			const request = new NextRequest(
				`http://localhost:3000/api/tree?conversationId=${mockConversationId}`,
			);
			await GET(request);

			// $queryRaw is called with template literal which splits the SQL
			// The conversationId is passed as the last argument
			const calls = vi.mocked(prisma.$queryRaw).mock.calls;
			expect(calls.length).toBeGreaterThan(0);
			// The last argument should be the conversationId
			const lastCall = calls[calls.length - 1];
			expect(lastCall).toContain(mockConversationId);
		});
	});
});
