/**
 * UI-NEW-004: Node Content Editing Wrapper Component
 *
 * A wrapper component that adds content editing interaction to existing node components.
 * Use this to wrap UserNode when using them in the canvas.
 *
 * This component manages local edit state and saves content changes to the database.
 *
 * The update callback is provided via NodeEditingContext instead of props,
 * allowing nodeTypes to remain stable across renders.
 */

"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useNodeEditingContext } from "@/contexts/NodeEditingContext";
import type { MindFlowNode, UserNodeProps } from "./types";
import { UserNode as BaseUserNode } from "./UserNode";

// ============================================================================
// Type Definitions
// ============================================================================

export interface EditableNodeProps {
	/** The React Flow node data */
	node: MindFlowNode;
	/** Whether the node is currently hovered (detected by React Flow) */
	isHovered?: boolean;
}

// ============================================================================
// Editable Wrapper Component
// ============================================================================

/**
 * UserNode with content editing support.
 *
 * Extends the base UserNode with:
 * - Double-click to enter edit mode
 * - Local state for edited content
 * - Save on Cmd/Ctrl+Enter or clicking outside
 * - Cancel on Escape
 *
 * @example
 * ```tsx
 * <EditableUserNode
 *   node={node}
 *   isHovered={isHovered}
 *   onUpdateContent={(nodeId, content) => {
 *     // Updates database and ReactFlow state
 *   }}
 * />
 * ```
 */
export const EditableUserNode = memo<
	EditableNodeProps & Omit<UserNodeProps, "data" | "selected">
>(function EditableUserNode({ node, isHovered = false, ...props }) {
	// Get update callback from context
	const { updateNodeContent } = useNodeEditingContext();

	// Local state for edit mode
	const [isEditing, setIsEditing] = useState(false);
	// Local state for edited content before saving
	const [editedContent, setEditedContent] = useState(node.data.content);

	// Sync local state when node data changes (e.g., after external save)
	useEffect(() => {
		setEditedContent(node.data.content);
	}, [node.data.content]);

	// Handle edit mode toggle (double-click)
	const handleEditToggle = useCallback((newIsEditing: boolean) => {
		setIsEditing(newIsEditing);
	}, []);

	// Handle save action (Cmd/Ctrl+Enter)
	const handleEditSave = useCallback(() => {
		setIsEditing(false);

		// Save when content changed
		if (editedContent !== node.data.content) {
			updateNodeContent(node.data.id, editedContent);
		}
	}, [node.data.id, node.data.content, editedContent, updateNodeContent]);

	// Handle cancel action (Escape)
	const handleEditCancel = useCallback(() => {
		setIsEditing(false);
		// Reset to original content without saving
		setEditedContent(node.data.content);
	}, [node.data.content]);

	const handleContentChange = useCallback((content: string) => {
		setEditedContent(content);
	}, []);

	// Create data with local isEditing state
	const dataWithEditingState = {
		...node.data,
		isEditing,
	};

	return (
		<BaseUserNode
			data={dataWithEditingState}
			selected={node.selected}
			isHovered={isHovered}
			onEditToggle={handleEditToggle}
			onEditSave={handleEditSave}
			onEditCancel={handleEditCancel}
			onContentChange={handleContentChange}
			{...props}
		/>
	);
});

// ============================================================================
// Node Factory Function
// ============================================================================

/**
 * Creates an editable node component with content editing support.
 *
 * This factory function returns a UserNode component with editing support.
 * The update callback is provided via NodeEditingContext, allowing the
 * nodeTypes object to remain stable across renders.
 *
 * @returns A function that renders the node with editing support
 *
 * @example
 * ```tsx
 * import { NodeEditingProvider } from "@/contexts/NodeEditingContext";
 *
 * // Define stable nodeTypes (can be outside component or memoized)
 * const nodeTypes = {
 *   user: createEditableNode(),
 *   assistant: createEditableNode(),
 *   system: createEditableNode(),
 * };
 *
 * // Wrap canvas with provider
 * <NodeEditingProvider onUpdateContent={handleUpdate}>
 *   <InfiniteCanvas nodeTypes={nodeTypes} ... />
 * </NodeEditingProvider>
 * ```
 */
export function createEditableNode() {
	return function EditableNode(props: any) {
		// Props from React Flow contain data, selected, etc. directly
		const node: MindFlowNode = {
			id: props.data.id,
			type: props.type,
			position: props.position,
			data: props.data,
			selected: props.selected,
		};

		return <EditableUserNode node={node} isHovered={props.isHovered} />;
	};
}
