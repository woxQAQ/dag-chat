/**
 * UI-NEW-004: Node Editing Context
 *
 * React Context for providing node content update callbacks to editable nodes.
 * This allows nodeTypes to remain stable while the update callback can change.
 */

"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export interface NodeEditingContextValue {
	/**
	 * Callback to update node content in the database
	 */
	updateNodeContent: (nodeId: string, content: string) => void;
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
}: NodeEditingProviderProps) {
	const value: NodeEditingContextValue = {
		updateNodeContent: onUpdateContent,
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
