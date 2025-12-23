import type { ReactNode } from "react";

export interface SidebarProps {
	children?: ReactNode;
}

/**
 * Sidebar component for conversation list and tree visualization
 *
 * Two-level structure:
 * - Level 1: Conversation list
 * - Level 2: Tree view of selected conversation (DAG structure)
 */
export function Sidebar({ children }: SidebarProps) {
	return (
		<aside className="flex w-80 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
			{/* Header */}
			<div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
				<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
					MindFlow
				</h1>
				<button
					type="button"
					className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
					aria-label="New conversation"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<title>New conversation</title>
						<path d="M12 5v14M5 12h14" />
					</svg>
				</button>
			</div>

			{/* Conversation List (Level 1) */}
			<div className="flex-1 overflow-y-auto">
				<div className="p-2">
					<p className="mb-2 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
						Conversations
					</p>
					{/* Placeholder for conversation list */}
					<div className="space-y-1">
						<div className="rounded-md bg-zinc-200 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
							No conversations yet
						</div>
					</div>
				</div>

				{/* Tree View (Level 2) - will be implemented in UI-002 */}
				{children}
			</div>
		</aside>
	);
}
