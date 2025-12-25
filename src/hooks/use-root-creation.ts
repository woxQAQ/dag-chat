/**
 * UI-NEW-001: Root Node Creation Hook
 *
 * Custom hook for handling root node creation interactions.
 * Manages the state and API calls for creating the first node in an empty project.
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
	/** Callback when the root node is successfully created */
	onNodeCreated?: (
		nodeId: string,
		positionX: number,
		positionY: number,
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
 * Follows the same pattern as useBranching (UI-NEW-002).
 *
 * @param options - Hook options
 * @returns Root creation state and create function
 *
 * @example
 * ```tsx
 * const { isCreating, createRootNode } = useRootNodeCreation({
 *   projectId: "project-uuid",
 *   onNodeCreated: (nodeId, x, y) => {
 *     // Add the new node to the graph
 *     setNodes((prev) => [...prev, { id: nodeId, position: { x, y } }]);
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
	const { projectId, onNodeCreated, onError } = options;
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createRootNode = useCallback(
		async (content: string, positionX: number, positionY: number) => {
			setIsCreating(true);
			setError(null);

			try {
				const result = await createRootNodeAction({
					projectId,
					content,
					positionX,
					positionY,
				});

				if (result.success && result.data) {
					onNodeCreated?.(
						result.data.nodeId,
						result.data.positionX,
						result.data.positionY,
					);
				} else {
					const errorMsg = result.error || "Failed to create root node";
					setError(errorMsg);
					onError?.(errorMsg);
				}
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "An unexpected error occurred";
				setError(errorMsg);
				onError?.(errorMsg);
			} finally {
				setIsCreating(false);
			}
		},
		[projectId, onNodeCreated, onError],
	);

	return {
		isCreating,
		error,
		createRootNode,
	};
}
