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
import { getDefaultProvider, streamChat } from "@/lib/ai-stream";
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
	/**
	 * If true, skip creating the USER node and use parentNodeId directly.
	 * Used when the USER node has already been created (e.g., root node creation).
	 */
	skipUserNode?: boolean;
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

		const {
			projectId,
			parentNodeId,
			message,
			provider = getDefaultProvider(),
			model,
			positionX,
			positionY,
			metadata,
			skipUserNode = false,
		} = body;

		// Validate required fields BEFORE using them
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

		// Log after validation (safe to use message.substring now)
		console.log("[/api/chat] Request body:", {
			projectId,
			parentNodeId,
			message: `${message.substring(0, 50)}...`,
			provider,
		});

		// Build conversation context from root to parent node
		console.log(
			"[/api/chat] Building conversation context from parent node:",
			parentNodeId,
		);
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

		// Determine the parent node ID for the ASSISTANT node
		// If skipUserNode is true, use parentNodeId directly (USER node already exists)
		// Otherwise, create a new USER node first
		let userNodeId: string;
		let userNodeResponseHeader: string | null = null;

		if (skipUserNode) {
			// USER node already created, use parentNodeId directly
			userNodeId = parentNodeId;
			console.log(
				"[/api/chat] Skipping USER node creation, using existing:",
				userNodeId,
			);
		} else {
			// Import createNode to create the user message node first
			const { createNode } = await import("@/lib/node-crud");

			// Create USER node first
			// Position the USER node below the parent node, ASSISTANT node below USER node
			// parent -> USER -> ASSISTANT
			const aiPositionY = positionY ?? 0;
			const userPositionY = aiPositionY - 180; // Match frontend spacing
			const userNode = await createNode({
				projectId,
				parentId: parentNodeId,
				role: "USER",
				content: message,
				positionX: positionX ?? 0,
				positionY: userPositionY,
				metadata: {},
			});

			userNodeId = userNode.id;
			userNodeResponseHeader = userNode.id;
			console.log("[/api/chat] User node created:", userNode.id);
		}

		console.log("[/api/chat] Calling streamChatWithNode...");
		// Stream the response with node creation
		// Use the user node as the parent

		// First, create the ASSISTANT node (placeholder)
		const { createNode, updateNodeContent } = await import("@/lib/node-crud");
		const assistantNode = await createNode({
			projectId,
			parentId: userNodeId,
			role: "ASSISTANT",
			content: "",
			positionX: positionX ?? 0,
			positionY: positionY ?? 0,
			metadata: {
				...(typeof metadata === "object" && metadata !== null ? metadata : {}),
				streaming: true,
				provider,
			},
		});
		const assistantNodeId = assistantNode.id;
		console.log("[/api/chat] Assistant node created:", assistantNodeId);

		// Get AI stream
		const result = await streamChat({
			messages: aiMessages,
			provider,
			model,
		});

		// Get the stream response
		const streamResponse = result.toStreamResponse();
		const reader = streamResponse.body?.getReader();

		console.log(
			"[/api/chat] Starting to stream updates to node:",
			assistantNodeId,
		);

		if (reader) {
			const decoder = new TextDecoder();
			let fullText = "";
			let lastUpdateTime = 0;
			const updateInterval = 50; // Update node every 50ms for smoother streaming

			// Create a TransformStream for forwarding to client
			const { readable, writable } = new TransformStream();

			// Process stream in background: update node AND forward to client
			(async () => {
				const writer = writable.getWriter();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						// Forward chunk to client immediately
						await writer.write(value);

						// Decode and accumulate text
						const chunk = decoder.decode(value, { stream: true });
						fullText += chunk;

						// Throttled node update
						const now = Date.now();
						if (now - lastUpdateTime > updateInterval) {
							// Non-blocking update
							updateNodeContent(assistantNodeId, {
								content: fullText,
								metadata: {
									...(typeof metadata === "object" && metadata !== null
										? metadata
										: {}),
									streaming: true,
									provider,
								},
							}).catch((err) =>
								console.error("[/api/chat] Node update error:", err),
							);
							lastUpdateTime = now;
						}
					}

					// Final update when stream completes
					await updateNodeContent(assistantNodeId, {
						content: fullText,
						metadata: {
							...(typeof metadata === "object" && metadata !== null
								? metadata
								: {}),
							streaming: false,
							provider,
						},
					});
					console.log("[/api/chat] Stream complete, final node update done");
				} catch (error) {
					console.error("[/api/chat] Stream processing error:", error);
				} finally {
					await writer.close();
				}
			})();

			// Return the streaming response to client
			const headers = new Headers();
			headers.set("Content-Type", "text/plain; charset=utf-8");
			headers.set("X-Node-Id", assistantNodeId);
			if (userNodeResponseHeader) {
				headers.set("X-User-Node-Id", userNodeResponseHeader);
			}
			headers.set("X-Accel-Buffering", "no"); // Disable buffering for real-time streaming

			console.log("[/api/chat] Returning stream response");
			return new Response(readable, {
				status: 200,
				headers,
			});
		}

		// Fallback if no reader
		const headers = new Headers(streamResponse.headers);
		headers.set("X-Node-Id", assistantNodeId);
		if (userNodeResponseHeader) {
			headers.set("X-User-Node-Id", userNodeResponseHeader);
		}
		return streamResponse;
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
