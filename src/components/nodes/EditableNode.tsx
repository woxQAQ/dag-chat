/**
 * UI-NEW-004: Node Content Editing Wrapper Component
 * UI-NEW-005: Node Forking Support (Non-destructive editing)
 *
 * A wrapper component that adds content editing interaction to existing node components.
 * Use this to wrap UserNode and AINode when using them in the canvas.
 *
 * This component manages local edit state and saves content changes to the database.
 *
 * IMPORTANT: For USER nodes, editing now creates a fork (parallel branch) instead
 * of modifying the original node. This implements non-destructive editing as per the
 * project's architecture principles.
 *
 * The update/fork callback is provided via NodeEditingContext instead of props,
 * allowing nodeTypes to remain stable across renders.
 *
 * The editing state is tracked globally in the context, allowing:
 * - Only one node to be edited at a time
 * - Clicking outside to exit edit mode and save changes
 */

"use client";

import { memo, useCallback } from "react";
import { useNodeEditingContext } from "@/contexts/NodeEditingContext";
import { calculateForkPosition } from "@/lib/position-calculator";
import { AINode as BaseAINode } from "./AINode";
import type { AINodeProps, MindFlowNode, UserNodeProps } from "./types";
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
// Editable Wrapper Components
// ============================================================================

/**
 * UserNode with content editing support.
 *
 * Extends the base UserNode with:
 * - Double-click to enter edit mode
 * - Local state for edited content
 * - Save on Cmd/Ctrl+Enter or clicking outside
 * - Cancel on Escape
 * - Global edit state management via context
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
	// Get editing state and methods from context
	const {
		updateNodeContent,
		forkNode,
		startEditing,
		stopEditing,
		isEditing: isNodeEditing,
		setEditedContent: setContextEditedContent,
		getEditedContent,
	} = useNodeEditingContext();

	// Check if this node is currently being edited
	const isEditing = isNodeEditing(node.data.id);

	// Get the current edited content (either from context or original node data)
	const currentContent = getEditedContent(node.data.id, node.data.content);

	// Handle edit mode toggle (double-click)
	const handleEditToggle = useCallback(() => {
		if (!isEditing) {
			// Start editing this node
			startEditing(node.data.id);
			// Initialize the edited content in context with current content
			setContextEditedContent(node.data.id, node.data.content);
		} else {
			// Stop editing without saving (cancel)
			stopEditing(false);
		}
	}, [
		isEditing,
		node.data.id,
		node.data.content,
		startEditing,
		setContextEditedContent,
		stopEditing,
	]);

	// Handle save action (Cmd/Ctrl+Enter)
	const handleEditSave = useCallback(() => {
		// Only save if content has actually changed
		if (currentContent !== node.data.content) {
			// For USER nodes: ALWAYS fork (non-destructive editing)
			if (node.data.role === "USER") {
				// Calculate position for forked node (to the right of original)
				// Use node position if available, otherwise default to (0, 0)
				const posX = node.position?.x ?? 0;
				const posY = node.position?.y ?? 0;
				const forkPosition = calculateForkPosition(posX, posY);
				forkNode(node.data.id, currentContent, forkPosition.x, forkPosition.y);
			} else {
				// For other node types (ASSISTANT, SYSTEM): fall back to in-place update
				// Note: ASSISTANT nodes should not be editable, but we handle it for safety
				updateNodeContent(node.data.id, currentContent);
			}
		}
		// Stop editing
		stopEditing(false);
	}, [
		node.data.id,
		node.data.content,
		node.data.role,
		node.position?.x,
		node.position?.y,
		currentContent,
		updateNodeContent,
		forkNode,
		stopEditing,
	]);

	// Handle cancel action (Escape)
	const handleEditCancel = useCallback(() => {
		// Stop editing without saving
		stopEditing(false);
	}, [stopEditing]);

	const handleContentChange = useCallback(
		(content: string) => {
			// Update the edited content in context
			setContextEditedContent(node.data.id, content);
		},
		[node.data.id, setContextEditedContent],
	);

	// Create data with local isEditing state and current content
	const dataWithEditingState = {
		...node.data,
		isEditing,
		content: isEditing ? currentContent : node.data.content,
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

/**
 * AINode wrapper component.
 *
 * AI nodes don't support direct editing (they're generated by the AI model).
 * This wrapper provides the node with proper props and handles regeneration interactions.
 *
 * @example
 * ```tsx
 * <EditableAINode
 *   node={node}
 *   isHovered={isHovered}
 * />
 * ```
 */
export const EditableAINode = memo<
	EditableNodeProps & Omit<AINodeProps, "data" | "selected">
>(function EditableAINode({ node, isHovered = false, ...props }) {
	// AI nodes don't support editing, so we just pass through the data
	return (
		<BaseAINode
			data={node.data}
			selected={node.selected}
			isHovered={isHovered}
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
 * This factory function returns the appropriate node component based on the role:
 * - USER nodes: returns EditableUserNode (with editing support)
 * - ASSISTANT nodes: returns EditableAINode (AI-generated, no editing)
 * - SYSTEM nodes: returns EditableUserNode (with editing support, for now)
 *
 * The update callback is provided via NodeEditingContext, allowing the
 * nodeTypes object to remain stable across renders.
 *
 * @returns A function that renders the node with appropriate component
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

		const role = node.data.role || "USER";

		// Render the appropriate component based on role
		if (role === "ASSISTANT") {
			return <EditableAINode node={node} isHovered={props.isHovered} />;
		}

		// Default to UserNode for USER and SYSTEM roles
		return <EditableUserNode node={node} isHovered={props.isHovered} />;
	};
}
