/**
 * UI-NEW-002: Branching Interaction Hook
 *
 * Custom hook for handling node branching interactions.
 * Manages the state and API calls for creating child nodes.
 */

"use client";

import { useCallback, useState } from "react";
import { createChildNodeAutoPosition } from "@/app/nodes/actions";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UseBranchingOptions {
	/** The project ID for the current workspace */
	projectId: string;
	/** Callback when a child node is successfully created */
	onNodeCreated?: (
		nodeId: string,
		positionX: number,
		positionY: number,
	) => void;
	/** Callback when node creation fails */
	onError?: (error: string) => void;
}

export interface UseBranchingReturn {
	/** Whether a child node is currently being created */
	isCreating: boolean;
	/** The most recent error message, if any */
	error: string | null;
	/** Function to create a child node from a parent node */
	createChildNode: (
		parentNodeId: string,
		role?: "USER" | "ASSISTANT",
	) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing node branching interactions.
 *
 * Provides a function to create child nodes with automatic positioning
 * and loading/error states.
 *
 * @param options - Hook options
 * @returns Branching state and create function
 *
 * @example
 * ```tsx
 * const { isCreating, createChildNode } = useBranching({
 *   projectId: "project-uuid",
 *   onNodeCreated: (nodeId, x, y) => {
 *     // Add the new node to the graph
 *     addNode({ id: nodeId, position: { x, y } });
 *   },
 *   onError: (error) => {
 *     toast.error(error);
 *   }
 * });
 *
 * // In node component
 * <UserNode onCreateChild={() => createChildNode(parentId)} />
 * ```
 */
export function useBranching(options: UseBranchingOptions): UseBranchingReturn {
	const { projectId, onNodeCreated, onError } = options;
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createChildNode = useCallback(
		async (parentNodeId: string, role: "USER" | "ASSISTANT" = "USER") => {
			setIsCreating(true);
			setError(null);

			try {
				const result = await createChildNodeAutoPosition({
					projectId,
					parentNodeId,
					role,
					content: "",
				});

				if (result.success && result.data) {
					onNodeCreated?.(
						result.data.nodeId,
						result.data.positionX,
						result.data.positionY,
					);
				} else {
					const errorMsg = result.error || "Failed to create child node";
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
		createChildNode,
	};
}
