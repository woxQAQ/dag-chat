/**
 * AI-001: AI Streaming Service Tests
 *
 * Tests for the AI streaming service and chat API route.
 */

import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { prisma } from "@/lib/prisma";

// Mock environment variables
process.env.DEEPSEEK_API_KEY = "test-api-key";
process.env.DEEPSEEK_MODEL = "deepseek-chat";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
	prisma: {
		project: {
			findUnique: vi.fn(),
		},
		node: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			count: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

describe("AI-001: AI Streaming Service", () => {
	describe("POST /api/chat", () => {
		beforeAll(() => {
			// Setup default mocks
			vi.mocked(prisma.node.findUnique).mockResolvedValue({
				id: "parent-node-id",
				projectId: "test-project-id",
				parentId: null,
				role: "USER",
				content: "Hello",
				positionX: 0,
				positionY: 0,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			vi.mocked(prisma.project.findUnique).mockResolvedValue({
				id: "test-project-id",
				name: "Test Project",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			vi.mocked(prisma.node.create).mockResolvedValue({
				id: "new-ai-node-id",
				projectId: "test-project-id",
				parentId: "parent-node-id",
				role: "ASSISTANT",
				content: "",
				positionX: 100,
				positionY: 200,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			vi.mocked(prisma.$queryRaw).mockResolvedValue([
				{
					id: "parent-node-id",
					parent_id: null,
					role: "USER",
					content: "Hello",
					position_in_chain: 0,
				},
			]);
		});

		it("should return 400 if projectId is missing", async () => {
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					parentNodeId: "parent-node-id",
					message: "Hello!",
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("projectId is required");
		});

		it("should return 400 if parentNodeId is missing", async () => {
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					projectId: "test-project-id",
					message: "Hello!",
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("parentNodeId is required");
		});

		it("should return 400 if message is missing", async () => {
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					projectId: "test-project-id",
					parentNodeId: "parent-node-id",
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("message is required");
		});

		it("should return 400 if message is not a string", async () => {
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					projectId: "test-project-id",
					parentNodeId: "parent-node-id",
					message: 123,
				}),
			});

			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBe("message is required");
		});

		it("should validate required fields successfully", async () => {
			// Note: This test will fail to actually stream since we're not mocking the AI SDK
			// but it validates the request parsing and validation logic
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					projectId: "test-project-id",
					parentNodeId: "parent-node-id",
					message: "Hello, AI!",
				}),
			});

			// The response will error due to missing AI SDK mock, but validation passes
			const response = await POST(request);

			// Should not be a 400 validation error
			expect(response.status).not.toBe(400);
		});

		it("should accept optional provider parameter", async () => {
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					projectId: "test-project-id",
					parentNodeId: "parent-node-id",
					message: "Hello!",
					provider: "anthropic",
				}),
			});

			const response = await POST(request);
			expect(response.status).not.toBe(400);
		});

		it("should accept optional position parameters", async () => {
			const request = new NextRequest("http://localhost:3000/api/chat", {
				method: "POST",
				body: JSON.stringify({
					projectId: "test-project-id",
					parentNodeId: "parent-node-id",
					message: "Hello!",
					positionX: 100,
					positionY: 200,
				}),
			});

			const response = await POST(request);
			expect(response.status).not.toBe(400);
		});
	});

	describe("GET /api/chat - health check", () => {
		it("should return health check status", async () => {
			const { GET } = await import("@/app/api/chat/route");
			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.status).toBe("ok");
			expect(data.version).toBeDefined();
			expect(data.endpoints).toBeDefined();
		});
	});
});
