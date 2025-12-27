"use client";

import { type FormEvent, useCallback, useRef, useState } from "react";
import type { ThreadInputProps } from "./types";

/**
 * ThreadInput - Message input area for continuing the conversation
 *
 * Features:
 * - Auto-growing textarea
 * - Send button with loading state
 * - Keyboard shortcut (Cmd/Ctrl+Enter to send)
 * - Character limit indicator
 * - Disabled state during streaming
 *
 * @example
 * ```tsx
 * <ThreadInput
 *   isLoading={false}
 *   placeholder="Continue the conversation..."
 *   onSend={async (message) => { await sendMessage(message); }}
 * />
 * ```
 */
export function ThreadInput({
	isLoading = false,
	disabled = false,
	placeholder = "Type a message...",
	onSend,
	className = "",
}: ThreadInputProps) {
	const [message, setMessage] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const maxLength = 4000;

	// Auto-resize textarea
	const adjustHeight = useCallback(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			const newHeight = Math.min(textarea.scrollHeight, 200);
			textarea.style.height = `${newHeight}px`;
		}
	}, []);

	const handleSend = useCallback(
		async (e?: FormEvent) => {
			e?.preventDefault();

			const trimmedMessage = message.trim();
			if (!trimmedMessage || isLoading || disabled) {
				return;
			}

			setMessage("");
			adjustHeight();

			try {
				await onSend(trimmedMessage);
			} catch (error) {
				// Restore message on error
				setMessage(trimmedMessage);
				console.error("Failed to send message:", error);
			}
		},
		[message, isLoading, disabled, onSend, adjustHeight],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newValue = e.target.value;
			if (newValue.length <= maxLength) {
				setMessage(newValue);
				adjustHeight();
			}
		},
		[adjustHeight],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			// Send on Cmd/Ctrl+Enter
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				handleSend(e);
			}
			// Escape to clear
			if (e.key === "Escape" && !isLoading) {
				setMessage("");
				adjustHeight();
			}
		},
		[isLoading, adjustHeight, handleSend],
	);

	const isDisabled = isLoading || disabled;
	const charCount = message.length;
	const isNearLimit = charCount > maxLength * 0.9;

	return (
		<div
			className={`border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 ${className}`}
		>
			<form onSubmit={handleSend} className="flex flex-col gap-2">
				<div className="relative flex items-end gap-2">
					<div className="flex-1 relative">
						<textarea
							ref={textareaRef}
							value={message}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							disabled={isDisabled}
							placeholder={placeholder}
							rows={1}
							className={`w-full px-4 py-3 pr-12 bg-[var(--color-surface)] border rounded-xl resize-none transition-all ${
								isDisabled
									? "bg-[var(--color-border-subtle)] text-[var(--color-text-muted)] cursor-not-allowed"
									: "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
							}`}
							style={{ minHeight: "48px", maxHeight: "200px" }}
							aria-label="Message input"
							aria-disabled={isDisabled}
						/>
						{/* Character count */}
						{message.length > 0 && (
							<div
								className={`absolute bottom-2 right-2 text-xs ${
									isNearLimit
										? "text-[var(--color-warning)]"
										: "text-[var(--color-text-muted)]"
								}`}
							>
								{charCount}/{maxLength}
							</div>
						)}
					</div>

					{/* Send button */}
					<button
						type="submit"
						disabled={isDisabled || !message.trim()}
						className={`flex items-center justify-center w-12 h-12 rounded-xl border-0 transition-all ${
							isDisabled || !message.trim()
								? "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
								: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)] shadow-sm hover:shadow-md"
						}`}
						aria-label="Send message"
						title={isDisabled ? "Sending..." : "Send message (Cmd+Enter)"}
					>
						{isLoading ? (
							// Loading spinner
							<svg
								className="w-5 h-5 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
						) : (
							// Send icon
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
								/>
							</svg>
						)}
					</button>
				</div>

				{/* Helper text */}
				<p className="text-xs text-[var(--color-text-muted)] text-center">
					Press{" "}
					<kbd className="px-1.5 py-0.5 bg-[var(--color-border)] rounded text-[var(--color-text-secondary)]">
						Cmd+Enter
					</kbd>{" "}
					to send
				</p>
			</form>
		</div>
	);
}
