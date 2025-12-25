/**
 * UI-NEW-004: Node Content Editing Hook
 *
 * Custom hook for handling node content editing interactions.
 * Manages the state and API calls for updating node content.
 */

"use client";

import { useCallback, useState } from "react";
import { updateNodeContentAction } from "@/app/nodes/actions";

// ============================================================================
// Type Definitions
// ============================================================================

export interface UseNodeEditingOptions {
	/** Callback when node content is successfully updated */
	onContentUpdated?: (nodeId: string, content: string) => void;
	/** Callback when node update fails */
	onError?: (error: string) => void;
}

export interface UseNodeEditingReturn {
	/** Whether a node is currently being updated */
	isUpdating: boolean;
	/** The most recent error message, if any */
	error: string | null;
	/** Function to update node content */
	updateNodeContent: (nodeId: string, content: string) => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing node content editing interactions.
 *
 * Provides a function to update node content with loading/error states.
 * Automatically saves to database when called.
 *
 * @param options - Hook options
 * @returns Editing state and update function
 *
 * @example
 * ```tsx
 * const { isUpdating, updateNodeContent } = useNodeEditing({
 *   onContentUpdated: (nodeId, content) => {
 *     // Update the node in ReactFlow state
 *     setNodes((nds) =>
 *       nds.map((node) =>
 *         node.id === nodeId
 *           ? { ...node, data: { ...node.data, content, isEditing: false } }
 *           : node
 *       )
 *     );
 *   },
 *   onError: (error) => {
 *     toast.error(error);
 *   }
 * });
 *
 * // In node component
 * <UserNode
 *   onContentChange={(content) => setContent(content)}
 *   onEditToggle={(isEditing) => {
 *     if (!isEditing) {
 *       updateNodeContent(nodeId, content);
 *     }
 *   }}
 * />
 * ```
 */
export function useNodeEditing(
	options: UseNodeEditingOptions = {},
): UseNodeEditingReturn {
	const { onContentUpdated, onError } = options;
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateNodeContentCb = useCallback(
		async (nodeId: string, content: string) => {
			setIsUpdating(true);
			setError(null);

			try {
				const result = await updateNodeContentAction({
					nodeId,
					content,
				});

				if (result.success && result.data) {
					onContentUpdated?.(result.data.nodeId, result.data.content);
				} else {
					const errorMsg = result.error || "Failed to update node content";
					setError(errorMsg);
					onError?.(errorMsg);
				}
			} catch (err) {
				const errorMsg =
					err instanceof Error ? err.message : "An unexpected error occurred";
				setError(errorMsg);
				onError?.(errorMsg);
			} finally {
				setIsUpdating(false);
			}
		},
		[onContentUpdated, onError],
	);

	return {
		isUpdating,
		error,
		updateNodeContent: updateNodeContentCb,
	};
}
