/**
 * Prompt Input Dialog Component
 *
 * Modal dialog for entering a prompt when creating the first node.
 * Shown when user double-clicks on empty canvas.
 */

"use client";

import { useEffect, useRef, useState } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export interface PromptInputDialogProps {
	/** Whether the dialog is open */
	isOpen: boolean;
	/** Callback when dialog is closed without submitting */
	onClose: () => void;
	/** Callback when user submits the prompt */
	onSubmit: (prompt: string) => void;
	/** Optional placeholder text */
	placeholder?: string;
	/** Maximum character count (default: 4000) */
	maxLength?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for entering a prompt when creating a root node.
 *
 * Features:
 * - Auto-focus on textarea when opened
 * - Character count with warning at 90%
 * - Keyboard shortcuts: Cmd/Ctrl+Enter to submit, Escape to close
 * - Click outside or close button to cancel
 *
 * @example
 * ```tsx
 * <PromptInputDialog
 *   isOpen={showPromptDialog}
 *   onClose={() => setShowPromptDialog(false)}
 *   onSubmit={(prompt) => createRootNodeWithContent(prompt)}
 * />
 * ```
 */
export function PromptInputDialog({
	isOpen,
	onClose,
	onSubmit,
	placeholder = "Enter your prompt to start the conversation...",
	maxLength = 4000,
}: PromptInputDialogProps) {
	const [prompt, setPrompt] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Reset prompt and focus textarea when dialog opens
	useEffect(() => {
		if (isOpen) {
			setPrompt("");
			// Focus textarea after a small delay to ensure DOM is ready
			const timeout = setTimeout(() => {
				textareaRef.current?.focus();
			}, 50);
			return () => clearTimeout(timeout);
		}
	}, [isOpen]);

	// Prevent body scroll when dialog is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const handleSubmit = () => {
		const trimmed = prompt.trim();
		if (trimmed) {
			onSubmit(trimmed);
			setPrompt("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit();
		}
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	if (!isOpen) return null;

	const charCount = prompt.length;
	const charCountPercent = charCount / maxLength;
	const isNearLimit = charCountPercent >= 0.9;
	const canSubmit = prompt.trim().length > 0;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop with click-to-close
		// biome-ignore lint/a11y/useKeyWithClickEvents: Escape key is handled separately in onKeyDown
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={handleBackdropClick}
		>
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
				{/* Header */}
				<div className="px-6 py-4 border-b border-slate-200">
					<h2 className="text-xl font-semibold text-slate-800">
						Start Your Thought Flow
					</h2>
					<p className="text-sm text-slate-500 mt-1">
						Enter your first prompt to begin the conversation
					</p>
				</div>

				{/* Content */}
				<div className="p-6">
					<textarea
						ref={textareaRef}
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						maxLength={maxLength}
						rows={6}
						className="w-full p-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y min-h-[120px] max-h-[300px]"
					/>

					{/* Character Count */}
					<div className="flex justify-end mt-2">
						<span
							className={`text-xs ${
								isNearLimit ? "text-amber-600 font-medium" : "text-slate-400"
							}`}
						>
							{charCount} / {maxLength}
						</span>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={!canSubmit}
						className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors"
					>
						Create Node
					</button>
				</div>

				{/* Keyboard Hints */}
				<div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-center gap-6">
					<div className="flex items-center gap-1.5 text-xs text-slate-500">
						<kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px]">
							⌘
						</kbd>
						<kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px]">
							Enter
						</kbd>
						<span>to submit</span>
					</div>
					<div className="flex items-center gap-1.5 text-xs text-slate-500">
						<kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px]">
							Esc
						</kbd>
						<span>to cancel</span>
					</div>
				</div>
			</div>
		</div>
	);
}
