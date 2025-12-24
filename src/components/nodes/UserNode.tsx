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
			if (onEditToggle) {
				onEditToggle(false);
			}
		}
		if (e.key === "Escape") {
			e.preventDefault();
			if (onEditToggle) {
				onEditToggle(false);
			}
		}
	};

	return (
		<div
			className={`relative min-w-[280px] max-w-[400px] rounded-xl bg-slate-100 border-2 transition-all duration-200 ${
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
					className="w-3 h-3 bg-slate-400 border-2 border-slate-100 rounded-full"
				/>
			)}

			{/* Node Header - User Label */}
			<div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200/50">
				<div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center">
					<svg
						className="w-3.5 h-3.5 text-slate-600"
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
				<span className="text-sm font-medium text-slate-600">You</span>
				{isEditing && (
					<span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
						Editing
					</span>
				)}
			</div>

			{/* Node Content */}
			<div className="p-4">
				{isEditing ? (
					<textarea
						autoFocus
						defaultValue={content}
						onChange={handleContentChange}
						onKeyDown={handleKeyDown}
						className="w-full min-h-[60px] p-2 text-sm text-slate-800 bg-white rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
						placeholder="Enter your message..."
					/>
				) : (
					<p className="text-sm text-slate-800 whitespace-pre-wrap break-words">
						{content || (
							<span className="text-slate-400 italic">Empty message</span>
						)}
					</p>
				)}
			</div>

			{/* Output Handle (Bottom) - Only visible when hovered */}
			{isHovered && (
				<Handle
					type="source"
					position={Position.Bottom}
					className="w-3 h-3 bg-slate-400 border-2 border-slate-100 rounded-full"
				/>
			)}

			{/* Edit Hint - Only visible when hovered */}
			{isHovered && !isEditing && (
				<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 whitespace-nowrap">
					Double-click to edit
				</div>
			)}
		</div>
	);
}
