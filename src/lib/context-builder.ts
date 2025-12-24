/**
 * SVC-001: Context Builder Service
 *
 * Builds linear conversation context from root to a specific node
 * using PostgreSQL recursive CTE for efficient tree traversal.
 *
 * This is used to provide LLM context for AI responses.
 */

import { prisma } from "./prisma";

export type ContextMessage = {
	id: string;
	role: "SYSTEM" | "USER" | "ASSISTANT";
	content: string;
	positionInChain: number;
};

export type ContextResult = {
	messages: ContextMessage[];
	totalTokens: number;
	pathLength: number;
};

type RawContextNode = {
	id: string;
	parent_id: string | null;
	role: string;
	content: string;
	position_in_chain: number;
};

/**
 * Builds conversation context from root to the specified node.
 *
 * Uses PostgreSQL WITH RECURSIVE CTE to:
 * 1. Start from the target node
 * 2. Traverse up the tree following parentId links
 * 3. Return the path in correct chronological order (root -> target)
 *
 * @param nodeId - The target node ID (usually the last user message)
 * @returns Promise<ContextResult> with messages array and metadata
 *
 * @example
 * ```ts
 * const context = await buildConversationContext("node-uuid");
 * // Returns:
 * // {
 * //   messages: [
 * //     { id: "root", role: "SYSTEM", content: "...", positionInChain: 0 },
 * //     { id: "child", role: "USER", content: "Hello", positionInChain: 1 },
 * //     { id: "target", role: "ASSISTANT", content: "Hi!", positionInChain: 2 }
 * //   ],
 * //   totalTokens: 150,
 * //   pathLength: 3
 * // }
 * ```
 */
export async function buildConversationContext(
	nodeId: string,
): Promise<ContextResult> {
	// Validate UUID format
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(nodeId)) {
		throw new Error(`Invalid nodeId format: ${nodeId}`);
	}

	// Verify node exists
	const node = await prisma.node.findUnique({
		where: { id: nodeId },
		select: { id: true, projectId: true },
	});

	if (!node) {
		throw new Error(`Node not found: ${nodeId}`);
	}

	// Use recursive CTE to build path from target node to root
	const result = await prisma.$queryRaw<RawContextNode[]>`
		WITH RECURSIVE path_tree AS (
			-- Base case: start from the target node
			SELECT
				id,
				parent_id,
				role,
				content,
				0 as position_in_chain
			FROM "nodes"
			WHERE id = ${nodeId}::uuid

			UNION ALL

			-- Recursive case: traverse up to parent
			SELECT
				n.id,
				n.parent_id,
				n.role,
				n.content,
				pt.position_in_chain + 1
			FROM "nodes" n
			INNER JOIN path_tree pt ON n.id = pt.parent_id
		)
		SELECT
			id,
			parent_id,
			role,
			content,
			position_in_chain
		FROM path_tree
		ORDER BY position_in_chain DESC
	`;

	// Convert to ContextMessage format
	const messages: ContextMessage[] = result.map((row) => ({
		id: row.id,
		role: row.role as "SYSTEM" | "USER" | "ASSISTANT",
		content: row.content,
		positionInChain: row.position_in_chain,
	}));

	// Calculate approximate token count (rough estimate: ~4 chars per token)
	const totalTokens = messages.reduce(
		(sum, msg) => sum + Math.ceil(msg.content.length / 4),
		0,
	);

	return {
		messages,
		totalTokens,
		pathLength: messages.length,
	};
}

/**
 * Builds context for multiple nodes (for comparison or branching scenarios).
 *
 * @param nodeIds - Array of node IDs to build context for
 * @returns Promise<Map<string, ContextResult>> mapping nodeId to context
 */
export async function buildConversationContextBatch(
	nodeIds: string[],
): Promise<Map<string, ContextResult>> {
	const results = new Map<string, ContextResult>();

	// Process in parallel for better performance
	const contexts = await Promise.allSettled(
		nodeIds.map((id) => buildConversationContext(id)),
	);

	for (let i = 0; i < nodeIds.length; i++) {
		const nodeId = nodeIds[i];
		const result = contexts[i];

		if (result.status === "fulfilled") {
			results.set(nodeId, result.value);
		} else {
			// Store error as context with error message
			results.set(nodeId, {
				messages: [],
				totalTokens: 0,
				pathLength: 0,
			});
		}
	}

	return results;
}

/**
 * Truncates context to fit within a token budget.
 * Useful when the conversation history is too long for the LLM context window.
 *
 * @param context - The context result to truncate
 * @param maxTokens - Maximum tokens to keep
 * @returns Truncated ContextResult
 */
export function truncateContextByTokens(
	context: ContextResult,
	maxTokens: number,
): ContextResult {
	if (context.totalTokens <= maxTokens) {
		return context;
	}

	// Keep messages from the end (most recent) until we fit the budget
	const messages: ContextMessage[] = [];
	let tokenCount = 0;

	for (let i = context.messages.length - 1; i >= 0; i--) {
		const msg = context.messages[i];
		const msgTokens = Math.ceil(msg.content.length / 4);

		if (tokenCount + msgTokens > maxTokens) {
			break;
		}

		messages.unshift(msg);
		tokenCount += msgTokens;
	}

	// Add a warning message if we truncated
	if (messages.length > 0 && messages[0].positionInChain > 0) {
		messages[0] = {
			...messages[0],
			content: `[... ${context.pathLength - messages.length} earlier messages truncated ...]\n\n${messages[0].content}`,
		};
	}

	return {
		messages,
		totalTokens: tokenCount,
		pathLength: messages.length,
	};
}

/**
 * Formats context for AI SDK consumption.
 * Converts to the format expected by Vercel AI SDK.
 *
 * @param context - The context result to format
 * @returns Array of messages in AI SDK format
 */
export function formatContextForAI(
	context: ContextResult,
): Array<{ role: string; content: string }> {
	return context.messages.map((msg) => ({
		role: msg.role.toLowerCase() as "system" | "user" | "assistant",
		content: msg.content,
	}));
}
