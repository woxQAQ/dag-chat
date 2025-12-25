/**
 * UI-NEW-004: Node Editing Context
 *
 * React Context for providing node content update callbacks to editable nodes.
 * This allows nodeTypes to remain stable while the update callback can change.
 *
 * Also tracks the currently editing node globally to allow:
 * - Clicking outside to exit edit mode
 * - Only one node being edited at a time
 */

"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export interface NodeEditingContextValue {
	/**
	 * Callback to update node content in the database
	 */
	updateNodeContent: (nodeId: string, content: string) => void;
	/**
	 * Callback to fork a USER node (non-destructive editing)
	 * Creates a parallel branch with the new content
	 */
	forkNode: (nodeId: string, content: string, x: number, y: number) => void;
	/**
	 * The ID of the node currently being edited, or null if no node is being edited
	 */
	editingNodeId: string | null;
	/**
	 * Start editing a node
	 */
	startEditing: (nodeId: string) => void;
	/**
	 * Stop editing the current node
	 * If save is true and content has changed, will save before stopping
	 */
	stopEditing: (save?: boolean) => void;
	/**
	 * Check if a specific node is currently being edited
	 */
	isEditing: (nodeId: string) => boolean;
	/**
	 * Set the edited content for the currently editing node
	 * Used to track content changes for save-on-exit
	 */
	setEditedContent: (nodeId: string, content: string) => void;
	/**
	 * Get the edited content for a node (returns original if not edited)
	 */
	getEditedContent: (nodeId: string, originalContent: string) => string;
}

// ============================================================================
// Context Creation
// ============================================================================

const NodeEditingContext = createContext<NodeEditingContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface NodeEditingProviderProps {
	children: ReactNode;
	onUpdateContent: (nodeId: string, content: string) => void;
	onNodeFork?: (nodeId: string, content: string, x: number, y: number) => void;
}

/**
 * Provider component for node editing functionality.
 *
 * Wrap the canvas component with this provider to enable content editing
 * in all editable nodes.
 *
 * @example
 * ```tsx
 * <NodeEditingProvider onUpdateContent={handleUpdateContent}>
 *   <InfiniteCanvas nodeTypes={nodeTypes} ... />
 * </NodeEditingProvider>
 * ```
 */
export function NodeEditingProvider({
	children,
	onUpdateContent,
	onNodeFork,
}: NodeEditingProviderProps) {
	// Track the currently editing node
	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
	// Track edited content for each node (keyed by node ID)
	const [editedContentMap, setEditedContentMap] = useState<
		Record<string, string>
	>({});

	const startEditing = (nodeId: string) => {
		setEditingNodeId(nodeId);
	};

	const stopEditing = (save = false) => {
		if (save && editingNodeId) {
			// Get the edited content and call update
			const editedContent = editedContentMap[editingNodeId];
			if (editedContent !== undefined) {
				onUpdateContent(editingNodeId, editedContent);
			}
		}
		// Clear editing state and content for this node
		setEditingNodeId(null);
		if (editingNodeId) {
			setEditedContentMap((prev) => {
				const next = { ...prev };
				delete next[editingNodeId];
				return next;
			});
		}
	};

	const isEditing = (nodeId: string) => {
		return editingNodeId === nodeId;
	};

	const setEditedContent = (nodeId: string, content: string) => {
		setEditedContentMap((prev) => ({
			...prev,
			[nodeId]: content,
		}));
	};

	const getEditedContent = (nodeId: string, originalContent: string) => {
		return editedContentMap[nodeId] ?? originalContent;
	};

	const value: NodeEditingContextValue = {
		updateNodeContent: onUpdateContent,
		forkNode: onNodeFork ?? (() => {}),
		editingNodeId,
		startEditing,
		stopEditing,
		isEditing,
		setEditedContent,
		getEditedContent,
	};

	return (
		<NodeEditingContext.Provider value={value}>
			{children}
		</NodeEditingContext.Provider>
	);
}

// ============================================================================
// Hook for Consuming Context
// ============================================================================

/**
 * Hook to access node editing functionality.
 *
 * @returns The node editing context value
 * @throws Error if used outside of NodeEditingProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { updateNodeContent } = useNodeEditingContext();
 *
 *   const handleSave = (content: string) => {
 *     updateNodeContent(nodeId, content);
 *   };
 * }
 * ```
 */
export function useNodeEditingContext(): NodeEditingContextValue {
	const context = useContext(NodeEditingContext);

	if (!context) {
		throw new Error(
			"useNodeEditingContext must be used within a NodeEditingProvider",
		);
	}

	return context;
}
