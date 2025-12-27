/**
 * TopHeader - Minimal floating back button for MindFlow workspace.
 *
 * Simplified to only contain the "Back" functionality.
 * Uses absolute positioning with transparent background to maximize canvas area.
 *
 * Features:
 * - Floating back button in top-left corner
 * - Transparent background with glassmorphism on hover
 * - Does not occupy vertical space (absolute positioning)
 */

export interface TopHeaderProps {
	/**
	 * Back button click handler
	 */
	onBack?: () => void;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * TopHeader component
 *
 * @example
 * ```tsx
 * <TopHeader onBack={() => router.push('/dashboard')} />
 * ```
 */
export function TopHeader({ onBack, className = "" }: TopHeaderProps) {
	if (!onBack) {
		return null;
	}

	return (
		<nav
			className={`fixed top-4 left-4 z-40 ${className}`}
			aria-label="Back navigation"
		>
			<button
				type="button"
				className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-border)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] hover:shadow-lg transition-all duration-200 shadow-sm"
				onClick={onBack}
				aria-label="Go back to dashboard"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
			</button>
		</nav>
	);
}
