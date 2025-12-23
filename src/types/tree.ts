/**
 * Type definitions for conversation tree structures
 */

export type MessageRole = "SYSTEM" | "USER" | "ASSISTANT";

/**
 * Represents a single node in the conversation tree
 */
export interface MessageNode {
	id: string;
	parentId: string | null;
	role: MessageRole;
	content: string;
	createdAt: Date;
	children: MessageNode[];
}

/**
 * Response format for the tree retrieval API
 */
export interface TreeResponse {
	conversationId: string;
	tree: MessageNode[];
	nodeCount: number;
}

/**
 * Error response format for API errors
 */
export interface TreeErrorResponse {
	error: string;
	details?: string;
}
