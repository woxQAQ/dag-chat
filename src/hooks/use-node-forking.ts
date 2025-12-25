/**
 * UI-NEW-005: Node Forking Hook
 *
 * Custom hook for handling node forking interactions (non-destructive editing).
 * Manages the state and API calls for creating parallel branches.
 */

"use client";

import { useCallback, useState } from "react";
import { forkUserNodeAction } from "@/app/nodes/actions";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UseNodeForkingOptions {
	/** Callback when node is successfully forked */
	onNodeForked?: (userNodeId: string, aiNodeId: string | null) => void;
	/** Callback when node fork fails */
	onError?: (error: string) => void;
}

export interface UseNodeForkingReturn {
	/** Whether a node is currently being forked */
	isForking: boolean;
	/** The most recent error message, if any */
	error: string | null;
	/** Function to fork a USER node */
	forkUserNode: (
		nodeId: string,
		newContent: string,
		positionX: number,
		positionY: number,
	) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing node forking interactions (non-destructive editing).
 *
 * Provides a function to fork USER nodes with loading/error states.
 * When a node is forked, a new USER node is created as a sibling,
 * and an AI response is automatically triggered.
 *
 * @param options - Hook options
 * @returns Forking state and fork function
 *
 * @example
 * ```tsx
 * const { isForking, forkUserNode } = useNodeForking({
 *   onNodeForked: (userNodeId, aiNodeId) => {
 *     // Add new nodes to ReactFlow state
 *     setNodes((prev) => [...prev, newUserNode, aiNode]);
 *   },
 *   onError: (error) => {
 *     toast.error(error);
 *   }
 * });
 *
 * // In node component
 * <EditableNode
 *   onNodeFork={(nodeId, content, x, y) => {
 *     forkUserNode(nodeId, content, x, y);
 *   }}
 * />
 * ```
 */
export function useNodeForking(
	options: UseNodeForkingOptions = {},
): UseNodeForkingReturn {
	const { onNodeForked, onError } = options;
	const [isForking, setIsForking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const forkUserNodeCb = useCallback(
		async (
			nodeId: string,
			newContent: string,
			positionX: number,
			positionY: number,
		) => {
			setIsForking(true);
			setError(null);

			try {
				const result = await forkUserNodeAction({
					nodeId,
					newContent,
					positionX,
					positionY,
				});

				if (result.success && result.data) {
					onNodeForked?.(result.data.userNodeId, result.data.aiNodeId);
				} else {
					const errorMsg = result.error || "Failed to fork node";
					setError(errorMsg);
					onError?.(errorMsg);
				}
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "An unexpected error occurred";
				setError(errorMsg);
				onError?.(errorMsg);
			} finally {
				setIsForking(false);
			}
		},
		[onNodeForked, onError],
	);

	return {
		isForking,
		error,
		forkUserNode: forkUserNodeCb,
	};
}
