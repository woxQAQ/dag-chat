import type { Node } from "@xyflow/react";

/**
 * Node role enum matching database schema
 */
export type NodeRole = "SYSTEM" | "USER" | "ASSISTANT";

/**
 * Custom data stored in each React Flow node
 */
export interface MindFlowNodeData {
	/** Unique identifier (matches database Node.id) */
	id: string;
	/** Node role (user, assistant, or system) */
	role: NodeRole;
	/** Message content */
	content: string;
	/** Whether the node is currently being edited */
	isEditing?: boolean;
	/** Whether the node is streaming AI response */
	isStreaming?: boolean;
	/** Timestamp when node was created */
	createdAt?: Date;
	/** Metadata stored as JSONB */
	metadata?: Record<string, unknown>;
	/** Index signature for additional properties required by React Flow Node type */
	[key: string]: unknown;
}

/**
 * Extended React Flow Node type for MindFlow
 */
export type MindFlowNode = Node<MindFlowNodeData>;

/**
 * Props shared by all node components
 */
export interface BaseNodeProps {
	/** React Flow node data */
	data: MindFlowNodeData;
	/** Whether the node is selected */
	selected?: boolean;
	/** Whether the node is being hovered */
	isHovered?: boolean;
}

/**
 * Props for UserNode component
 */
export interface UserNodeProps extends BaseNodeProps {
	/** Callback when node content is edited */
	onContentChange?: (content: string) => void;
	/** Callback when edit mode is toggled */
	onEditToggle?: (isEditing: boolean) => void;
	/** Callback when edit is saved (Cmd/Ctrl+Enter) */
	onEditSave?: () => void;
	/** Callback when edit is cancelled (Escape) */
	onEditCancel?: () => void;
	/** Callback to create a child node from this node (branching interaction) */
	onCreateChild?: () => void;
	/** Callback to fork this node (non-destructive editing - creates parallel branch) */
	onNodeFork?: (
		nodeId: string,
		newContent: string,
		x: number,
		y: number,
	) => Promise<void>;
}

/**
 * Props for AINode component
 */
export interface AINodeProps extends BaseNodeProps {
	/** Callback to regenerate AI response */
	onRegenerate?: () => void;
	/** Callback to copy node content */
	onCopy?: () => void;
	/** Callback to create a child node from this node (branching interaction) */
	onCreateChild?: () => void;
}

/**
 * Props for SystemNode component (future use)
 */
export interface SystemNodeProps extends BaseNodeProps {}
