/**
 * UI-NEW-001: Root Node Creation Hook
 *
 * Custom hook for handling root node creation interactions.
 * Manages the state and API calls for creating the first node in an empty project.
 *
 * After creating the user node, this hook automatically calls the AI API
 * to generate an assistant response.
 */

"use client";

import { useCallback, useState } from "react";
import { createRootNode as createRootNodeAction } from "@/app/nodes/root-actions";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UseRootNodeCreationOptions {
	/** The project ID for the current workspace */
	projectId: string;
	/** Callback when the root user node is successfully created */
	onUserNodeCreated?: (
		nodeId: string,
		positionX: number,
		positionY: number,
		content: string,
	) => void;
	/** Callback when the assistant node is created (from AI stream response) */
	onAssistantNodeCreated?: (
		nodeId: string,
		positionX: number,
		positionY: number,
		parentNodeId: string,
	) => void;
	/** Callback when root node creation fails */
	onError?: (error: string) => void;
}

export interface UseRootNodeCreationReturn {
	/** Whether a root node is currently being created */
	isCreating: boolean;
	/** The most recent error message, if any */
	error: string | null;
	/** Function to create a root node at the specified position */
	createRootNode: (
		content: string,
		positionX: number,
		positionY: number,
	) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing root node creation interactions.
 *
 * Provides a function to create the root node with loading/error states.
 * After creating the user node, automatically calls the AI API to generate
 * an assistant response.
 *
 * Follows the same pattern as useBranching (UI-NEW-002).
 *
 * @param options - Hook options
 * @returns Root creation state and create function
 *
 * @example
 * ```tsx
 * const { isCreating, createRootNode } = useRootNodeCreation({
 *   projectId: "project-uuid",
 *   onUserNodeCreated: (nodeId, x, y) => {
 *     // Add the user node to the graph
 *     setNodes((prev) => [...prev, { id: nodeId, position: { x, y } }]);
 *   },
 *   onAssistantNodeCreated: (nodeId, x, y, parentNodeId) => {
 *     // Add the assistant node and edge to the graph
 *     const assistantNode = { id: nodeId, type: "assistant", position: { x, y }, ... };
 *     setNodes((prev) => [...prev, assistantNode]);
 *     setEdges((prev) => [...prev, { id: `${parentNodeId}-${nodeId}`, source: parentNodeId, target: nodeId }]);
 *   },
 *   onError: (error) => {
 *     toast.error(error);
 *   }
 * });
 *
 * // In prompt dialog submit handler
 * const handlePromptSubmit = async (prompt: string) => {
 *   const position = reactFlowInstance.screenToFlowPosition({ x: 0, y: 0 });
 *   await createRootNode(prompt, position.x, position.y);
 * };
 * ```
 */
export function useRootNodeCreation(
	options: UseRootNodeCreationOptions,
): UseRootNodeCreationReturn {
	const { projectId, onUserNodeCreated, onAssistantNodeCreated, onError } =
		options;
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createRootNode = useCallback(
		async (content: string, positionX: number, positionY: number) => {
			setIsCreating(true);
			setError(null);

			try {
				// Step 1: Create the root user node
				const result = await createRootNodeAction({
					projectId,
					content,
					positionX,
					positionY,
				});

				if (!result.success || !result.data) {
					const errorMsg = result.error || "Failed to create root node";
					setError(errorMsg);
					onError?.(errorMsg);
					setIsCreating(false);
					return;
				}

				const userNodeId = result.data.nodeId;
				const userNodeX = result.data.positionX;
				const userNodeY = result.data.positionY;

				// Notify user node creation with content
				onUserNodeCreated?.(userNodeId, userNodeX, userNodeY, content);

				// Close modal immediately after USER node is created
				// Don't wait for AI response
				setIsCreating(false);

				// Step 2: Call AI API in background to generate assistant response
				// Calculate position for assistant node (below user node)
				const assistantY = userNodeY + 150;

				// Don't await - let it run in background
				fetch("/api/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						parentNodeId: userNodeId,
						message: content,
						positionX: userNodeX,
						positionY: assistantY,
						skipUserNode: true, // USER node already created by createRootNodeAction
					}),
				})
					.then(async (response) => {
						console.log(
							"[use-root-creation] AI API response status:",
							response.status,
						);

						if (!response.ok) {
							const errorData = (await response.json()) as { error?: string };
							throw new Error(errorData.error || "Failed to call AI API");
						}

						// Get the assistant node ID from the response header
						const assistantNodeId = response.headers.get("X-Node-Id");
						console.log(
							"[use-root-creation] Assistant node ID from header:",
							assistantNodeId,
						);

						// Notify the client to add the assistant node to the graph
						if (assistantNodeId) {
							onAssistantNodeCreated?.(
								assistantNodeId,
								userNodeX,
								assistantY,
								userNodeId,
							);
						} else {
							console.warn(
								"[use-root-creation] No assistant node ID returned from AI API",
							);
						}

						// Consume the stream response in background to ensure the request completes
						// The actual streaming and node update happens server-side
						const reader = response.body?.getReader();
						if (reader) {
							console.log(
								"[use-root-creation] Consuming stream in background...",
							);
							let chunkCount = 0;
							while (true) {
								const { done } = await reader.read();
								if (done) {
									console.log(
										"[use-root-creation] Stream complete. Total chunks:",
										chunkCount,
									);
									break;
								}
								chunkCount++;
							}
						}
					})
					.catch((aiError) => {
						// Log the AI API error but don't affect the user node creation
						console.error("[use-root-creation] AI API error:", aiError);
						// Optionally notify the user about the AI error
						onError?.(
							`User node created, but AI response failed: ${aiError instanceof Error ? aiError.message : "Unknown error"}`,
						);
					});
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "An unexpected error occurred";
				setError(errorMsg);
				onError?.(errorMsg);
				setIsCreating(false);
			}
		},
		[projectId, onUserNodeCreated, onAssistantNodeCreated, onError],
	);

	return {
		isCreating,
		error,
		createRootNode,
	};
}
