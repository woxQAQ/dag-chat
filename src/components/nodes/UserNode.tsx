"use client";

import { Handle, Position } from "@xyflow/react";
import type { UserNodeProps } from "./types";

/**
 * UserNode - User input message node component
 *
 * Visual style:
 * - Light gray background with subtle border
 * - Sans-serif font
 * - Minimal visual weight compared to AI nodes
 *
 * Interactions:
 * - Hover: Shows branch (+) button for creating child nodes
 * - Selected: Blue border highlight
 *
 * @example
 * ```tsx
 * <UserNode
 *   data={{ id: "1", role: "USER", content: "Hello AI" }}
 *   selected={false}
 *   isHovered={false}
 *   onCreateChild={() => {}}
 * />
 * ```
 */
export function UserNode({
	data,
	selected = false,
	isHovered = false,
	onCreateChild,
}: UserNodeProps) {
	const { content } = data;

	return (
		<>
			{/* Wrapper to extend hover area for buttons outside the node */}
			{/* Note: Negative margin (-mr-8) compensates for padding to keep node dimensions consistent */}
			<div className="relative pr-8 -mr-8">
				{/* Branch Button (+) - Only visible when hovered, positioned to the right */}
				{isHovered && onCreateChild && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onCreateChild();
						}}
						className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-full shadow-md transition-all duration-200 hover:scale-110 active:scale-95 z-10"
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
								strokeWidth={2}
								d="M12 4.5v15m7.5-7.5h-15"
							/>
						</svg>
					</button>
				)}
				{/* Main Node Container */}
				{/* biome-ignore lint/a11y/useSemanticElements: ReactFlow node requires div for positioning */}
				<div
					className={`relative w-[320px] rounded-xl bg-[var(--color-surface-elevated)] border-2 transition-all duration-200 ${
						selected
							? "border-[var(--color-primary)] shadow-[var(--shadow-node-selected)]"
							: "border-[var(--color-border)] shadow-[var(--shadow-node)]"
					} ${isHovered ? "shadow-[var(--shadow-node-hover)]" : ""}`}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" && onCreateChild) {
							e.stopPropagation();
							onCreateChild();
						}
					}}
				>
					{/* Input Handle (Top) - Hidden, no manual connections */}
					<Handle
						type="target"
						position={Position.Top}
						id="user-top"
						className="!opacity-0 !pointer-events-none"
					/>

					{/* Node Header - User Label */}
					<div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]/50">
						<div className="w-6 h-6 rounded-full bg-[var(--color-border)] flex items-center justify-center">
							<svg
								className="w-3.5 h-3.5 text-[var(--color-text-secondary)]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
						<span className="text-sm font-medium text-[var(--color-text-secondary)]">
							You
						</span>
					</div>

					{/* Node Content */}
					<div className="p-4">
						<p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
							{content || (
								<span className="text-[var(--color-text-muted)] italic">
									Empty message
								</span>
							)}
						</p>
					</div>

					{/* Output Handle (Bottom) - Hidden, no manual connections */}
					<Handle
						type="source"
						position={Position.Bottom}
						id="user-bottom"
						className="!opacity-0 !pointer-events-none"
					/>
				</div>
			</div>
		</>
	);
}
