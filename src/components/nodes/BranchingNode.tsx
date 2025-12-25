/**
 * UI-NEW-002: Branching Interaction Wrapper Component
 *
 * A wrapper component that adds branching interaction to existing node components.
 * Use this to wrap UserNode and AINode when using them in the canvas.
 *
 * This component uses React Flow's internal hover detection to show the branch button.
 */

"use client";

import { memo } from "react";
import { UserNode as BaseUserNode } from "./UserNode";
import { AINode as BaseAINode } from "./AINode";
import type { MindFlowNode } from "./types";
import type { UserNodeProps, AINodeProps } from "./types";

// ============================================================================
// Type Definitions
// ============================================================================

export interface BranchingNodeProps {
	/** The React Flow node data */
	node: MindFlowNode;
	/** Whether the node is currently hovered (detected by React Flow) */
	isHovered?: boolean;
	/** Callback to create a child node from this node */
	onCreateChild?: () => void;
}

// ============================================================================
// Branching Wrapper Components
// ============================================================================

/**
 * UserNode with branching interaction support.
 *
 * Extends the base UserNode with a "+" button that appears on hover,
 * allowing users to create child nodes.
 *
 * @example
 * ```tsx
 * <BranchingUserNode
 *   node={node}
 *   isHovered={isHovered}
 *   onCreateChild={() => createChildNode(node.id)}
 * />
 * ```
 */
export const BranchingUserNode = memo<BranchingNodeProps & UserNodeProps>(
	function BranchingUserNode({ node, isHovered = false, onCreateChild, ...props }) {
		return (
			<BaseUserNode
				data={node.data}
				selected={node.selected}
				isHovered={isHovered}
				onCreateChild={onCreateChild}
				{...props}
			/>
		);
	},
);

/**
 * AINode with branching interaction support.
 *
 * Extends the base AINode with a "+" button that appears on hover,
 * allowing users to create child nodes.
 *
 * @example
 * ```tsx
 * <BranchingAINode
 *   node={node}
 *   isHovered={isHovered}
 *   onCreateChild={() => createChildNode(node.id)}
 * />
 * ```
 */
export const BranchingAINode = memo<BranchingNodeProps & AINodeProps>(
	function BranchingAINode({ node, isHovered = false, onCreateChild, ...props }) {
		return (
			<BaseAINode
				data={node.data}
				selected={node.selected}
				isHovered={isHovered}
				onCreateChild={onCreateChild}
				{...props}
			/>
		);
	},
);

// ============================================================================
// Node Factory Function
// ============================================================================

/**
 * Creates a branching-enabled node component based on the node role.
 *
 * This factory function returns the appropriate component (User or AI)
 * with branching support.
 *
 * @param onCreateChild - Callback when branch button is clicked
 * @returns A function that renders the appropriate node with branching support
 *
 * @example
 * ```tsx
 * const nodeTypes = {
 *   user: createBranchingNode("user", (parentId) => createChildNode(parentId)),
 *   assistant: createBranchingNode("assistant", (parentId) => createChildNode(parentId)),
 * };
 * ```
 */
export function createBranchingNode(
	role: "user" | "assistant",
	onCreateChild: (parentId: string) => void,
) {
	return function BranchingNode(props: { node: MindFlowNode; isHovered?: boolean }) {
		const handleCreateChild = () => onCreateChild(props.node.data.id);

		if (role === "user") {
			return (
				<BranchingUserNode
					{...props}
					onCreateChild={handleCreateChild}
				/>
			);
		}

		return (
			<BranchingAINode
				{...props}
				onCreateChild={handleCreateChild}
			/>
		);
	};
}
