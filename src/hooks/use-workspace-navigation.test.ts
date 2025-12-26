/**
 * Tests for use-workspace-navigation hook
 * UI-WORKSPACE-005: Workspace Navigation
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getProject } from "@/app/projects/actions";
import { useWorkspaceNavigation } from "@/hooks/use-workspace-navigation";

// Mock the Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

// Mock the projects actions
vi.mock("@/app/projects/actions", () => ({
	getProject: vi.fn(),
}));

describe("useWorkspaceNavigation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("initial state", () => {
		it("should have correct initial state when projectId is provided", () => {
			vi.mocked(getProject).mockResolvedValue({
				success: true,
				data: {
					id: "project-123",
					name: "Test Project",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			const { result } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "project-123" }),
			);

			expect(result.current.projectName).toBe("Untitled Project");
			expect(result.current.isLoading).toBe(true);
			expect(result.current.error).toBe(null);
		});

		it("should set error when no projectId is provided", async () => {
			const { result } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "" }),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.projectName).toBe("Untitled Project");
			expect(result.current.error).toBe("No project ID provided");
		});
	});

	describe("project data fetching", () => {
		it("should fetch and set project name from API", async () => {
			const mockProject = {
				id: "project-123",
				name: "My Awesome Project",
				description: "A test project",
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(getProject).mockResolvedValue({
				success: true,
				data: mockProject,
			});

			const onProjectLoaded = vi.fn();

			const { result } = renderHook(() =>
				useWorkspaceNavigation({
					projectId: "project-123",
					onProjectLoaded,
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.projectName).toBe("My Awesome Project");
			expect(result.current.error).toBe(null);
			expect(getProject).toHaveBeenCalledWith("project-123", false);
			expect(onProjectLoaded).toHaveBeenCalledWith("My Awesome Project");
		});

		it("should use Untitled Project when API returns empty name", async () => {
			vi.mocked(getProject).mockResolvedValue({
				success: true,
				data: {
					id: "project-123",
					name: "",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			const { result } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "project-123" }),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.projectName).toBe("Untitled Project");
		});

		it("should handle API error gracefully", async () => {
			vi.mocked(getProject).mockResolvedValue({
				success: false,
				error: "Project not found",
			});

			const { result } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "invalid-id" }),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBe("Project not found");
			expect(result.current.projectName).toBe("Untitled Project");
		});

		it("should handle network errors", async () => {
			vi.mocked(getProject).mockRejectedValue(
				new Error("Network error"),
			);

			const { result } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "project-123" }),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBe("Network error");
		});

		it("should refetch when projectId changes", async () => {
			const project1 = {
				id: "project-1",
				name: "Project One",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const project2 = {
				id: "project-2",
				name: "Project Two",
				description: null,
				rootNodeId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			vi.mocked(getProject)
				.mockResolvedValueOnce({
					success: true,
					data: project1,
				})
				.mockResolvedValueOnce({
					success: true,
					data: project2,
				});

			const { result, rerender } = renderHook(
				({ projectId }) =>
					useWorkspaceNavigation({ projectId }),
				{
					initialProps: { projectId: "project-1" },
				},
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
			expect(result.current.projectName).toBe("Project One");

			// Change projectId
			rerender({ projectId: "project-2" });

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
			expect(result.current.projectName).toBe("Project Two");
		});
	});

	describe("back navigation", () => {
		it("should call onNavigateBack callback when handleBack is called", async () => {
			vi.mocked(getProject).mockResolvedValue({
				success: true,
				data: {
					id: "project-123",
					name: "Test Project",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			const onNavigateBack = vi.fn();

			const { result } = renderHook(() =>
				useWorkspaceNavigation({
					projectId: "project-123",
					onNavigateBack,
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			result.current.handleBack();

			expect(onNavigateBack).toHaveBeenCalledTimes(1);
		});

		it("should navigate to dashboard when handleBack is called", async () => {
			vi.mocked(getProject).mockResolvedValue({
				success: true,
				data: {
					id: "project-123",
					name: "Test Project",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			const { result } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "project-123" }),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			result.current.handleBack();

			expect(mockPush).toHaveBeenCalledWith("/");
		});
	});

	describe("cleanup", () => {
		it("should cancel fetch on unmount", async () => {
			let resolveFetch: (value: any) => void;

			vi.mocked(getProject).mockReturnValue(
				new Promise((resolve) => {
					resolveFetch = resolve;
				}),
			);

			const { result, unmount } = renderHook(() =>
				useWorkspaceNavigation({ projectId: "project-123" }),
			);

			expect(result.current.isLoading).toBe(true);

			// Unmount before fetch completes
			unmount();

			// Resolve the fetch
			resolveFetch!({
				success: true,
				data: {
					id: "project-123",
					name: "Test Project",
					description: null,
					rootNodeId: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			});

			// Should not update state after unmount
			// (this would throw an error if setState was called on unmounted component)
		});
	});
});
