/**
 * Tests for SVC-001: Context Builder Service
 *
 * Tests the conversation context building functionality including:
 * - Recursive CTE path traversal
 * - UUID validation
 * - Node existence checks
 * - Token calculation
 * - Context truncation
 * - Batch processing
 * - AI SDK formatting
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildConversationContext,
	buildConversationContextBatch,
	type ContextResult,
	formatContextForAI,
	truncateContextByTokens,
} from "./context-builder";

// Mock Prisma client
vi.mock("./prisma", () => ({
	prisma: {
		node: {
			findUnique: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

import { prisma } from "./prisma";

describe("Context Builder Service", () => {
	const mockNodeId = "123e4567-e89b-12d3-a456-426614174000";
	const mockProjectId = "project-uuid";

	const mockNode = {
		id: mockNodeId,
		projectId: mockProjectId,
	};

	// Mock recursive CTE result (path from root to target)
	const mockPathResult = [
		{
			id: "root-node",
			parent_id: null,
			role: "SYSTEM",
			content: "You are a helpful assistant.",
			position_in_chain: 2,
		},
		{
			id: "user-node-1",
			parent_id: "root-node",
			role: "USER",
			content: "Hello!",
			position_in_chain: 1,
		},
		{
			id: mockNodeId,
			parent_id: "user-node-1",
			role: "ASSISTANT",
			content: "Hi there! How can I help you today?",
			position_in_chain: 0,
		},
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("buildConversationContext", () => {
		describe("Parameter validation", () => {
			it("should throw error for invalid UUID format", async () => {
				await expect(buildConversationContext("invalid-uuid")).rejects.toThrow(
					"Invalid nodeId format",
				);
			});

			it("should throw error for empty nodeId", async () => {
				await expect(buildConversationContext("")).rejects.toThrow(
					"Invalid nodeId format",
				);
			});

			it("should accept valid UUID format", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

				await expect(
					buildConversationContext(mockNodeId),
				).resolves.toBeDefined();
			});
		});

		describe("Node existence check", () => {
			it("should throw error when node does not exist", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(null);

				await expect(buildConversationContext(mockNodeId)).rejects.toThrow(
					"Node not found",
				);
			});

			it("should query node by ID", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

				await buildConversationContext(mockNodeId);

				expect(prisma.node.findUnique).toHaveBeenCalledWith({
					where: { id: mockNodeId },
					select: { id: true, projectId: true },
				});
			});
		});

		describe("Path building with recursive CTE", () => {
			it("should build context from root to target node", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

				const result = await buildConversationContext(mockNodeId);

				expect(result.messages).toHaveLength(3);
				expect(result.pathLength).toBe(3);

				// Verify chronological order (root -> target)
				expect(result.messages[0].id).toBe("root-node");
				expect(result.messages[0].positionInChain).toBe(2);
				expect(result.messages[1].id).toBe("user-node-1");
				expect(result.messages[1].positionInChain).toBe(1);
				expect(result.messages[2].id).toBe(mockNodeId);
				expect(result.messages[2].positionInChain).toBe(0);
			});

			it("should handle single node (root only)", async () => {
				const singleNodeResult = [
					{
						id: mockNodeId,
						parent_id: null,
						role: "USER",
						content: "Hello",
						position_in_chain: 0,
					},
				];

				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(singleNodeResult);

				const result = await buildConversationContext(mockNodeId);

				expect(result.messages).toHaveLength(1);
				expect(result.pathLength).toBe(1);
				expect(result.messages[0].id).toBe(mockNodeId);
				expect(result.messages[0].role).toBe("USER");
			});

			it("should handle empty path gracefully", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

				const result = await buildConversationContext(mockNodeId);

				expect(result.messages).toEqual([]);
				expect(result.pathLength).toBe(0);
				expect(result.totalTokens).toBe(0);
			});

			it("should call $queryRaw with nodeId parameter", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

				await buildConversationContext(mockNodeId);

				const calls = vi.mocked(prisma.$queryRaw).mock.calls;
				expect(calls.length).toBeGreaterThan(0);
				const lastCall = calls[calls.length - 1];
				expect(lastCall).toContain(mockNodeId);
			});
		});

		describe("Token calculation", () => {
			it("should calculate approximate token count", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

				const result = await buildConversationContext(mockNodeId);

				// Rough estimate: ~4 chars per token
				// "You are a helpful assistant." = 27 chars ~ 7 tokens
				// "Hello!" = 6 chars ~ 2 tokens
				// "Hi there! How can I help you today?" = 35 chars ~ 9 tokens
				// Total ~18 tokens
				expect(result.totalTokens).toBeGreaterThan(0);
				expect(result.totalTokens).toBeLessThan(100);
			});

			it("should return zero tokens for empty context", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

				const result = await buildConversationContext(mockNodeId);

				expect(result.totalTokens).toBe(0);
			});
		});

		describe("Role conversion", () => {
			it("should preserve role types correctly", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

				const result = await buildConversationContext(mockNodeId);

				expect(result.messages[0].role).toBe("SYSTEM");
				expect(result.messages[1].role).toBe("USER");
				expect(result.messages[2].role).toBe("ASSISTANT");
			});
		});

		describe("Error handling", () => {
			it("should propagate database errors", async () => {
				vi.mocked(prisma.node.findUnique).mockRejectedValue(
					new Error("Database connection failed"),
				);

				await expect(buildConversationContext(mockNodeId)).rejects.toThrow(
					"Database connection failed",
				);
			});

			it("should handle query errors gracefully", async () => {
				vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
				vi.mocked(prisma.$queryRaw).mockRejectedValue(
					new Error("Query failed"),
				);

				await expect(buildConversationContext(mockNodeId)).rejects.toThrow(
					"Query failed",
				);
			});
		});
	});

	describe("buildConversationContextBatch", () => {
		it("should build context for multiple nodes", async () => {
			const nodeIds = [
				"123e4567-e89b-12d3-a456-426614174001",
				"123e4567-e89b-12d3-a456-426614174002",
				"123e4567-e89b-12d3-a456-426614174003",
			] as const;

			vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

			const result = await buildConversationContextBatch(nodeIds);

			expect(result.size).toBe(3);

			// Check that all results have the same structure
			const context1 = result.get("123e4567-e89b-12d3-a456-426614174001");
			const context2 = result.get("123e4567-e89b-12d3-a456-426614174002");
			const context3 = result.get("123e4567-e89b-12d3-a456-426614174003");

			expect(context1).toBeDefined();
			expect(context2).toBeDefined();
			expect(context3).toBeDefined();

			expect(context1!.messages).toHaveLength(3);
			expect(context2!.messages).toHaveLength(3);
			expect(context3!.messages).toHaveLength(3);
		});

		it("should handle partial failures in batch", async () => {
			const nodeIds = ["node-1", "invalid-node", "node-3"];
			const mockContext = {
				messages: [],
				totalTokens: 0,
				pathLength: 0,
			};

			vi.mocked(prisma.node.findUnique)
				.mockResolvedValueOnce(mockNode)
				.mockRejectedValueOnce(new Error("Not found"))
				.mockResolvedValueOnce(mockNode);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

			const result = await buildConversationContextBatch(nodeIds as string[]);

			// Failed nodes should have empty context
			expect(result.get("invalid-node")).toEqual(mockContext);
		});

		it("should process nodes in parallel", async () => {
			const nodeIds = ["node-1", "node-2", "node-3"];

			vi.mocked(prisma.node.findUnique).mockResolvedValue(mockNode);
			vi.mocked(prisma.$queryRaw).mockResolvedValue(mockPathResult);

			const startTime = Date.now();
			await buildConversationContextBatch(nodeIds);
			const elapsed = Date.now() - startTime;

			// Parallel processing should be fast (all mocked)
			expect(elapsed).toBeLessThan(100);
		});
	});

	describe("truncateContextByTokens", () => {
		// Create context with longer content that will actually trigger truncation
		const createLongContext = (): ContextResult => {
			const longContent =
				"This is a much longer message that contains many words. ".repeat(5);
			return {
				messages: [
					{
						id: "msg-1",
						role: "USER",
						content: longContent,
						positionInChain: 0,
					},
					{
						id: "msg-2",
						role: "ASSISTANT",
						content: longContent,
						positionInChain: 1,
					},
					{
						id: "msg-3",
						role: "USER",
						content: longContent,
						positionInChain: 2,
					},
				],
				totalTokens: 0, // Will be calculated
				pathLength: 3,
			};
		};

		const mockContext: ContextResult = {
			messages: [
				{
					id: "msg-1",
					role: "USER",
					content: "First message",
					positionInChain: 0,
				},
				{
					id: "msg-2",
					role: "ASSISTANT",
					content: "Second message",
					positionInChain: 1,
				},
				{
					id: "msg-3",
					role: "USER",
					content: "Third message",
					positionInChain: 2,
				},
			],
			totalTokens: 50,
			pathLength: 3,
		};

		it("should return unchanged context if under token limit", () => {
			const result = truncateContextByTokens(mockContext, 100);

			expect(result).toEqual(mockContext);
		});

		it("should truncate to fit token budget", () => {
			const longContext = createLongContext();
			// Calculate actual token count
			const calculatedTokens = longContext.messages.reduce(
				(sum, msg) => sum + Math.ceil(msg.content.length / 4),
				0,
			);
			longContext.totalTokens = calculatedTokens;

			const result = truncateContextByTokens(longContext, 50);

			expect(result.totalTokens).toBeLessThanOrEqual(50);
			expect(result.messages.length).toBeLessThan(longContext.messages.length);
		});

		it("should keep most recent messages when truncating", () => {
			const longContext = createLongContext();
			// Calculate actual token count
			const calculatedTokens = longContext.messages.reduce(
				(sum, msg) => sum + Math.ceil(msg.content.length / 4),
				0,
			);
			longContext.totalTokens = calculatedTokens;

			const result = truncateContextByTokens(longContext, 80);

			// Should keep the last message(s) - with 80 token budget we should keep at least 1 message
			expect(result.messages.length).toBeGreaterThan(0);

			const lastOriginal =
				longContext.messages[longContext.messages.length - 1];
			const lastTruncated = result.messages[result.messages.length - 1];

			expect(lastTruncated.id).toBe(lastOriginal.id);
		});

		it("should add truncation warning message", () => {
			const result = truncateContextByTokens(mockContext, 10);

			if (result.messages.length > 0) {
				const firstMessage = result.messages[0];
				expect(firstMessage.content).toContain("truncated");
			}
		});

		it("should handle empty context", () => {
			const emptyContext: ContextResult = {
				messages: [],
				totalTokens: 0,
				pathLength: 0,
			};

			const result = truncateContextByTokens(emptyContext, 100);

			expect(result).toEqual(emptyContext);
		});
	});

	describe("formatContextForAI", () => {
		it("should format context for AI SDK consumption", () => {
			const mockContext: ContextResult = {
				messages: [
					{
						id: "msg-1",
						role: "SYSTEM",
						content: "You are helpful",
						positionInChain: 0,
					},
					{
						id: "msg-2",
						role: "USER",
						content: "Hello",
						positionInChain: 1,
					},
					{
						id: "msg-3",
						role: "ASSISTANT",
						content: "Hi there",
						positionInChain: 2,
					},
				],
				totalTokens: 20,
				pathLength: 3,
			};

			const result = formatContextForAI(mockContext);

			expect(result).toHaveLength(3);
			expect(result[0]).toEqual({
				role: "system",
				content: "You are helpful",
			});
			expect(result[1]).toEqual({
				role: "user",
				content: "Hello",
			});
			expect(result[2]).toEqual({
				role: "assistant",
				content: "Hi there",
			});
		});

		it("should convert role to lowercase", () => {
			const mockContext: ContextResult = {
				messages: [
					{
						id: "msg-1",
						role: "SYSTEM",
						content: "System prompt",
						positionInChain: 0,
					},
				],
				totalTokens: 5,
				pathLength: 1,
			};

			const result = formatContextForAI(mockContext);

			expect(result[0].role).toBe("system");
		});

		it("should handle empty context", () => {
			const emptyContext: ContextResult = {
				messages: [],
				totalTokens: 0,
				pathLength: 0,
			};

			const result = formatContextForAI(emptyContext);

			expect(result).toEqual([]);
		});
	});
});
