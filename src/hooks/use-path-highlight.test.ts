/**
 * Tests for use-path-highlight.ts
 */

import { act, renderHook } from "@testing-library/react";
import type { Edge, Node } from "@xyflow/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	calculatePathHighlight,
	type PathHighlightResult,
} from "@/lib/path-calculator";

// Mock the path-calculator module
vi.mock("@/lib/path-calculator", () => ({
	calculatePathHighlight: vi.fn(),
	applyNodeHighlightStyles: vi.fn((nodes) => nodes),
	applyEdgeHighlightStyles: vi.fn((edges) => edges),
}));

import {
	usePathHighlight,
	usePathHighlightWithInspector,
} from "./use-path-highlight";

// Helper to create mock nodes
function createMockNodes(): Node[] {
	return [
		{
			id: "root",
			type: "user",
			position: { x: 0, y: 0 },
			data: { id: "root", role: "USER", content: "Root" },
		},
		{
			id: "child-1",
			type: "user",
			position: { x: 0, y: 100 },
			data: { id: "child-1", role: "USER", content: "Child 1" },
		},
		{
			id: "child-2",
			type: "user",
			position: { x: 0, y: 200 },
			data: { id: "child-2", role: "USER", content: "Child 2" },
		},
	];
}

// Helper to create mock edges
function createMockEdges(): Edge[] {
	return [
		{ id: "edge-1", source: "root", target: "child-1" },
		{ id: "edge-2", source: "child-1", target: "child-2" },
	];
}

// Helper to create mock highlight result
function createMockHighlightResult(
	selectedNodeId: string | null,
): PathHighlightResult {
	if (!selectedNodeId) {
		return {
			highlightedNodeIds: new Set(),
			highlightedEdgeIds: new Set(),
			dimmedNodeIds: new Set(),
			dimmedEdgeIds: new Set(),
			pathNodeIds: [],
		};
	}

	return {
		highlightedNodeIds: new Set(["root", "child-1", "child-2"]),
		highlightedEdgeIds: new Set(["edge-1", "edge-2"]),
		dimmedNodeIds: new Set(),
		dimmedEdgeIds: new Set(),
		pathNodeIds: ["root", "child-1", "child-2"],
	};
}

describe("usePathHighlight", () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
		vi.mocked(calculatePathHighlight).mockReturnValue(
			createMockHighlightResult(null),
		);
	});

	it("should initialize with no selection", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();

		const { result } = renderHook(() => usePathHighlight({ nodes, edges }));

		expect(result.current.selectedNodeId).toBeNull();
		expect(result.current.isHighlighting).toBe(false);
	});

	it("should return original nodes and edges when no selection", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult(null);
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const { result } = renderHook(() => usePathHighlight({ nodes, edges }));

		expect(result.current.highlightedNodes).toEqual(nodes);
		expect(result.current.highlightedEdges).toEqual(edges);
	});

	it("should set selected node ID", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-2");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const { result } = renderHook(() => usePathHighlight({ nodes, edges }));

		act(() => {
			result.current.setSelectedNodeId("child-2");
		});

		expect(result.current.selectedNodeId).toBe("child-2");
		expect(result.current.isHighlighting).toBe(true);
	});

	it("should clear selection", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-2");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const { result } = renderHook(() => usePathHighlight({ nodes, edges }));

		act(() => {
			result.current.setSelectedNodeId("child-2");
		});

		expect(result.current.selectedNodeId).toBe("child-2");

		act(() => {
			result.current.clearSelection();
		});

		expect(result.current.selectedNodeId).toBeNull();
		expect(result.current.isHighlighting).toBe(false);
	});

	it("should call onSelectionChange callback when selection changes", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-2");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const onSelectionChange = vi.fn();

		const { result } = renderHook(() =>
			usePathHighlight({ nodes, edges, onSelectionChange }),
		);

		act(() => {
			result.current.setSelectedNodeId("child-2");
		});

		expect(onSelectionChange).toHaveBeenCalledWith("child-2");

		act(() => {
			result.current.clearSelection();
		});

		expect(onSelectionChange).toHaveBeenCalledWith(null);
		expect(onSelectionChange).toHaveBeenCalledTimes(2);
	});

	it("should use custom highlight color", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-2");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const { rerender } = renderHook(
			({ highlightColor }) =>
				usePathHighlight({ nodes, edges, highlightColor }),
			{ initialProps: { highlightColor: "#ff0000" } },
		);

		// Verify hook accepts custom color (actual color application is in applyEdgeHighlightStyles)
		expect(() => rerender({ highlightColor: "#00ff00" })).not.toThrow();
	});

	it("should cache highlight result and only recalculate when selection changes", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-2");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const { result, rerender } = renderHook(
			({ nodes, edges }) => usePathHighlight({ nodes, edges }),
			{ initialProps: { nodes, edges } },
		);

		act(() => {
			result.current.setSelectedNodeId("child-2");
		});

		// Verify calculatePathHighlight was called once
		expect(calculatePathHighlight).toHaveBeenCalledTimes(1);
		expect(calculatePathHighlight).toHaveBeenCalledWith(
			"child-2",
			nodes,
			edges,
		);

		// Update nodes while selection stays the same
		const newNodes = [
			...nodes,
			{
				id: "new-node",
				type: "user",
				position: { x: 0, y: 300 },
				data: { id: "new-node", role: "USER", content: "New" },
			},
		];

		rerender({ nodes: newNodes, edges });

		// With caching: calculatePathHighlight should NOT be called again
		// because selectedNodeId hasn't changed
		expect(calculatePathHighlight).toHaveBeenCalledTimes(1);

		// Now change the selection
		act(() => {
			result.current.setSelectedNodeId("child-1");
		});

		// Should recalculate when selection changes
		expect(calculatePathHighlight).toHaveBeenCalledTimes(2);
	});

	it("should return highlight result", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-2");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const { result } = renderHook(() => usePathHighlight({ nodes, edges }));

		act(() => {
			result.current.setSelectedNodeId("child-2");
		});

		expect(result.current.highlightResult).toEqual(mockResult);
		expect(result.current.highlightResult.pathNodeIds).toEqual([
			"root",
			"child-1",
			"child-2",
		]);
	});
});

