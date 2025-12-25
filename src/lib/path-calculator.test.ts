/**
 * Tests for path-calculator.ts
 */

import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import {
	applyEdgeHighlightStyles,
	applyNodeHighlightStyles,
	calculatePathHighlight,
	type PathHighlightResult,
} from "./path-calculator";

// Helper to create a mock node
function createMockNode(id: string): Node {
	return {
		id,
		type: "user",
		position: { x: 0, y: 0 },
		data: { id, role: "USER", content: `Node ${id}` },
	};
}

describe("Path Calculator", () => {
	describe("calculatePathHighlight", () => {
		it("should return empty result when no node is selected", () => {
			const nodes = [createMockNode("node-1"), createMockNode("node-2")];
			const edges = [
				{ id: "edge-1-2", source: "node-1", target: "node-2" },
			];

			const result = calculatePathHighlight(null, nodes, edges);

			expect(result.highlightedNodeIds.size).toBe(0);
			expect(result.highlightedEdgeIds.size).toBe(0);
			expect(result.dimmedNodeIds.size).toBe(0);
			expect(result.dimmedEdgeIds.size).toBe(0);
			expect(result.pathNodeIds).toEqual([]);
		});

		it("should return empty result when nodes array is empty", () => {
			const result = calculatePathHighlight("node-1", [], []);

			expect(result.highlightedNodeIds.size).toBe(0);
			expect(result.highlightedEdgeIds.size).toBe(0);
			expect(result.dimmedNodeIds.size).toBe(0);
			expect(result.dimmedEdgeIds.size).toBe(0);
			expect(result.pathNodeIds).toEqual([]);
		});

		it("should highlight single node when only root exists", () => {
			const nodes = [createMockNode("root")];
			const edges: Array<{ id: string; source: string; target: string }> = [];

			const result = calculatePathHighlight("root", nodes, edges);

			expect(result.highlightedNodeIds.has("root")).toBe(true);
			expect(result.pathNodeIds).toEqual(["root"]);
			expect(result.dimmedNodeIds.size).toBe(0);
			expect(result.dimmedEdgeIds.size).toBe(0);
		});

		it("should calculate path from root to leaf in linear chain", () => {
			const nodes = [
				createMockNode("root"),
				createMockNode("child-1"),
				createMockNode("child-2"),
				createMockNode("child-3"),
			];
			const edges = [
				{ id: "edge-1", source: "root", target: "child-1" },
				{ id: "edge-2", source: "child-1", target: "child-2" },
				{ id: "edge-3", source: "child-2", target: "child-3" },
			];

			const result = calculatePathHighlight("child-3", nodes, edges);

			expect(result.pathNodeIds).toEqual([
				"root",
				"child-1",
				"child-2",
				"child-3",
			]);
			expect(result.highlightedNodeIds.has("root")).toBe(true);
			expect(result.highlightedNodeIds.has("child-1")).toBe(true);
			expect(result.highlightedNodeIds.has("child-2")).toBe(true);
			expect(result.highlightedNodeIds.has("child-3")).toBe(true);
			expect(result.highlightedEdgeIds.has("edge-1")).toBe(true);
			expect(result.highlightedEdgeIds.has("edge-2")).toBe(true);
			expect(result.highlightedEdgeIds.has("edge-3")).toBe(true);
		});

		it("should dim nodes not on the active path in branching tree", () => {
			const nodes = [
				createMockNode("root"),
				createMockNode("branch-a"),
				createMockNode("branch-b"),
				createMockNode("leaf-a-1"),
				createMockNode("leaf-b-1"),
			];
			const edges = [
				{ id: "edge-root-a", source: "root", target: "branch-a" },
				{ id: "edge-root-b", source: "root", target: "branch-b" },
				{ id: "edge-a-1", source: "branch-a", target: "leaf-a-1" },
				{ id: "edge-b-1", source: "branch-b", target: "leaf-b-1" },
			];

			// Select leaf-a-1
			const result = calculatePathHighlight("leaf-a-1", nodes, edges);

			// Path should be: root -> branch-a -> leaf-a-1
			expect(result.pathNodeIds).toEqual([
				"root",
				"branch-a",
				"leaf-a-1",
			]);

			// Highlighted nodes
			expect(result.highlightedNodeIds.has("root")).toBe(true);
			expect(result.highlightedNodeIds.has("branch-a")).toBe(true);
			expect(result.highlightedNodeIds.has("leaf-a-1")).toBe(true);

			// Dimmed nodes (branch-b and leaf-b-1)
			expect(result.dimmedNodeIds.has("branch-b")).toBe(true);
			expect(result.dimmedNodeIds.has("leaf-b-1")).toBe(true);
			expect(result.dimmedNodeIds.size).toBe(2);

			// Highlighted edges
			expect(result.highlightedEdgeIds.has("edge-root-a")).toBe(true);
			expect(result.highlightedEdgeIds.has("edge-a-1")).toBe(true);

			// Dimmed edges
			expect(result.dimmedEdgeIds.has("edge-root-b")).toBe(true);
			expect(result.dimmedEdgeIds.has("edge-b-1")).toBe(true);
		});

		it("should handle complex tree with multiple levels", () => {
			const nodes = [
				createMockNode("root"),
				createMockNode("level-1-a"),
				createMockNode("level-1-b"),
				createMockNode("level-2-a"),
				createMockNode("level-2-b"),
				createMockNode("level-3-a"),
				createMockNode("level-3-b"),
			];
			const edges = [
				{ id: "e-r-1a", source: "root", target: "level-1-a" },
				{ id: "e-r-1b", source: "root", target: "level-1-b" },
				{ id: "e-1a-2a", source: "level-1-a", target: "level-2-a" },
				{ id: "e-1b-2b", source: "level-1-b", target: "level-2-b" },
				{ id: "e-2a-3a", source: "level-2-a", target: "level-3-a" },
				{ id: "e-2b-3b", source: "level-2-b", target: "level-3-b" },
			];

			// Select level-3-b
			const result = calculatePathHighlight("level-3-b", nodes, edges);

			// Path: root -> level-1-b -> level-2-b -> level-3-b
			expect(result.pathNodeIds).toEqual([
				"root",
				"level-1-b",
				"level-2-b",
				"level-3-b",
			]);

			// All nodes on path should be highlighted
			expect(result.highlightedNodeIds.size).toBe(4);

			// Other nodes should be dimmed
			expect(result.dimmedNodeIds.has("level-1-a")).toBe(true);
			expect(result.dimmedNodeIds.has("level-2-a")).toBe(true);
			expect(result.dimmedNodeIds.has("level-3-a")).toBe(true);
			expect(result.dimmedNodeIds.size).toBe(3);
		});

		it("should identify root node with isRoot metadata", () => {
			const nodes = [
				{
					...createMockNode("node-1"),
					data: { ...createMockNode("node-1").data, metadata: { isRoot: true } },
				},
				createMockNode("node-2"),
				createMockNode("node-3"),
			];
			const edges = [
				{ id: "edge-1-2", source: "node-1", target: "node-2" },
				{ id: "edge-2-3", source: "node-2", target: "node-3" },
			];

			const result = calculatePathHighlight("node-3", nodes, edges);

			expect(result.pathNodeIds).toEqual(["node-1", "node-2", "node-3"]);
		});

		it("should handle node with no matching edges gracefully", () => {
			const nodes = [createMockNode("orphan-node")];
			const edges: Array<{ id: string; source: string; target: string }> = [];

			const result = calculatePathHighlight("orphan-node", nodes, edges);

			// Orphan node is treated as its own root
			expect(result.pathNodeIds).toEqual(["orphan-node"]);
			expect(result.highlightedNodeIds.has("orphan-node")).toBe(true);
			expect(result.dimmedNodeIds.size).toBe(0);
		});
	});

	describe("applyNodeHighlightStyles", () => {
		it("should apply highlight styles to nodes on path", () => {
			const nodes = [createMockNode("node-1"), createMockNode("node-2")];
			const highlightResult: PathHighlightResult = {
				highlightedNodeIds: new Set(["node-1"]),
				highlightedEdgeIds: new Set(),
				dimmedNodeIds: new Set(["node-2"]),
				dimmedEdgeIds: new Set(),
				pathNodeIds: ["node-1"],
			};

			const result = applyNodeHighlightStyles(nodes, highlightResult);

			expect(result[0].style?.opacity).toBe(1);
			expect(result[1].style?.opacity).toBe(0.3);
			expect(result[0].className).toContain("node-highlighted");
			expect(result[1].className).toContain("node-dimmed");
		});

		it("should preserve existing node properties", () => {
			const nodes = [
				{
					...createMockNode("node-1"),
					style: { background: "red" },
					className: "custom-class",
				},
			];
			const highlightResult: PathHighlightResult = {
				highlightedNodeIds: new Set(["node-1"]),
				highlightedEdgeIds: new Set(),
				dimmedNodeIds: new Set(),
				dimmedEdgeIds: new Set(),
				pathNodeIds: ["node-1"],
			};

			const result = applyNodeHighlightStyles(nodes, highlightResult);

			expect(result[0].style?.background).toBe("red");
			expect(result[0].className).toContain("custom-class");
			expect(result[0].className).toContain("node-highlighted");
		});
	});

	describe("applyEdgeHighlightStyles", () => {
		it("should apply highlight styles to edges on path", () => {
			const edges = [
				{ id: "edge-1", source: "node-1", target: "node-2" },
				{ id: "edge-2", source: "node-2", target: "node-3" },
			];
			const highlightResult: PathHighlightResult = {
				highlightedNodeIds: new Set(),
				highlightedEdgeIds: new Set(["edge-1"]),
				dimmedNodeIds: new Set(),
				dimmedEdgeIds: new Set(["edge-2"]),
				pathNodeIds: [],
			};

			const result = applyEdgeHighlightStyles(edges, highlightResult);

			expect(result[0].style?.stroke).toBe("#2563eb");
			expect(result[0].style?.strokeWidth).toBe(3);
			expect(result[0].animated).toBe(true);

			expect(result[1].style?.stroke).toBe("#cbd5e1");
			expect(result[1].style?.strokeWidth).toBe(1);
			expect(result[1].style?.opacity).toBe(0.3);
		});

		it("should support custom highlight color", () => {
			const edges = [
				{ id: "edge-1", source: "node-1", target: "node-2" },
			];
			const highlightResult: PathHighlightResult = {
				highlightedNodeIds: new Set(),
				highlightedEdgeIds: new Set(["edge-1"]),
				dimmedNodeIds: new Set(),
				dimmedEdgeIds: new Set(),
				pathNodeIds: [],
			};

			const result = applyEdgeHighlightStyles(
				edges,
				highlightResult,
				"#ff0000",
			);

			expect(result[0].style?.stroke).toBe("#ff0000");
		});

		it("should preserve existing edge properties", () => {
			const edges = [
				{
					id: "edge-1",
					source: "node-1",
					target: "node-2",
					style: { strokeDasharray: "5,5" },
					className: "custom-edge",
				},
			];
			const highlightResult: PathHighlightResult = {
				highlightedNodeIds: new Set(),
				highlightedEdgeIds: new Set(["edge-1"]),
				dimmedNodeIds: new Set(),
				dimmedEdgeIds: new Set(),
				pathNodeIds: [],
			};

			const result = applyEdgeHighlightStyles(edges, highlightResult);

			expect(result[0].style?.strokeDasharray).toBe("5,5");
			expect(result[0].className).toContain("custom-edge");
			expect(result[0].className).toContain("edge-highlighted");
		});
	});
});
