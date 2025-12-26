/**
 * Tests for layout-actions.ts
 *
 * UI-WORKSPACE-004: Auto Layout Server Action
 *
 * Tests the Server Action for applying auto-layout with mocked dependencies.
 */

import { revalidatePath } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectGraphAction } from "@/app/nodes/actions";
import { batchUpdatePositions } from "@/lib/node-crud";
import { calculateTreeLayout } from "@/lib/tree-layout";
import { applyAutoLayoutAction } from "./layout-actions";

// Mock all dependencies
vi.mock("@/lib/node-crud", () => ({
	batchUpdatePositions: vi.fn(),
}));

vi.mock("@/lib/tree-layout", () => ({
	calculateTreeLayout: vi.fn(),
}));

vi.mock("@/app/nodes/actions", () => ({
	getProjectGraphAction: vi.fn(),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

describe("Auto Layout Server Action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	/**
	 * Test 1: Successful layout application
	 */
	it("should apply layout and update database", async () => {
		const mockProjectId = "project-123";
		const mockNodes = [
			{
				id: "node-1",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Root",
				positionX: 0,
				positionY: 0,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				id: "node-2",
				projectId: mockProjectId,
				parentId: "node-1",
				role: "ASSISTANT" as const,
				content: "Child",
				positionX: 100,
				positionY: 100,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		const mockLayoutResult = [
			{ nodeId: "node-1", positionX: 175, positionY: 0 },
			{ nodeId: "node-2", positionX: 175, positionY: 150 },
		];

		// Mock getProjectGraphAction to return nodes
		vi.mocked(getProjectGraphAction).mockResolvedValue({
			success: true,
			data: {
				nodes: mockNodes,
				edges: [],
				rootNodeId: "node-1",
			},
		});

		// Mock calculateTreeLayout to return new positions
		vi.mocked(calculateTreeLayout).mockReturnValue(mockLayoutResult);

		// Mock batchUpdatePositions to succeed
		vi.mocked(batchUpdatePositions).mockResolvedValue([]);

		const result = await applyAutoLayoutAction(mockProjectId);

		// Verify success
		expect(result.success).toBe(true);
		expect(result.data?.updatedCount).toBe(2);

		// Verify calculateTreeLayout was called with correct nodes
		expect(calculateTreeLayout).toHaveBeenCalledWith([
			{ id: "node-1", parentId: null },
			{ id: "node-2", parentId: "node-1" },
		]);

		// Verify batchUpdatePositions was called with layout results
		expect(batchUpdatePositions).toHaveBeenCalledWith([
			{ nodeId: "node-1", positionX: 175, positionY: 0 },
			{ nodeId: "node-2", positionX: 175, positionY: 150 },
		]);

		// Verify revalidatePath was called
		expect(revalidatePath).toHaveBeenCalledWith("/workspace");
	});

	/**
	 * Test 2: Empty project
	 */
	it("should handle empty project gracefully", async () => {
		const mockProjectId = "project-empty";

		// Mock getProjectGraphAction to return empty nodes
		vi.mocked(getProjectGraphAction).mockResolvedValue({
			success: true,
			data: {
				nodes: [],
				edges: [],
				rootNodeId: null,
			},
		});

		const result = await applyAutoLayoutAction(mockProjectId);

		// Verify success with zero updates
		expect(result.success).toBe(true);
		expect(result.data?.updatedCount).toBe(0);

		// Verify calculateTreeLayout was not called
		expect(calculateTreeLayout).not.toHaveBeenCalled();

		// Verify batchUpdatePositions was not called
		expect(batchUpdatePositions).not.toHaveBeenCalled();
	});

	/**
	 * Test 3: Graph fetch failure
	 */
	it("should return error when graph fetch fails", async () => {
		const mockProjectId = "project-123";

		// Mock getProjectGraphAction to return error
		vi.mocked(getProjectGraphAction).mockResolvedValue({
			success: false,
			error: "Project not found",
		});

		const result = await applyAutoLayoutAction(mockProjectId);

		// Verify error
		expect(result.success).toBe(false);
		expect(result.error).toBe("Project not found");

		// Verify calculateTreeLayout was not called
		expect(calculateTreeLayout).not.toHaveBeenCalled();

		// Verify batchUpdatePositions was not called
		expect(batchUpdatePositions).not.toHaveBeenCalled();
	});

	/**
	 * Test 4: Database error during batch update
	 */
	it("should return error on database failure", async () => {
		const mockProjectId = "project-123";
		const mockNodes = [
			{
				id: "node-1",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Root",
				positionX: 0,
				positionY: 0,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		// Mock getProjectGraphAction to return nodes
		vi.mocked(getProjectGraphAction).mockResolvedValue({
			success: true,
			data: {
				nodes: mockNodes,
				edges: [],
				rootNodeId: "node-1",
			},
		});

		// Mock calculateTreeLayout to return positions
		vi.mocked(calculateTreeLayout).mockReturnValue([
			{ nodeId: "node-1", positionX: 175, positionY: 0 },
		]);

		// Mock batchUpdatePositions to throw error
		vi.mocked(batchUpdatePositions).mockRejectedValue(
			new Error("Database connection failed"),
		);

		const result = await applyAutoLayoutAction(mockProjectId);

		// Verify error
		expect(result.success).toBe(false);
		expect(result.error).toBe("Database connection failed");

		// Verify revalidatePath was NOT called on error
		expect(revalidatePath).not.toHaveBeenCalled();
	});

	/**
	 * Test 5: Revalidation after successful update
	 */
	it("should revalidate workspace path after update", async () => {
		const mockProjectId = "project-123";
		const mockNodes = [
			{
				id: "node-1",
				projectId: mockProjectId,
				parentId: null,
				role: "USER" as const,
				content: "Root",
				positionX: 0,
				positionY: 0,
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		];

		// Mock all dependencies to succeed
		vi.mocked(getProjectGraphAction).mockResolvedValue({
			success: true,
			data: {
				nodes: mockNodes,
				edges: [],
				rootNodeId: "node-1",
			},
		});

		vi.mocked(calculateTreeLayout).mockReturnValue([
			{ nodeId: "node-1", positionX: 175, positionY: 0 },
		]);

		vi.mocked(batchUpdatePositions).mockResolvedValue([]);

		await applyAutoLayoutAction(mockProjectId);

		// Verify revalidatePath was called exactly once
		expect(revalidatePath).toHaveBeenCalledTimes(1);
		expect(revalidatePath).toHaveBeenCalledWith("/workspace");
	});
});
