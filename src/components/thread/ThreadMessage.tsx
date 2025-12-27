"use client";

import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import type { ThreadMessageProps } from "./types";

/**
 * ThreadMessage - Individual message in the thread view
 *
 * Displays messages in a chat-like format with role-based styling:
 * - USER: Right-aligned, gray background
 * - ASSISTANT: Left-aligned, white background with markdown
 * - SYSTEM: Centered, muted text
 *
 * @example
 * ```tsx
 * <ThreadMessage
 *   message={{ id: "1", role: "USER", content: "Hello!", positionInChain: 0 }}
 *   isLast={true}
 *   onCopy={() => {}}
 * />
 * ```
 */
export function ThreadMessage({
	message,
	isLast = false,
	onCopy,
	onRegenerate,
}: ThreadMessageProps) {
	const { role, content, isStreaming = false, metadata } = message;

	// Extract provider/model from metadata for display
	const provider = (metadata?.provider as string) || "AI";
	const model = (metadata?.model as string) || "";

	const handleCopy = () => {
		if (onCopy) {
			onCopy();
		} else {
			// Default copy behavior
			navigator.clipboard.writeText(content);
		}
	};

	// System message - centered, muted
	if (role === "SYSTEM") {
		return (
			<div className="flex justify-center my-4">
				<div className="px-3 py-1.5 bg-slate-100 rounded-full">
					<p className="text-xs text-slate-500 text-center max-w-md">
						{content || "*System message*"}
					</p>
				</div>
			</div>
		);
	}

	// User message - right aligned
	if (role === "USER") {
		return (
			<div className={`flex justify-end my-3 ${isLast ? "mb-4" : ""}`}>
				<div className="max-w-[80%] flex flex-col items-end gap-1">
					<div className="bg-blue-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md">
						<p className="text-sm whitespace-pre-wrap break-words">
							{content || "*Empty message*"}
						</p>
					</div>
					<span className="text-xs text-slate-400">You</span>
				</div>
			</div>
		);
	}

	// Assistant message - left aligned with markdown
	return (
		<div className={`flex justify-start my-3 ${isLast ? "mb-4" : ""}`}>
			<div className="max-w-[85%] flex flex-col gap-2">
				{/* Header with AI label and actions */}
				<div className="flex items-center gap-2 px-1">
					<div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
						<svg
							className="w-3 h-3 text-blue-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							/>
						</svg>
					</div>
					<span className="text-xs font-medium text-slate-700">{provider}</span>
					{model && <span className="text-xs text-slate-400">{model}</span>}
					{isStreaming && (
						<div className="flex items-center gap-1 ml-auto">
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
							</span>
							<span className="text-xs text-blue-600">Streaming</span>
						</div>
					)}
					{/* Action buttons */}
					<div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
						<button
							type="button"
							onClick={handleCopy}
							className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
							title="Copy"
							aria-label="Copy message"
						>
							<svg
								className="w-3.5 h-3.5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						</button>
						{!isStreaming && onRegenerate && (
							<button
								type="button"
								onClick={onRegenerate}
								className="p-1 hover:bg-blue-50 rounded text-slate-400 hover:text-blue-600 transition-colors"
								title="Regenerate"
								aria-label="Regenerate response"
							>
								<svg
									className="w-3.5 h-3.5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
							</button>
						)}
					</div>
				</div>

				{/* Content with markdown */}
				<div className="px-1 py-1">
					<div className="prose prose-sm prose-slate max-w-none">
						<MarkdownRenderer content={content || "*Empty response*"} />
					</div>
				</div>
			</div>
		</div>
	);
}
