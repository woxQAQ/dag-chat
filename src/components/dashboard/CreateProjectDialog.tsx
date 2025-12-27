/**
 * UI-007: Dashboard - CreateProjectDialog Component
 *
 * Modal dialog for creating a new project with:
 * - Project name input (required)
 * - Description input (optional)
 * - Create and cancel actions
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { CreateProjectDialogProps } from "./types";

export function CreateProjectDialog({
	isOpen,
	onClose,
	onCreate,
	isCreating = false,
}: CreateProjectDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const nameInputRef = useRef<HTMLInputElement>(null);

	// Focus name input when dialog opens
	useEffect(() => {
		if (isOpen && nameInputRef.current) {
			nameInputRef.current.focus();
		}
	}, [isOpen]);

	// Reset form when dialog closes
	useEffect(() => {
		if (!isOpen) {
			setName("");
			setDescription("");
		}
	}, [isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const trimmedName = name.trim();
		if (!trimmedName) return;

		await onCreate(trimmedName, description.trim() || undefined);

		// Reset form after successful creation
		setName("");
		setDescription("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
			onClick={onClose}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-project-title"
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: Inner div prevents backdrop click */}
			<div
				className="bg-[var(--color-surface)] rounded-xl shadow-xl w-full max-w-md"
				onClick={(e) => e.stopPropagation()}
				role="presentation"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
					<h2
						id="create-project-title"
						className="text-lg font-semibold text-[var(--color-text-primary)]"
					>
						New Project
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] rounded-md transition-colors"
						aria-label="Close"
					>
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="p-5">
					<div className="mb-4">
						<label
							htmlFor="project-name"
							className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
						>
							Name <span className="text-[var(--color-error)]">*</span>
						</label>
						<input
							ref={nameInputRef}
							id="project-name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="My Conversation"
							className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-muted)]"
							maxLength={100}
							required
							disabled={isCreating}
						/>
						<p className="mt-1 text-xs text-[var(--color-text-secondary)]">
							{name.length}/100 characters
						</p>
					</div>

					<div className="mb-5">
						<label
							htmlFor="project-description"
							className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
						>
							Description
						</label>
						<textarea
							id="project-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What's this project about?"
							rows={3}
							className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] resize-none disabled:bg-[var(--color-surface-elevated)] disabled:text-[var(--color-text-muted)]"
							maxLength={1000}
							disabled={isCreating}
						/>
						<p className="mt-1 text-xs text-[var(--color-text-secondary)]">
							{description.length}/1000 characters
						</p>
					</div>

					{/* Actions */}
					<div className="flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] rounded-lg transition-colors font-medium"
							disabled={isCreating}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={!name.trim() || isCreating}
							className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{isCreating ? (
								<>
									<svg
										className="animate-spin w-4 h-4"
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
									Creating...
								</>
							) : (
								"Create Project"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
