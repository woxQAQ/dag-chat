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
 * - Hover: Shows connection handles
 * - Selected: Blue border highlight
 * - Double-click: Enters edit mode
 *
 * @example
 * ```tsx
 * <UserNode
 *   data={{ id: "1", role: "USER", content: "Hello AI" }}
 *   selected={false}
 *   isHovered={false}
 * />
 * ```
 */
export function UserNode({
	data,
	selected = false,
	isHovered = false,
	onContentChange,
	onEditToggle,
	onEditSave,
	onEditCancel,
	onCreateChild: _onCreateChild,
}: UserNodeProps) {
	const { content, isEditing = false } = data;

	const handleDoubleClick = () => {
		if (onEditToggle) {
			onEditToggle(!isEditing);
		}
	};

	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (onContentChange) {
			onContentChange(e.target.value);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			// Call both onEditToggle and onEditSave for save action
			if (onEditToggle) {
				onEditToggle(false);
			}
			if (onEditSave) {
				onEditSave();
			}
		}
		if (e.key === "Escape") {
			e.preventDefault();
			// Call both onEditToggle and onEditCancel for cancel action
			if (onEditToggle) {
				onEditToggle(false);
			}
			if (onEditCancel) {
				onEditCancel();
			}
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: ReactFlow node requires div for positioning
		<div
			className={`relative w-[320px] rounded-xl bg-[var(--color-surface-elevated)] border-2 transition-all duration-200 ${
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
				<span className="text-sm font-medium text-[var(--color-text-secondary)]">You</span>
				{isEditing && (
					<span className="ml-auto text-xs text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-2 py-0.5 rounded-full">
						Editing
					</span>
				)}
			</div>

			{/* Node Content */}
			<div className="p-4">
				{isEditing ? (
					<textarea
						defaultValue={content}
						onChange={handleContentChange}
						onKeyDown={handleKeyDown}
						className="w-full min-h-[60px] p-2 text-sm text-[var(--color-text-primary)] bg-[var(--color-surface)] rounded-lg border border-[var(--color-primary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
						placeholder="Enter your message..."
					/>
				) : (
					<p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
						{content || (
							<span className="text-[var(--color-text-muted)] italic">Empty message</span>
						)}
					</p>
				)}
			</div>

			{/* Output Handle (Bottom) - Hidden, no manual connections */}
			<Handle
				type="source"
				position={Position.Bottom}
				id="user-bottom"
				className="!opacity-0 !pointer-events-none"
			/>

			{/* Edit Hint - Only visible when hovered */}
			{isHovered && !isEditing && (
				<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--color-text-muted)] whitespace-nowrap">
					Double-click to edit
				</div>
			)}
		</div>
	);
}