describe("usePathHighlightWithInspector", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(calculatePathHighlight).mockReturnValue(
			createMockHighlightResult(null),
		);
	});

	it("should call onNodeSelected when node is selected", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const onNodeSelected = vi.fn();
		const onSelectionCleared = vi.fn();

		const { result } = renderHook(() =>
			usePathHighlightWithInspector({
				nodes,
				edges,
				onNodeSelected,
				onSelectionCleared,
			}),
		);

		act(() => {
			result.current.handleNodeSelect("child-1");
		});

		expect(result.current.selectedNodeId).toBe("child-1");
		expect(onNodeSelected).toHaveBeenCalledWith("child-1");
	});

	it("should call onSelectionCleared when selection is cleared", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();
		const mockResult = createMockHighlightResult("child-1");
		vi.mocked(calculatePathHighlight).mockReturnValue(mockResult);

		const onNodeSelected = vi.fn();
		const onSelectionCleared = vi.fn();

		const { result } = renderHook(() =>
			usePathHighlightWithInspector({
				nodes,
				edges,
				onNodeSelected,
				onSelectionCleared,
			}),
		);

		act(() => {
			result.current.handleNodeSelect("child-1");
		});

		act(() => {
			result.current.handleSelectionClear();
		});

		expect(result.current.selectedNodeId).toBeNull();
		expect(onSelectionCleared).toHaveBeenCalled();
	});

	it("should include all base hook properties", () => {
		const nodes = createMockNodes();
		const edges = createMockEdges();

		const { result } = renderHook(() =>
			usePathHighlightWithInspector({ nodes, edges }),
		);

		// Verify all base hook properties are present
		expect(result.current).toHaveProperty("highlightedNodes");
		expect(result.current).toHaveProperty("highlightedEdges");
		expect(result.current).toHaveProperty("selectedNodeId");
		expect(result.current).toHaveProperty("setSelectedNodeId");
		expect(result.current).toHaveProperty("clearSelection");
		expect(result.current).toHaveProperty("highlightResult");
		expect(result.current).toHaveProperty("isHighlighting");

		// Verify inspector-specific properties
		expect(result.current).toHaveProperty("handleNodeSelect");
		expect(result.current).toHaveProperty("handleSelectionClear");
	});
});
