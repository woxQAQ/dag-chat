/**
 * UI-WORKSPACE-005: Workspace Navigation Hook
 *
 * This hook manages workspace navigation by:
 * - Fetching project data dynamically from API
 * - Providing back navigation to Dashboard
 * - Exposing project name for breadcrumb display
 *
 * @example
 * ```tsx
 * const { projectName, isLoading, error, handleBack } = useWorkspaceNavigation({
 *   projectId: "project-uuid",
 * });
 * ```
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProject } from "@/app/projects/actions";

export interface UseWorkspaceNavigationOptions {
	/**
	 * The project ID to fetch data for
	 */
	projectId: string;

	/**
	 * Optional callback when project data is loaded
	 */
	onProjectLoaded?: (projectName: string) => void;

	/**
	 * Optional callback when navigation occurs
	 */
	onNavigateBack?: () => void;
}

export interface UseWorkspaceNavigationResult {
	/**
	 * The project name fetched from API
	 */
	projectName: string;

	/**
	 * Whether project data is currently loading
	 */
	isLoading: boolean;

	/**
	 * Any error that occurred during fetch
	 */
	error: string | null;

	/**
	 * Navigate back to dashboard
	 */
	handleBack: () => void;
}

/**
 * Custom hook for workspace navigation
 *
 * Features:
 * - Fetches project data by ID
 * - Provides project name for breadcrumb display
 * - Handles back navigation to dashboard
 * - Loading and error states
 *
 * @param options - Configuration options
 * @returns Navigation state and handlers
 */
export function useWorkspaceNavigation({
	projectId,
	onProjectLoaded,
	onNavigateBack,
}: UseWorkspaceNavigationOptions): UseWorkspaceNavigationResult {
	const router = useRouter();
	const [projectName, setProjectName] = useState<string>("Untitled Project");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Fetch project data when projectId changes
	useEffect(() => {
		if (!projectId) {
			setProjectName("Untitled Project");
			setIsLoading(false);
			setError("No project ID provided");
			return;
		}

		let cancelled = false;

		async function fetchProject() {
			setIsLoading(true);
			setError(null);

			try {
				const result = await getProject(projectId, false); // Don't need stats for navigation

				if (cancelled) return;

				if (result.success && result.data) {
					const name = result.data.name || "Untitled Project";
					setProjectName(name);
					onProjectLoaded?.(name);
				} else {
					setError(result.error || "Failed to load project");
				}
			} catch (err) {
				if (cancelled) return;

				setError(
					err instanceof Error ? err.message : "Failed to load project",
				);
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		fetchProject();

		return () => {
			cancelled = true;
		};
	}, [projectId, onProjectLoaded]);

	// Back navigation handler
	const handleBack = () => {
		onNavigateBack?.();
		router.push("/");
	};

	return {
		projectName,
		isLoading,
		error,
		handleBack,
	};
}
