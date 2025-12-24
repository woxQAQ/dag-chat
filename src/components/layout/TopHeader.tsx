import type { ReactNode } from "react";

export interface TopHeaderProps {
	/**
	 * Project name or breadcrumb text
	 */
	projectName?: string;

	/**
	 * Back button click handler
	 */
	onBack?: () => void;

	/**
	 * Save status indicator
	 */
	saveStatus?: "saving" | "saved" | "unsaved";

	/**
	 * Left side content (custom)
	 */
	leftContent?: ReactNode;

	/**
	 * Right side content (custom actions)
	 */
	rightContent?: ReactNode;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * TopHeader - Minimal top navigation bar for MindFlow workspace.
 *
 * Features:
 * - Left: Back button and project name/breadcrumb
 * - Center: Save status indicator (implicit/subtle)
 * - Right: Share, Export, Settings actions
 * - Transparent background with subtle blur
 * - 48-60px height
 *
 * @example
 * ```tsx
 * <TopHeader
 *   projectName="My Project"
 *   onBack={() => router.push('/dashboard')}
 *   saveStatus="saved"
 * />
 * ```
 */
export function TopHeader({
	projectName = "Untitled Project",
	onBack,
	saveStatus = "saved",
	leftContent,
	rightContent,
	className = "",
}: TopHeaderProps) {
	const saveStatusColor = {
		saving: "text-blue-500",
		saved: "text-green-500",
		unsaved: "text-amber-500",
	}[saveStatus];

	return (
		<header
			className={`flex h-14 items-center justify-between px-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 ${className}`}
		>
			{/* Left Section */}
			<div className="flex items-center gap-3 flex-1 min-w-0">
				{onBack && (
					<button
						type="button"
						className="flex items-center justify-center w-8 h-8 p-0 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-lg"
						onClick={onBack}
						aria-label="Go back"
					>
						←
					</button>
				)}
				{leftContent || (
					<div className="flex items-center gap-2 text-sm text-slate-500">
						<span className="whitespace-nowrap overflow-hidden text-ellipsis">
							Dashboard
						</span>
						<span className="text-slate-300">/</span>
						<span className="whitespace-nowrap overflow-hidden text-ellipsis text-slate-800 font-medium">
							{projectName}
						</span>
					</div>
				)}
			</div>

			{/* Center Section - Save Status */}
			<div className="flex justify-center flex-0">
				<span
					className={`text-xs ${saveStatusColor} transition-opacity duration-200`}
				>
					{saveStatus === "saving" && "Saving..."}
					{saveStatus === "saved" && "Saved"}
					{saveStatus === "unsaved" && "Unsaved"}
				</span>
			</div>

			{/* Right Section - Actions */}
			<div className="flex items-center gap-2 flex-1 justify-end">
				{rightContent || (
					<>
						<button
							type="button"
							className="px-3 py-1.5 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-sm font-medium whitespace-nowrap"
							aria-label="Share project"
						>
							Share
						</button>
						<button
							type="button"
							className="px-3 py-1.5 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-sm font-medium whitespace-nowrap"
							aria-label="Export project"
						>
							Export
						</button>
						<button
							type="button"
							className="px-3 py-1.5 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-sm font-medium whitespace-nowrap"
							aria-label="Project settings"
						>
							Settings
						</button>
					</>
				)}
			</div>
		</header>
	);
}
