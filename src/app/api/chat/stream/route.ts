/**
 * SSE Stream for Node Content Updates
 *
 * Provides real-time updates for node content during AI streaming.
 * Clients can subscribe to a specific node to receive content updates.
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/chat/stream?nodeId=xxx
 *
 * Server-Sent Events endpoint for real-time node content updates.
 *
 * @param request - NextRequest with nodeId query parameter
 * @returns Response with SSE stream
 *
 * @example
 * ```ts
 * const eventSource = new EventSource('/api/chat/stream?nodeId=node-uuid');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Node content:', data.content);
 * };
 * ```
 */
export async function GET(request: NextRequest) {
	const nodeId = request.nextUrl.searchParams.get("nodeId");

	if (!nodeId) {
		return new Response("nodeId is required", { status: 400 });
	}

	// Create SSE stream
	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			const sendEvent = (
				data: { content: string; streaming: boolean } | { error: string },
				event?: string,
			) => {
				const sseData = `data: ${JSON.stringify(data)}\n\n`;
				if (event) {
					controller.enqueue(encoder.encode(`event: ${event}\n`));
				}
				controller.enqueue(encoder.encode(sseData));
			};

			try {
				// Get initial node state
				const node = await prisma.node.findUnique({
					where: { id: nodeId },
					select: { id: true, content: true, metadata: true },
				});

				if (!node) {
					controller.enqueue(
						encoder.encode(
							`event: error\ndata: ${JSON.stringify({ error: "Node not found" })}\n\n`,
						),
					);
					controller.close();
					return;
				}

				const metadata = node.metadata as { streaming?: boolean } | null;
				const isStreaming = metadata?.streaming ?? false;

				// Send initial content
				sendEvent(
					{
						content: node.content,
						streaming: isStreaming,
					},
					"update",
				);

				// If already completed, close the connection
				if (!isStreaming) {
					sendEvent({ content: node.content, streaming: false }, "complete");
					controller.close();
					return;
				}

				// Poll for updates while streaming
				const pollInterval = 100; // Check every 100ms
				let previousContent = node.content;
				let pollCount = 0;
				const maxPolls = 300; // Timeout after 30 seconds

				const pollTimer = setInterval(async () => {
					pollCount++;

					try {
						const updatedNode = await prisma.node.findUnique({
							where: { id: nodeId },
							select: { id: true, content: true, metadata: true },
						});

						if (!updatedNode) {
							clearInterval(pollTimer);
							sendEvent({ error: "Node not found" }, "error");
							controller.close();
							return;
						}

						const updatedMetadata = updatedNode.metadata as {
							streaming?: boolean;
						} | null;
						const isStillStreaming = updatedMetadata?.streaming ?? false;
						const contentChanged = updatedNode.content !== previousContent;

						// Send update if content changed
						if (contentChanged) {
							sendEvent(
								{
									content: updatedNode.content,
									streaming: isStillStreaming,
								},
								"update",
							);
							previousContent = updatedNode.content;
						}

						// Check if streaming is complete
						if (!isStillStreaming) {
							clearInterval(pollTimer);
							sendEvent(
								{ content: updatedNode.content, streaming: false },
								"complete",
							);
							controller.close();
							return;
						}

						// Timeout check
						if (pollCount >= maxPolls) {
							clearInterval(pollTimer);
							sendEvent(
								{ content: updatedNode.content, streaming: false },
								"timeout",
							);
							controller.close();
						}
					} catch (error) {
						console.error("[SSE] Poll error:", error);
						clearInterval(pollTimer);
						sendEvent({ error: "Failed to fetch updates" }, "error");
						controller.close();
					}
				}, pollInterval);

				// Cleanup on client disconnect
				request.signal.addEventListener("abort", () => {
					clearInterval(pollTimer);
					controller.close();
				});
			} catch (error) {
				console.error("[SSE] Stream error:", error);
				controller.error(error);
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no", // Disable nginx buffering
		},
	});
}
