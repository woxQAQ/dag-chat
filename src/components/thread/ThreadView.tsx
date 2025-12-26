"use client";

import { useEffect, useRef, useState } from "react";
import type { ContextResult } from "@/app/nodes/actions";
import { getConversationContextAction } from "@/app/nodes/actions";
import { ThreadInput } from "./ThreadInput";
import { ThreadMessage as ThreadMessageComponent } from "./ThreadMessage";
import type { ThreadMessage, ThreadViewProps } from "./types";

/**
 * ThreadView - Linear conversation view for the Inspector Panel
 *
 * Displays the conversation path from Root to selected node in a chat-like format.
 * Users can continue the conversation from the bottom of the thread.
 *
 * Features:
 * - Fetches conversation context using getConversationContextAction() Server Action
 * - Displays messages in chronological order (root → selected node)
 * - Role-based styling (USER right-aligned, ASSISTANT left-aligned)
 * - Markdown rendering for AI responses
 * - Input area to continue conversation
 * - Auto-scroll to bottom on new messages
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <ThreadView
 *   nodeId="node-uuid"
 *   projectId="project-uuid"
 *   onSendMessage={async (message, parentNodeId) => {
 *     await sendMessage(message, parentNodeId);
 *   }}
 * />
 * ```
 */
export function ThreadView({
	nodeId,
	projectId,
	messages: propMessages,
	isLoading: propIsLoading = false,
	error: propError = null,
	onSendMessage,
	onMessageCopy,
	onMessageRegenerate,
	className = "",
}: ThreadViewProps) {
	const [messages, setMessages] = useState<ThreadMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSending, setIsSending] = useState(false);

	// Ref for auto-scrolling to bottom
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Use prop values if provided, otherwise use internal state
	const displayMessages = propMessages ?? messages;
	const displayIsLoading = propIsLoading ?? isLoading;
	const displayError = propError ?? error;

	// Fetch conversation context when nodeId changes
	useEffect(() => {
		if (!nodeId) {
			setMessages([]);
			setError(null);
			return;
		}

		let cancelled = false;

		const fetchContext = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await getConversationContextAction(nodeId);

				if (cancelled) return;

				if (!result.success || !result.data) {
					setError(result.error || "Failed to load conversation");
					setMessages([]);
					return;
				}

				const context: ContextResult = result.data;

				// Convert ContextMessage to ThreadMessage
				const threadMessages: ThreadMessage[] = context.messages.map((msg) => ({
					...msg,
					isStreaming: false,
					metadata: undefined,
				}));

				setMessages(threadMessages);
			} catch (err) {
				if (cancelled) return;

				const errorMessage =
					err instanceof Error ? err.message : "Failed to load conversation";
				setError(errorMessage);
				setMessages([]);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchContext();

		return () => {
			cancelled = true;
		};
	}, [nodeId]);

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const handleSendMessage = async (message: string) => {
		if (!nodeId || !projectId || !onSendMessage) {
			throw new Error("Cannot send message: missing required data");
		}

		setIsSending(true);

		try {
			await onSendMessage(message, nodeId);
		} finally {
			setIsSending(false);
		}
	};

	const handleCopy = (messageId: string, content: string) => {
		if (onMessageCopy) {
			onMessageCopy(messageId, content);
		} else {
			navigator.clipboard.writeText(content);
		}
	};

	// Empty state
	if (!nodeId && !displayIsLoading) {
		return (
			<div
				className={`flex flex-col h-full ${className}`}
				data-testid="thread-view-empty"
			>
				<div className="flex-1 flex items-center justify-center p-8">
					<p className="text-sm text-slate-400 text-center">
						Select a node to view the conversation thread
					</p>
				</div>
			</div>
		);
	}

	// Loading state
	if (displayIsLoading) {
		return (
			<div
				className={`flex flex-col h-full ${className}`}
				data-testid="thread-view-loading"
			>
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="flex flex-col items-center gap-3">
						<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
						<p className="text-sm text-slate-400">Loading conversation...</p>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (displayError) {
		return (
			<div
				className={`flex flex-col h-full ${className}`}
				data-testid="thread-view-error"
			>
				<div className="flex-1 flex items-center justify-center p-8">
					<div className="text-center">
						<p className="text-sm text-red-500 mb-2">
							Error loading conversation
						</p>
						<p className="text-xs text-slate-400">{displayError}</p>
					</div>
				</div>
			</div>
		);
	}

	// Main thread view with messages and input
	return (
		<div
			className={`flex flex-col h-full ${className}`}
			data-testid="thread-view"
		>
			{/* Messages list */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				{displayMessages.length === 0 ? (
					<div className="flex items-center justify-center h-full">
						<p className="text-sm text-slate-400">
							No messages in this conversation
						</p>
					</div>
				) : (
					<div className="flex flex-col group">
						{displayMessages.map((msg, index) => (
							<ThreadMessageComponent
								key={msg.id}
								message={msg}
								isLast={index === displayMessages.length - 1}
								onCopy={
									onMessageCopy
										? () => handleCopy(msg.id, msg.content)
										: undefined
								}
								onRegenerate={
									onMessageRegenerate && msg.role === "ASSISTANT"
										? () => onMessageRegenerate(msg.id)
										: undefined
								}
							/>
						))}
						<div ref={messagesEndRef} />
					</div>
				)}
			</div>

			{/* Input area */}
			{onSendMessage && projectId && (
				<ThreadInput
					isLoading={isSending}
					disabled={isSending || !nodeId}
					placeholder="Continue the conversation..."
					onSend={handleSendMessage}
				/>
			)}
		</div>
	);
}

/**
 * Server Action wrapper for ThreadView
 *
 * This component provides a version of ThreadView that works with Server Actions
 * for the message sending functionality.
 *
 * @example
 * ```tsx
 * import { ThreadViewServer } from "@/components/thread";
 * import { sendMessageAction } from "@/app/actions/chat";
 *
 * <ThreadViewServer
 *   nodeId="node-uuid"
 *   projectId="project-uuid"
 *   sendAction={sendMessageAction}
 * />
 * ```
 */
export function ThreadViewServer<
	T extends (message: string, parentNodeId: string) => Promise<void>,
>({ sendAction, ...props }: ThreadViewProps & { sendAction: T }) {
	return <ThreadView {...props} onSendMessage={sendAction} />;
}
