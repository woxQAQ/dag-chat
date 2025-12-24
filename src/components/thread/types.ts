/**
 * UI-004: Thread View Types
 *
 * Type definitions for the Inspector Panel Thread View component.
 */

import type { ContextMessage } from "@/lib/context-builder";

/**
 * Message role in the thread view
 */
export type ThreadMessageRole = "SYSTEM" | "USER" | "ASSISTANT";

/**
 * Message displayed in the thread view
 */
export interface ThreadMessage extends ContextMessage {
	/**
	 * Whether this message is currently streaming (for AI responses)
	 */
	isStreaming?: boolean;

	/**
	 * Metadata associated with the message (provider, model, etc.)
	 */
	metadata?: {
		provider?: string;
		model?: string;
		streaming?: boolean;
		contextLength?: number;
		contextTokens?: number;
		[key: string]: unknown;
	};
}

/**
 * Props for ThreadView component
 */
export interface ThreadViewProps {
	/**
	 * The selected node ID (for building conversation context)
	 */
	nodeId: string | null;

	/**
	 * The project ID (for context building and continuing conversation)
	 */
	projectId: string | null;

	/**
	 * Messages to display in the thread (optional, fetched by default)
	 */
	messages?: ThreadMessage[];

	/**
	 * Whether messages are currently loading
	 */
	isLoading?: boolean;

	/**
	 * Error message if loading failed
	 */
	error?: string | null;

	/**
	 * Callback when user sends a new message
	 * @param message - The message content to send
	 * @param parentNodeId - The parent node ID to build context from
	 */
	onSendMessage?: (message: string, parentNodeId: string) => Promise<void>;

	/**
	 * Callback when a message is copied
	 */
	onMessageCopy?: (messageId: string, content: string) => void;

	/**
	 * Callback when a message needs regeneration
	 */
	onMessageRegenerate?: (messageId: string) => void;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * Props for ThreadMessage component
 */
export interface ThreadMessageProps {
	/**
	 * The message data
	 */
	message: ThreadMessage;

	/**
	 * Whether this is the last message in the thread
	 */
	isLast?: boolean;

	/**
	 * Callback when copy button is clicked
	 */
	onCopy?: () => void;

	/**
	 * Callback when regenerate button is clicked
	 */
	onRegenerate?: () => void;
}

/**
 * Props for ThreadInput component
 */
export interface ThreadInputProps {
	/**
	 * Whether a message is currently being sent
	 */
	isLoading?: boolean;

	/**
	 * Whether the input is disabled
	 */
	disabled?: boolean;

	/**
	 * Placeholder text for the input
	 */
	placeholder?: string;

	/**
	 * Callback when send button is clicked
	 * @param message - The message content to send
	 */
	onSend: (message: string) => Promise<void>;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}
