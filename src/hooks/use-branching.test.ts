/**
 * UI-NEW-002: Branching Interaction Hook Tests
 *
 * Tests for the useBranching hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useBranching } from "./use-branching";

// Mock the Server Actions
vi.mock("@/app/nodes/actions", () => ({
	createChildNodeAutoPosition: vi.fn(),
}));

import { createChildNodeAutoPosition } from "@/app/nodes/actions";

describe("useBranching", () => {
	const mockProjectId = "project-123";
	const mockParentNodeId = "parent-node-456";

	const mockOnNodeCreated = vi.fn();
	const mockOnError = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should return initial state correctly", () => {
		// Mock successful response
		vi.mocked(createChildNodeAutoPosition).mockResolvedValue({
			success: true,
			data: {
				nodeId: "new-node-789",
				positionX: 120,
				positionY: 300,
			},
		});

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
				onError: mockOnError,
			}),
		);

		expect(result.current.isCreating).toBe(false);
		expect(result.current.error).toBe(null);
		expect(typeof result.current.createChildNode).toBe("function");
	});

	it("should create child node successfully", async () => {
		const mockNodeId = "new-node-789";
		const mockPositionX = 120;
		const mockPositionY = 300;

		vi.mocked(createChildNodeAutoPosition).mockResolvedValue({
			success: true,
			data: {
				nodeId: mockNodeId,
				positionX: mockPositionX,
				positionY: mockPositionY,
			},
		});

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
				onError: mockOnError,
			}),
		);

		// Initial state
		expect(result.current.isCreating).toBe(false);

		// Create child node
		await act(async () => {
			await result.current.createChildNode(mockParentNodeId, "USER");
		});

		// Verify Server Action was called with correct parameters
		expect(createChildNodeAutoPosition).toHaveBeenCalledWith({
			projectId: mockProjectId,
			parentNodeId: mockParentNodeId,
			role: "USER",
			content: "",
		});

		// Verify callback was called with correct data
		expect(mockOnNodeCreated).toHaveBeenCalledWith(
			mockNodeId,
			mockPositionX,
			mockPositionY,
		);

		// Verify state is reset after success
		expect(result.current.isCreating).toBe(false);
		expect(result.current.error).toBe(null);
	});

	it("should default to USER role when role is not specified", async () => {
		vi.mocked(createChildNodeAutoPosition).mockResolvedValue({
			success: true,
			data: {
				nodeId: "new-node-789",
				positionX: 120,
				positionY: 300,
			},
		});

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
			}),
		);

		await act(async () => {
			await result.current.createChildNode(mockParentNodeId);
		});

		expect(createChildNodeAutoPosition).toHaveBeenCalledWith({
			projectId: mockProjectId,
			parentNodeId: mockParentNodeId,
			role: "USER", // Default role
			content: "",
		});
	});

	it("should handle server action failure", async () => {
		const mockError = "Failed to create child node";
		vi.mocked(createChildNodeAutoPosition).mockResolvedValue({
			success: false,
			error: mockError,
		});

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
				onError: mockOnError,
			}),
		);

		await act(async () => {
			await result.current.createChildNode(mockParentNodeId);
		});

		// Verify error callback was called
		expect(mockOnError).toHaveBeenCalledWith(mockError);

		// Verify error state is set
		expect(result.current.error).toBe(mockError);

		// Verify onNodeCreated was not called
		expect(mockOnNodeCreated).not.toHaveBeenCalled();
	});

	it("should handle unexpected errors", async () => {
		const mockError = new Error("Network error");
		vi.mocked(createChildNodeAutoPosition).mockRejectedValue(mockError);

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
				onError: mockOnError,
			}),
		);

		await act(async () => {
			await result.current.createChildNode(mockParentNodeId);
		});

		// Verify error callback was called
		expect(mockOnError).toHaveBeenCalledWith("Network error");

		// Verify error state is set
		expect(result.current.error).toBe("Network error");
	});

	it("should set isCreating to true during creation", async () => {
		let resolveCreation: (value: any) => void;

		vi.mocked(createChildNodeAutoPosition).mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveCreation = resolve;
				}),
		);

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
			}),
		);

		// Start creation (don't await - we want to check intermediate state)
		act(() => {
			result.current.createChildNode(mockParentNodeId);
		});

		// Check loading state during creation
		expect(result.current.isCreating).toBe(true);

		// Resolve the promise
		await act(async () => {
			resolveCreation!({
				success: true,
				data: { nodeId: "new-node", positionX: 100, positionY: 200 },
			});
		});

		// Check loading state is reset
		expect(result.current.isCreating).toBe(false);
	});

	it("should support ASSISTANT role for child nodes", async () => {
		vi.mocked(createChildNodeAutoPosition).mockResolvedValue({
			success: true,
			data: {
				nodeId: "new-node-789",
				positionX: 120,
				positionY: 300,
			},
		});

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
				onNodeCreated: mockOnNodeCreated,
			}),
		);

		await act(async () => {
			await result.current.createChildNode(mockParentNodeId, "ASSISTANT");
		});

		expect(createChildNodeAutoPosition).toHaveBeenCalledWith({
			projectId: mockProjectId,
			parentNodeId: mockParentNodeId,
			role: "ASSISTANT",
			content: "",
		});
	});

	it("should work without callbacks provided", async () => {
		vi.mocked(createChildNodeAutoPosition).mockResolvedValue({
			success: true,
			data: {
				nodeId: "new-node-789",
				positionX: 120,
				positionY: 300,
			},
		});

		const { result } = renderHook(() =>
			useBranching({
				projectId: mockProjectId,
			}),
		);

		// Should not throw even without callbacks
		await act(async () => {
			await result.current.createChildNode(mockParentNodeId);
		});

		expect(result.current.isCreating).toBe(false);
		expect(result.current.error).toBe(null);
	});
});
