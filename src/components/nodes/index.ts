/**
 * MindFlow Node Components
 *
 * Custom React Flow node components for rendering conversation nodes.
 * Supports USER, ASSISTANT, and SYSTEM node types with distinct visual styles.
 */

import { AINode } from "./AINode";
// Import components first
import { UserNode } from "./UserNode";

export { AINode } from "./AINode";
export type { BranchingNodeProps } from "./BranchingNode";
// UI-NEW-002: Branching interaction components
export {
	BranchingAINode,
	BranchingUserNode,
	createBranchingNode,
} from "./BranchingNode";
// UI-NEW-004: Content editing components
export {
	createEditableNode,
	EditableUserNode,
} from "./EditableNode";
// Types
export type {
	AINodeProps,
	BaseNodeProps,
	MindFlowNode,
	MindFlowNodeData,
	NodeRole,
	SystemNodeProps,
	UserNodeProps,
} from "./types";
// Node components
export { UserNode } from "./UserNode";

/**
 * Node types configuration for React Flow
 *
 * Maps node type strings to their corresponding React components.
 * Pass this to the `nodeTypes` prop of ReactFlow or InfiniteCanvas.
 *
 * @example
 * ```tsx
 * import { nodeTypes } from "@/components/nodes";
 *
 * <InfiniteCanvas
 *   nodes={nodes}
 *   nodeTypes={nodeTypes}
 *   ...
 * />
 * ```
 */
export const nodeTypes = {
	user: UserNode,
	assistant: AINode,
	system: AINode, // Reuse AINode for system nodes (can be customized later)
};
