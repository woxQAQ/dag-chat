/**
 * AI-001: Chat API Route Handler
 *
 * POST /api/chat
 *
 * Handles streaming AI chat requests with context building and node persistence.
 *
 * Request body:
 * - projectId: string - The project ID for node creation
 * - parentNodeId: string - The parent user node ID (for context building)
 * - message: string - The user's message
 * - provider?: "deepseek" | "anthropic" | "openai" - AI provider
 * - model?: string - Model name override
 * - positionX?: number - X position for the AI node on canvas
 * - positionY?: number - Y position for the AI node on canvas
 */

import type { NextRequest } from "next/server";
import { getDefaultProvider, streamChatWithNode } from "@/lib/ai-stream";
import {
	buildConversationContext,
	formatContextForAI,
} from "@/lib/context-builder";

export type ChatRequest = {
	projectId: string;
	parentNodeId: string;
	message: string;
	provider?: "deepseek" | "anthropic" | "openai";
	model?: string;
	positionX?: number;
	positionY?: number;
	metadata?: unknown;
};

export type ChatResponse = {
	nodeId: string;
	error?: string;
};

/**
 * POST /api/chat
 *
 * Streams AI response and persists as a node in the conversation tree.
 */
export async function POST(req: NextRequest) {
	try {
		// Parse request body
		const body = (await req.json()) as ChatRequest;

		console.log("[/api/chat] Request body:", {
			projectId: body.projectId,
			parentNodeId: body.parentNodeId,
			message: body.message?.substring(0, 50) + "...",
			provider: body.provider,
		});

		const {
			projectId,
			parentNodeId,
			message,
			provider = getDefaultProvider(),
			model,
			positionX,
			positionY,
			metadata,
		} = body;

		// Validate required fields
		if (!projectId) {
			return Response.json({ error: "projectId is required" }, { status: 400 });
		}
		if (!parentNodeId) {
			return Response.json(
				{ error: "parentNodeId is required" },
				{ status: 400 },
			);
		}
		if (!message || typeof message !== "string") {
			return Response.json({ error: "message is required" }, { status: 400 });
		}

		// Build conversation context from root to parent node
		console.log("[/api/chat] Building conversation context from parent node:", parentNodeId);
		const context = await buildConversationContext(parentNodeId);
		console.log("[/api/chat] Context built:", {
			pathLength: context.pathLength,
			totalTokens: context.totalTokens,
		});

		// Format messages for AI SDK
		const aiMessages = formatContextForAI(context);

		// Add the new user message
		aiMessages.push({
			role: "user",
			content: message,
		});

		console.log("[/api/chat] Calling streamChatWithNode...");
		// Stream the response with node creation
		const result = await streamChatWithNode({
			messages: aiMessages,
			provider,
			model,
			projectId,
			parentId: parentNodeId,
			positionX,
			positionY,
			metadata: {
				...(typeof metadata === "object" && metadata !== null ? metadata : {}),
				contextLength: context.pathLength,
				contextTokens: context.totalTokens,
			},
		});

		console.log("[/api/chat] Assistant node created:", result.nodeId);

		// Return the streaming response
		// The nodeId is sent in a header for client reference
		const streamResponse = result.toStreamResponse();
		const headers = new Headers(streamResponse.headers);
		headers.set("X-Node-Id", result.nodeId);

		console.log("[/api/chat] Returning stream response with node ID in header");
		return new Response(streamResponse.body, {
			status: streamResponse.status,
			statusText: streamResponse.statusText,
			headers,
		});
	} catch (error) {
		console.error("[/api/chat] Chat API error:", error);

		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";

		return Response.json({ error: errorMessage }, { status: 500 });
	}
}

/**
 * GET /api/chat
 *
 * Health check endpoint.
 */
export async function GET() {
	return Response.json({
		status: "ok",
		version: "1.0.0",
		endpoints: {
			POST: "/api/chat - Stream AI response",
		},
	});
}
