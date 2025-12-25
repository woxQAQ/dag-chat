"use client";

import { Handle, Position } from "@xyflow/react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
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
		<div
			className={`relative min-w-[320px] max-w-[500px] rounded-xl bg-white border-2 transition-all duration-200 ${
				selected
					? "border-blue-500 shadow-[0_0_0_2px_#2563EB,0_10px_15px_-3px_rgba(0,0,0,0.1)]"
					: "border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]"
			} ${isHovered ? "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]" : ""}`}
			onDoubleClick={handleDoubleClick}
			role="button"
			tabIndex={0}
		>
			{/* Input Handle (Top) - Only visible when hovered */}
			{isHovered && (
				<Handle
					type="target"
					position={Position.Top}
					className="w-3 h-3 bg-blue-400 border-2 border-white rounded-full"
				/>
			)}

			{/* Node Header - AI Label */}
			<div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200/50">
				<div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
					<svg
						className="w-3.5 h-3.5 text-blue-600"
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
					<span className="text-sm font-medium text-slate-800">{provider}</span>
					{model && <span className="text-xs text-slate-400">{model}</span>}
				</div>
				{isStreaming && (
					<div className="ml-auto flex items-center gap-1">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
						</span>
						<span className="text-xs text-blue-600">Streaming</span>
					</div>
				)}
			</div>

			{/* Node Content - Markdown */}
			<div className="p-4 prose prose-sm prose-slate max-w-none">
				<ReactMarkdown
					rehypePlugins={[rehypeHighlight]}
					remarkPlugins={[remarkGfm]}
					components={{
						// Custom styling for code blocks
						pre: ({ className, children, ...props }) => (
							<pre
								className={className}
								style={{
									background: "#f1f5f9",
									padding: "1rem",
									borderRadius: "0.5rem",
									overflowX: "auto",
								}}
								{...props}
							>
								{children}
							</pre>
						),
						// Custom styling for inline code
						code: ({ className, children, ...props }) => {
							const isInline = !className;
							if (isInline) {
								return (
									<code
										className="bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded text-sm font-mono"
										{...props}
									>
										{children}
									</code>
								);
							}
							return (
								<code className={className} {...props}>
									{children}
								</code>
							);
						},
						// Custom styling for links
						a: ({ children, href, ...props }) => (
							<a
								href={href}
								className="text-blue-600 hover:text-blue-800 underline"
								target="_blank"
								rel="noopener noreferrer"
								{...props}
							>
								{children}
							</a>
						),
					}}
				>
					{content || "*Empty response*"}
				</ReactMarkdown>
			</div>

			{/* Output Handle (Bottom) - Only visible when hovered */}
			{isHovered && (
				<Handle
					type="source"
					position={Position.Bottom}
					className="w-3 h-3 bg-blue-400 border-2 border-white rounded-full"
				/>
			)}

			{/* Branch Button (+) - Only visible when hovered */}
			{isHovered && onCreateChild && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onCreateChild();
					}}
					className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
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

			{/* Action Bar - Only visible when hovered */}
			{isHovered && (
				<div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-200 p-1">
					<button
						type="button"
						onClick={handleCopy}
						className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition-colors"
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
							className="p-1.5 hover:bg-blue-50 rounded-md text-slate-500 hover:text-blue-600 transition-colors"
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

			{/* Action Hint - Only visible when hovered and no branch button */}
			{isHovered && !isStreaming && !onCreateChild && (
				<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
					Double-click to regenerate
				</div>
			)}
		</div>
	);
}
