"use client";

import { Handle, Position } from "@xyflow/react";
import { MarkdownRenderer } from "../markdown/MarkdownRenderer";
import type { AINodeProps } from "./types";

/**
 * AINode - AI assistant response node component
 *
 * Visual style:
 * - White background with subtle shadow
 * - Markdown rendering support (code blocks, lists, tables)
 * - Highlighted border when selected
 * - Streaming indicator for active responses
 *
 * Interactions:
 * - Hover: Shows connection handles and action buttons
 * - Selected: Blue border highlight + shadow
 * - Double-click: Regenerate response
 *
 * @example
 * ```tsx
 * <AINode
 *   data={{ id: "2", role: "ASSISTANT", content: "## Hello\n\nThis is **markdown**!" }}
 *   selected={false}
 *   isHovered={false}
 *   onRegenerate={() => {}}
 *   onCopy={() => {}}
 * />
 * ```
 */
export function AINode({
	data,
	selected = false,
	isHovered = false,
	onRegenerate,
	onCopy,
	onCreateChild,
}: AINodeProps) {
	const { content, isStreaming = false, metadata } = data;

	const handleDoubleClick = () => {
		if (onRegenerate && !isStreaming) {
			onRegenerate();
		}
	};

	const handleCopy = () => {
		if (onCopy) {
			onCopy();
		} else {
			// Default copy behavior
			navigator.clipboard.writeText(content);
		}
	};

	// Extract provider/model from metadata for display
	const provider = (metadata?.provider as string) || "AI";
	const model = (metadata?.model as string) || "";

	return (
		<>
			{/* Wrapper to extend hover area for buttons outside the node */}
			<div className="relative pt-10 pb-8 -mt-10 -mb-8">
				{/* Action Bar - Only visible when hovered, positioned above node */}
				{isHovered && (
					<div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[var(--color-surface)] rounded-lg shadow-lg border border-[var(--color-border)] p-1 z-10">
						<button
							type="button"
							onClick={handleCopy}
							className="p-1.5 hover:bg-[var(--color-border-subtle)] rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
							title="Copy content"
							aria-label="Copy content"
						>
							<svg
								className="w-4 h-4"
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
								className="p-1.5 hover:bg-[var(--color-primary)]/10 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
								title="Regenerate response"
								aria-label="Regenerate response"
							>
								<svg
									className="w-4 h-4"
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
				)}
				{/* Main Node Container */}
				{/* biome-ignore lint/a11y/useSemanticElements: ReactFlow node requires div for positioning */}
				<div
					className={`relative w-[320px] rounded-xl bg-[var(--color-surface)] border-2 transition-all duration-200 ${
						selected
							? "border-[var(--color-primary)] shadow-[var(--shadow-node-selected)]"
							: "border-[var(--color-border)] shadow-[var(--shadow-node)]"
					} ${isHovered ? "shadow-[var(--shadow-node-hover)]" : ""}`}
					onDoubleClick={handleDoubleClick}
					role="button"
					tabIndex={0}
				>
					{/* Input Handle (Top) - Hidden, no manual connections */}
					<Handle
						type="target"
						position={Position.Top}
						id="ai-top"
						className="!opacity-0 !pointer-events-none"
					/>

					{/* Node Header - AI Label */}
					<div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]/50">
						<div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
							<svg
								className="w-3.5 h-3.5 text-[var(--color-primary)]"
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
						<div className="flex flex-col">
							<span className="text-sm font-medium text-[var(--color-text-primary)]">
								{provider}
							</span>
							{model && <span className="text-xs text-[var(--color-text-muted)]">{model}</span>}
						</div>
						{isStreaming && (
							<div className="ml-auto flex items-center gap-1">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)]/80 opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary)]" />
								</span>
								<span className="text-xs text-[var(--color-primary)]">Streaming</span>
							</div>
						)}
					</div>

					{/* Node Content - Markdown */}
					<div className="p-4 prose prose-sm prose-gray dark:prose-invert max-w-none">
						<MarkdownRenderer content={content || "*Empty response*"} />
					</div>

					{/* Output Handle (Bottom) - Hidden, no manual connections */}
					<Handle
						type="source"
						position={Position.Bottom}
						id="ai-bottom"
						className="!opacity-0 !pointer-events-none"
					/>
				</div>
				{/* Branch Button (+) - Only visible when hovered, positioned below node */}
				{isHovered && onCreateChild && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onCreateChild();
						}}
						className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-full shadow-md transition-all duration-200 hover:scale-110 active:scale-95 z-10"
						title="Create child node"
						aria-label="Create child node"
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
								strokeWidth={2.5}
								d="M12 4.5v15m7.5-7.5h-15"
							/>
						</svg>
					</button>
				)}
				{/* Action Hint - Only visible when hovered and no branch button */}
				{isHovered && !isStreaming && !onCreateChild && (
					<div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
						Double-click to regenerate
					</div>
				)}
			</div>
		</>
	);
}
