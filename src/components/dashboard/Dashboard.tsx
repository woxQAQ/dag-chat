/**
 * UI-007: Dashboard - Main Dashboard Component
 *
 * Displays a grid of project cards with:
 * - Header with title and create button
 * - Responsive grid layout for project cards
 * - Empty state when no projects
 * - Load more functionality for pagination
 * - Error handling and loading states
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	createProject,
	deleteProject,
	updateProject,
} from "@/app/projects/actions";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { ProjectCard } from "./ProjectCard";
import type { DashboardProps } from "./types";

export function Dashboard({
	projects = [],
	total = 0,
	hasMore = false,
	loading = false,
	error,
	onLoadMore,
}: DashboardProps) {
	const router = useRouter();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [_deletingProjectId, setDeletingProjectId] = useState<string | null>(
		null,
	);

	const handleCreateProject = async (name: string, description?: string) => {
		setIsCreating(true);
		try {
			const result = await createProject({ name, description });
			if (result.success && result.data) {
				// Redirect to the new project workspace
				router.push(`/workspace?project=${result.data.id}`);
				setIsCreateDialogOpen(false);
			} else {
				alert(result.error || "Failed to create project");
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to create project");
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteProject = async (projectId: string) => {
		setDeletingProjectId(projectId);
		try {
			const result = await deleteProject(projectId);
			if (result.success) {
				router.refresh();
			} else {
				alert(result.error || "Failed to delete project");
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete project");
		} finally {
			setDeletingProjectId(null);
		}
	};

	const handleRenameProject = async (projectId: string, newName: string) => {
		try {
			const result = await updateProject(projectId, { name: newName });
			if (result.success) {
				router.refresh();
			} else {
				alert(result.error || "Failed to rename project");
			}
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to rename project");
		}
	};

	const handleOpenProject = (projectId: string) => {
		router.push(`/workspace?project=${projectId}`);
	};

	return (
		<div className="min-h-screen bg-[var(--color-canvas)]">
			{/* Header */}
			<header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div>
							<h1 className="text-2xl font-bold text-[var(--color-text-primary)]">MindFlow</h1>
							{total > 0 && (
								<p className="text-sm text-[var(--color-text-secondary)]">
									{total} project{total !== 1 ? "s" : ""}
								</p>
							)}
						</div>

						<button
							type="button"
							onClick={() => setIsCreateDialogOpen(true)}
							className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
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
									d="M12 4v16m8-8H4"
								/>
							</svg>
							New Project
						</button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{error ? (
					<div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-lg p-6 text-center">
						<svg
							className="w-12 h-12 text-[var(--color-error)] mx-auto mb-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p className="text-[var(--color-error)] font-medium">Failed to load projects</p>
						<p className="text-[var(--color-error)] text-sm mt-1">{error}</p>
					</div>
				) : projects.length === 0 ? (
					/* Empty State */
					<div className="bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-xl p-12 text-center">
						<div className="max-w-md mx-auto">
							<div className="w-16 h-16 bg-[var(--color-surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-8 h-8 text-[var(--color-text-muted)]"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden="true"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
							</div>
							<h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
								No projects yet
							</h3>
							<p className="text-[var(--color-text-secondary)] mb-6">
								Create your first project to start exploring conversations with
								tree-structured context.
							</p>
							<button
								type="button"
								onClick={() => setIsCreateDialogOpen(true)}
								className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
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
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Create Project
							</button>
						</div>
					</div>
				) : (
					<>
						{/* Project Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
							{projects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									onOpen={handleOpenProject}
									onDelete={handleDeleteProject}
									onRename={handleRenameProject}
								/>
							))}
						</div>
						{/* Load More */}
						{hasMore && (
							<div className="mt-8 text-center">
								<button
									type="button"
									onClick={onLoadMore}
									disabled={loading}
									className="px-6 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-surface-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{loading ? "Loading..." : "Load More"}
								</button>
							</div>
						)}
					</>
				)}
			</main>

			{/* Create Project Dialog */}
			<CreateProjectDialog
				isOpen={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(false)}
				onCreate={handleCreateProject}
				isCreating={isCreating}
			/>
		</div>
	);
}
