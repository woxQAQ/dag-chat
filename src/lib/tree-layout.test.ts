/**
 * Tests for tree-layout.ts
 *
 * UI-WORKSPACE-004: Auto Layout
 *
 * Tests the vertical tree layout algorithm with various tree structures.
 */

import { describe, expect, it } from "vitest";
import {
	calculateTreeLayout,
	type LayoutInputNode,
	type LayoutResult,
} from "./tree-layout";

// Helper function to find a node by ID with proper error handling
function findNodeById(result: LayoutResult[], id: string): LayoutResult {
	const node = result.find((n) => n.nodeId === id);
	if (!node) {
		throw new Error(`Node with id "${id}" not found in result`);
	}
	return node;
}

describe("Tree Layout Algorithm", () => {
	/**
	 * Test 1: Empty project
	 */
	it("should return empty array for no nodes", () => {
		const nodes: LayoutInputNode[] = [];
		const result = calculateTreeLayout(nodes);

		expect(result).toEqual([]);
		expect(result.length).toBe(0);
	});

	/**
	 * Test 2: Single node
	 */
	it("should center single node at origin", () => {
		const nodes: LayoutInputNode[] = [{ id: "root", parentId: null }];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(1);
		expect(result[0].nodeId).toBe("root");
		// Should be centered at approximately (175, 0) - half of NODE_WIDTH
		expect(result[0].positionX).toBeCloseTo(175, 0);
		expect(result[0].positionY).toBe(0);
	});

	/**
	 * Test 3: Linear chain (no branching)
	 */
	it("should layout linear chain vertically centered", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "child1" },
			{ id: "child3", parentId: "child2" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(4);

		// Find each node by ID
		const root = findNodeById(result, "root");
		const child1 = findNodeById(result, "child1");
		const child2 = findNodeById(result, "child2");
		const child3 = findNodeById(result, "child3");

		// All should be centered at approximately the same X
		const centerX = 175; // NODE_WIDTH / 2
		expect(root.positionX).toBeCloseTo(centerX, 0);
		expect(child1.positionX).toBeCloseTo(centerX, 0);
		expect(child2.positionX).toBeCloseTo(centerX, 0);
		expect(child3.positionX).toBeCloseTo(centerX, 0);

		// Y should increase by 150 for each level
		expect(root.positionY).toBe(0);
		expect(child1.positionY).toBe(150);
		expect(child2.positionY).toBe(300);
		expect(child3.positionY).toBe(450);
	});

	/**
	 * Test 4: Simple branch (1 level, 2 children)
	 */
	it("should space two children horizontally", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(3);

		const root = findNodeById(result, "root");
		const child1 = findNodeById(result, "child1");
		const child2 = findNodeById(result, "child2");

		// Children should be spaced apart with gap
		const expectedChild1X = 175; // Center of first child's subtree
		const expectedChild2X = 575; // Center of second child's subtree (175 + 350 + 50)

		expect(child1.positionX).toBeCloseTo(expectedChild1X, 0);
		expect(child2.positionX).toBeCloseTo(expectedChild2X, 0);

		// Root should be centered above children (midpoint between children)
		const expectedRootX = (expectedChild1X + expectedChild2X) / 2;
		expect(root.positionX).toBeCloseTo(expectedRootX, 0);

		// Both children at same Y level
		expect(child1.positionY).toBe(150);
		expect(child2.positionY).toBe(150);
	});

	/**
	 * Test 5: Simple branch (1 level, 3 children)
	 */
	it("should space three children horizontally", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
			{ id: "child3", parentId: "root" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(4);

		const child1 = findNodeById(result, "child1");
		const child2 = findNodeById(result, "child2");
		const child3 = findNodeById(result, "child3");

		// All children at same Y level
		expect(child1.positionY).toBe(150);
		expect(child2.positionY).toBe(150);
		expect(child3.positionY).toBe(150);

		// Children should be evenly spaced
		const gap = child2.positionX - child1.positionX;
		expect(gap).toBeCloseTo(400, 0); // NODE_WIDTH + SIBLING_HORIZONTAL_GAP
	});

	/**
	 * Test 6: Deep tree (many levels, 1-2 children per level)
	 */
	it("should handle deep trees with proper vertical spacing", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "grandchild1", parentId: "child1" },
			{ id: "greatgrandchild1", parentId: "grandchild1" },
			{ id: "greatgreatgrandchild1", parentId: "greatgrandchild1" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(5);

		// Check vertical spacing
		const root = findNodeById(result, "root");
		const child1 = findNodeById(result, "child1");
		const grandchild1 = findNodeById(result, "grandchild1");
		const greatgrandchild1 = findNodeById(result, "greatgrandchild1");
		const greatgreatgrandchild1 = findNodeById(result, "greatgreatgrandchild1");

		expect(root.positionY).toBe(0);
		expect(child1.positionY).toBe(150);
		expect(grandchild1.positionY).toBe(300);
		expect(greatgrandchild1.positionY).toBe(450);
		expect(greatgreatgrandchild1.positionY).toBe(600);
	});

	/**
	 * Test 7: Wide tree (shallow, many children)
	 */
	it("should handle wide trees with proper horizontal spacing", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
			{ id: "child3", parentId: "root" },
			{ id: "child4", parentId: "root" },
			{ id: "child5", parentId: "root" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(6);

		const children = result.filter((n) => n.nodeId.startsWith("child"));

		// All children should have different X positions (no overlap)
		const xPositions = children.map((c) => c.positionX);
		const uniqueX = new Set(xPositions);
		expect(uniqueX.size).toBe(5);

		// All children at same Y level
		for (const child of children) {
			expect(child.positionY).toBe(150);
		}
	});

	/**
	 * Test 8: Asymmetric tree (some branches deeper than others)
	 */
	it("should center parents above children in asymmetric tree", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
			{ id: "grandchild1", parentId: "child1" },
			{ id: "grandchild2", parentId: "child1" },
		];
		const result = calculateTreeLayout(nodes);

		const root = findNodeById(result, "root");
		const child1 = findNodeById(result, "child1");
		const child2 = findNodeById(result, "child2");

		// Root should be centered above its children
		// child1 has subtree width of 2 children (350 + 50 + 350 = 750)
		// child2 has subtree width of 1 child (350)
		// Total subtree width = 750 + 50 + 350 = 1150
		// child1 center = 375, child2 center = 975
		// root center should be around (375 + 975) / 2 = 675

		expect(root.positionX).toBeGreaterThan(child1.positionX);
		expect(root.positionX).toBeLessThan(child2.positionX);
	});

	/**
	 * Test 9: Multiple root nodes
	 */
	it("should layout multiple trees left-to-right", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root1", parentId: null },
			{ id: "child1a", parentId: "root1" },
			{ id: "root2", parentId: null },
			{ id: "child2a", parentId: "root2" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(4);

		const root1 = findNodeById(result, "root1");
		const root2 = findNodeById(result, "root2");

		// Second tree should be to the right of first tree
		expect(root2.positionX).toBeGreaterThan(root1.positionX);

		// Both roots at Y=0
		expect(root1.positionY).toBe(0);
		expect(root2.positionY).toBe(0);
	});

	/**
	 * Test 10: Orphan nodes (no parent)
	 */
	it("should treat orphans as separate roots", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root1", parentId: null },
			{ id: "orphan", parentId: "nonexistent" },
			{ id: "root2", parentId: null },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(3);

		// All should be at Y=0 (treated as roots)
		for (const node of result) {
			expect(node.positionY).toBe(0);
		}
	});

	/**
	 * Test 11: Large tree (100+ nodes)
	 */
	it("should handle large trees efficiently", () => {
		const nodes: LayoutInputNode[] = [{ id: "root", parentId: null }];

		// Create a tree with 100 nodes
		let parentId = "root";
		for (let i = 0; i < 99; i++) {
			const id = `node-${i}`;
			nodes.push({ id, parentId });
			parentId = id;
		}

		const startTime = Date.now();
		const result = calculateTreeLayout(nodes);
		const endTime = Date.now();

		expect(result.length).toBe(100);
		// Should complete in reasonable time (< 100ms)
		expect(endTime - startTime).toBeLessThan(100);
	});

	/**
	 * Test 12: Determinism
	 */
	it("should produce same output for same input", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
		];

		const result1 = calculateTreeLayout(nodes);
		const result2 = calculateTreeLayout(nodes);

		// Sort by nodeId for comparison
		const sorted1 = result1.sort((a, b) => a.nodeId.localeCompare(b.nodeId));
		const sorted2 = result2.sort((a, b) => a.nodeId.localeCompare(b.nodeId));

		expect(sorted1).toEqual(sorted2);
	});

	/**
	 * Test 13: Star pattern (all children of root)
	 */
	it("should handle star pattern from root", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
			{ id: "child3", parentId: "root" },
			{ id: "child4", parentId: "root" },
		];
		const result = calculateTreeLayout(nodes);

		// All children should be at same level
		const children = result.filter((n) => n.nodeId.startsWith("child"));
		for (const child of children) {
			expect(child.positionY).toBe(150);
		}

		// No two children should have same X position
		const xPositions = children.map((c) => c.positionX);
		const uniqueX = new Set(xPositions);
		expect(uniqueX.size).toBe(4);
	});

	/**
	 * Test 14: Mixed branching (some nodes with many children, some with few)
	 */
	it("should handle mixed branching patterns", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "child1", parentId: "root" },
			{ id: "child2", parentId: "root" },
			{ id: "grandchild1a", parentId: "child1" },
			{ id: "grandchild1b", parentId: "child1" },
			{ id: "grandchild1c", parentId: "child1" },
			{ id: "grandchild2a", parentId: "child2" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(7);

		// Verify all nodes have unique positions
		const positions = result.map((n) => `${n.positionX},${n.positionY}`);
		const uniquePositions = new Set(positions);
		expect(uniquePositions.size).toBe(7);
	});

	/**
	 * Test 15: Complex tree with multiple levels of branching
	 */
	it("should handle complex tree with multiple branching levels", () => {
		const nodes: LayoutInputNode[] = [
			{ id: "root", parentId: null },
			{ id: "a", parentId: "root" },
			{ id: "b", parentId: "root" },
			{ id: "a1", parentId: "a" },
			{ id: "a2", parentId: "a" },
			{ id: "b1", parentId: "b" },
			{ id: "b2", parentId: "b" },
			{ id: "a1-1", parentId: "a1" },
			{ id: "a1-2", parentId: "a1" },
		];
		const result = calculateTreeLayout(nodes);

		expect(result.length).toBe(9);

		// Verify hierarchical structure is maintained
		const root = findNodeById(result, "root");
		const a = findNodeById(result, "a");
		const a1 = findNodeById(result, "a1");
		const a1_1 = findNodeById(result, "a1-1");

		// Each level should be below the previous
		expect(root.positionY).toBeLessThan(a.positionY);
		expect(a.positionY).toBeLessThan(a1.positionY);
		expect(a1.positionY).toBeLessThan(a1_1.positionY);

		// All nodes at same level should have same Y
		const level1 = result.filter((n) => n.positionY === 150);
		const level2 = result.filter((n) => n.positionY === 300);
		const level3 = result.filter((n) => n.positionY === 450);

		expect(level1.length).toBe(2); // a, b
		expect(level2.length).toBe(4); // a1, a2, b1, b2
		expect(level3.length).toBe(2); // a1-1, a1-2
	});
});
