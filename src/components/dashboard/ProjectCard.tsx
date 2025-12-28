/**
 * UI-007: Dashboard - ProjectCard Component
 *
 * Displays a single project as a card with:
 * - Project name and description
 * - Node count and timestamps
 * - Open, rename, and delete actions
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import type { DashboardProjectCardProps } from "./types";

export function ProjectCard({
	project,
	onOpen,
	onDelete,
	onRename,
}: DashboardProjectCardProps) {
	const [isRenaming, setIsRenaming] = useState(false);
	const [newName, setNewName] = useState(project.name);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	};

	const handleRename = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newName.trim() && newName !== project.name && onRename) {
			await onRename(project.id, newName.trim());
		}
		setIsRenaming(false);
	};

	const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		// Don't close if focus is moving to save or cancel button
		const relatedTarget = e.relatedTarget as HTMLElement | null;
		const isButton =
			relatedTarget?.tagName === "BUTTON" || relatedTarget?.role === "button";
		if (
			isButton &&
			relatedTarget?.closest("form") === e.target.closest("form")
		) {
			return;
		}
		setIsRenaming(false);
	};

	const handleDelete = async () => {
		await onDelete(project.id);
		setShowDeleteConfirm(false);
	};

	return (
		<div className="group relative bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 hover:shadow-md hover:border-[var(--color-text-muted)] transition-all duration-200">
			{/* Card Header */}
			<div className="flex items-start justify-between gap-3 mb-3">
				{isRenaming ? (
					<form onSubmit={handleRename} className="flex-1 flex gap-2">
						<input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onBlur={handleInputBlur}
							className="flex-1 px-2 py-1 text-lg font-semibold text-[var(--color-text-primary)] border border-[var(--color-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
							maxLength={100}
						/>
						<button
							type="submit"
							className="px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-md hover:bg-[var(--color-primary-hover)] transition-colors"
						>
							Save
						</button>
						<button
							type="button"
							onClick={() => {
								setIsRenaming(false);
								setNewName(project.name);
							}}
							className="px-3 py-1 bg-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-md hover:bg-[var(--color-text-muted)] transition-colors"
						>
							Cancel
						</button>
					</form>
				) : (
					<h3 className="flex-1 text-lg font-semibold text-[var(--color-text-primary)] line-clamp-2">
						{project.name}
					</h3>
				)}

				<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
					{onRename && !isRenaming && (
						<button
							type="button"
							onClick={() => setIsRenaming(true)}
							className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] rounded-md transition-colors"
							title="Rename project"
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
									d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
								/>
							</svg>
						</button>
					)}
					<button
						type="button"
						onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
						className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-md transition-colors"
						title="Delete project"
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
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Description */}
			{project.description && (
				<p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-4">
					{project.description}
				</p>
			)}

			{/* Stats */}
			<div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mb-4">
				<div className="flex items-center gap-1.5">
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
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						/>
					</svg>
					<span>{project._nodeCount ?? 0} nodes</span>
				</div>
				<div className="flex items-center gap-1.5">
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
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span>{formatDate(project.updatedAt)}</span>
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]/60">
				<Link
					href={`/workspace?project=${project.id}`}
					className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
					onClick={() => onOpen(project.id)}
				>
					Open
				</Link>

				{/* Delete Confirmation */}
				{showDeleteConfirm && (
					<div className="absolute inset-0 bg-[var(--color-surface)]/95 rounded-xl flex items-center justify-center p-4 z-10">
						<div className="text-center">
							<p className="text-sm text-[var(--color-text-primary)] mb-3">
								Delete this project?
							</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleDelete}
									className="px-3 py-1.5 bg-[var(--color-error)] text-white text-sm rounded-md hover:bg-red-600 transition-colors"
								>
									Delete
								</button>
								<button
									type="button"
									onClick={() => setShowDeleteConfirm(false)}
									className="px-3 py-1.5 bg-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-md hover:bg-[var(--color-text-muted)] transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
