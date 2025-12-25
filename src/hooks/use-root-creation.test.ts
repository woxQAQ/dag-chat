/**
 * UI-NEW-001: Root Node Creation Hook Tests
 *
 * Tests for the useRootNodeCreation hook.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRootNodeCreation } from "./use-root-creation";

// Mock the Server Actions
vi.mock("@/app/nodes/root-actions", () => ({
	createRootNode: vi.fn(),
}));

import { createRootNode } from "@/app/nodes/root-actions";

// Mock global fetch for AI API calls
global.fetch = vi.fn();

describe("useRootNodeCreation", () => {
	const mockProjectId = "project-123";
	const mockPositionX = 150;
	const mockPositionY = 200;
	const mockContent = "What is the meaning of life?";

	const mockOnUserNodeCreated = vi.fn();
	const mockOnAssistantNodeCreated = vi.fn();
	const mockOnError = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		// Mock fetch to return a successful response with node ID
		vi.mocked(global.fetch).mockResolvedValue({
			ok: true,
			headers: {
				get: (name: string) => (name === "X-Node-Id" ? "assistant-node-123" : null),
			},
			json: async () => ({}),
		} as Response);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return initial state correctly", () => {
		// Mock successful response
		vi.mocked(createRootNode).mockResolvedValue({
			success: true,
			data: {
				nodeId: "new-root-node-789",
				positionX: mockPositionX,
				positionY: mockPositionY,
			},
		});

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
				onUserNodeCreated: mockOnUserNodeCreated,
				onAssistantNodeCreated: mockOnAssistantNodeCreated,
				onError: mockOnError,
			}),
		);

		expect(result.current.isCreating).toBe(false);
		expect(result.current.error).toBe(null);
		expect(typeof result.current.createRootNode).toBe("function");
	});

	it("should create root node successfully and call AI API", async () => {
		const mockNodeId = "new-root-node-789";
		const mockAssistantNodeId = "assistant-node-123";

		vi.mocked(createRootNode).mockResolvedValue({
			success: true,
			data: {
				nodeId: mockNodeId,
				positionX: mockPositionX,
				positionY: mockPositionY,
			},
		});

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
				onUserNodeCreated: mockOnUserNodeCreated,
				onAssistantNodeCreated: mockOnAssistantNodeCreated,
				onError: mockOnError,
			}),
		);

		// Initial state
		expect(result.current.isCreating).toBe(false);

		// Create root node
		await act(async () => {
			await result.current.createRootNode(
				mockContent,
				mockPositionX,
				mockPositionY,
			);
		});

		// Verify Server Action was called with correct parameters
		expect(createRootNode).toHaveBeenCalledWith({
			projectId: mockProjectId,
			content: mockContent,
			positionX: mockPositionX,
			positionY: mockPositionY,
		});

		// Verify user node callback was called
		expect(mockOnUserNodeCreated).toHaveBeenCalledWith(
			mockNodeId,
			mockPositionX,
			mockPositionY,
		);

		// Verify AI API was called
		expect(global.fetch).toHaveBeenCalledWith("/api/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				projectId: mockProjectId,
				parentNodeId: mockNodeId,
				message: mockContent,
				positionX: mockPositionX,
				positionY: mockPositionY + 150,
			}),
		});

		// Verify assistant node callback was called
		expect(mockOnAssistantNodeCreated).toHaveBeenCalledWith(
			mockAssistantNodeId,
			mockPositionX,
			mockPositionY + 150,
			mockNodeId,
		);

		// Verify state is reset after success
		await waitFor(() => {
			expect(result.current.isCreating).toBe(false);
		});
		expect(result.current.error).toBe(null);
	});

	it("should handle server action failure", async () => {
		const mockError = "Project already has a root node";
		vi.mocked(createRootNode).mockResolvedValue({
			success: false,
			error: mockError,
		});

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
				onUserNodeCreated: mockOnUserNodeCreated,
				onAssistantNodeCreated: mockOnAssistantNodeCreated,
				onError: mockOnError,
			}),
		);

		await act(async () => {
			await result.current.createRootNode(
				mockContent,
				mockPositionX,
				mockPositionY,
			);
		});

		// Verify error callback was called
		expect(mockOnError).toHaveBeenCalledWith(mockError);

		// Verify error state is set
		expect(result.current.error).toBe(mockError);

		// Verify onUserNodeCreated was not called
		expect(mockOnUserNodeCreated).not.toHaveBeenCalled();
	});

	it("should handle unexpected errors", async () => {
		const mockError = new Error("Network error");
		vi.mocked(createRootNode).mockRejectedValue(mockError);

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
				onUserNodeCreated: mockOnUserNodeCreated,
				onAssistantNodeCreated: mockOnAssistantNodeCreated,
				onError: mockOnError,
			}),
		);

		await act(async () => {
			await result.current.createRootNode(
				mockContent,
				mockPositionX,
				mockPositionY,
			);
		});

		// Verify error callback was called
		expect(mockOnError).toHaveBeenCalledWith("Network error");

		// Verify error state is set
		expect(result.current.error).toBe("Network error");
	});

	it("should set isCreating to true during creation", async () => {
		let resolveCreation: (value: any) => void;

		vi.mocked(createRootNode).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveCreation = resolve;
				}),
		);

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
				onUserNodeCreated: mockOnUserNodeCreated,
				onAssistantNodeCreated: mockOnAssistantNodeCreated,
			}),
		);

		// Start creation (don't await - we want to check intermediate state)
		act(() => {
			result.current.createRootNode(mockContent, mockPositionX, mockPositionY);
		});

		// Check loading state during creation
		expect(result.current.isCreating).toBe(true);

		// Resolve the promise
		await act(async () => {
			resolveCreation!({
				success: true,
				data: {
					nodeId: "new-root-node",
					positionX: mockPositionX,
					positionY: mockPositionY,
				},
			});
		});

		// Check loading state is reset (may still be true briefly due to AI API call)
		// Note: The AI API call happens after node creation, so isCreating might briefly be true
		// until the AI API call completes
		await waitFor(() => {
			expect(result.current.isCreating).toBe(false);
		});
	});

	it("should clear previous error on new creation attempt", async () => {
		// First call fails
		vi.mocked(createRootNode).mockResolvedValueOnce({
			success: false,
			error: "First error",
		});

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
				onUserNodeCreated: mockOnUserNodeCreated,
				onAssistantNodeCreated: mockOnAssistantNodeCreated,
				onError: mockOnError,
			}),
		);

		// First attempt fails
		await act(async () => {
			await result.current.createRootNode(
				mockContent,
				mockPositionX,
				mockPositionY,
			);
		});

		expect(result.current.error).toBe("First error");

		// Second call succeeds
		vi.mocked(createRootNode).mockResolvedValueOnce({
			success: true,
			data: {
				nodeId: "new-node",
				positionX: mockPositionX,
				positionY: mockPositionY,
			},
		});

		await act(async () => {
			await result.current.createRootNode(
				mockContent,
				mockPositionX,
				mockPositionY,
			);
		});

		// Error should be cleared
		expect(result.current.error).toBe(null);
	});

	it("should work without callbacks provided", async () => {
		vi.mocked(createRootNode).mockResolvedValue({
			success: true,
			data: {
				nodeId: "new-root-node-789",
				positionX: mockPositionX,
				positionY: mockPositionY,
			},
		});

		const { result } = renderHook(() =>
			useRootNodeCreation({
				projectId: mockProjectId,
			}),
		);

		// Should not throw even without callbacks
		await act(async () => {
			await result.current.createRootNode(
				mockContent,
				mockPositionX,
				mockPositionY,
			);
		});

		expect(result.current.isCreating).toBe(false);
		expect(result.current.error).toBe(null);
	});
});
