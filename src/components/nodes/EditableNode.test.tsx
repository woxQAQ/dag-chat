/**
 * Tests for EditableNode component (UI-NEW-004)
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NodeEditingProvider } from "@/contexts/NodeEditingContext";
import { createEditableNode, EditableUserNode } from "./EditableNode";
import type { MindFlowNode } from "./types";

// Mock the Handle component from @xyflow/react
vi.mock("@xyflow/react", async () => {
	const actual = await vi.importActual("@xyflow/react");
	return {
		...actual,
		Handle: ({ id, className }: { id: string; className: string }) => (
			<div data-testid={`handle-${id}`} className={className} />
		),
	};
});

// Helper function to render EditableUserNode with required context
function renderEditableUserNode(
	node: MindFlowNode,
	onUpdateContent = vi.fn(),
	onNodeFork = vi.fn(),
	isHovered = false,
) {
	return render(
		<NodeEditingProvider
			onUpdateContent={onUpdateContent}
			onNodeFork={onNodeFork}
		>
			<EditableUserNode node={node} isHovered={isHovered} />
		</NodeEditingProvider>,
	);
}

describe("EditableNode", () => {
	const mockNode: MindFlowNode = {
		id: "node-123",
		type: "user",
		position: { x: 100, y: 200 },
		data: {
			id: "node-123",
			role: "USER",
			content: "Initial content",
			isEditing: false,
			isStreaming: false,
			createdAt: new Date(),
			metadata: {},
		},
		selected: false,
	};

	describe("EditableUserNode", () => {
		it("should render UserNode with correct props", () => {
			const onUpdateContent = vi.fn();

			renderEditableUserNode(mockNode, onUpdateContent);

			expect(screen.getByText("Initial content")).toBeInTheDocument();
			expect(screen.getByText("You")).toBeInTheDocument();
		});

		it("should not call onUpdateContent on initial render", () => {
			const onUpdateContent = vi.fn();

			renderEditableUserNode(mockNode, onUpdateContent);

			expect(onUpdateContent).not.toHaveBeenCalled();
		});

		it("should call onNodeFork when exiting edit mode with changed content", async () => {
			const onUpdateContent = vi.fn();
			const onNodeFork = vi.fn();

			renderEditableUserNode(mockNode, onUpdateContent, onNodeFork);

			// Double-click to enter edit mode
			const nodeDiv = screen.getByText("Initial content").closest("div");
			if (nodeDiv) {
				fireEvent.doubleClick(nodeDiv);
			}

			// Find the textarea
			const textarea = screen.getByRole("textbox");
			expect(textarea).toBeInTheDocument();

			// Change content
			fireEvent.change(textarea, {
				target: { value: "Updated content" },
			});

			// Press Cmd+Enter to save
			fireEvent.keyDown(textarea, {
				key: "Enter",
				metaKey: true,
				ctrlKey: true,
			});

			// onNodeFork should be called for USER nodes (non-destructive editing)
			expect(onNodeFork).toHaveBeenCalledWith(
				"node-123",
				"Updated content",
				expect.any(Number),
				expect.any(Number),
			);
			// onUpdateContent should NOT be called for USER nodes
			expect(onUpdateContent).not.toHaveBeenCalled();
		});

		it("should not call onUpdateContent when content hasn't changed", async () => {
			const onUpdateContent = vi.fn();

			renderEditableUserNode(mockNode, onUpdateContent);

			// Double-click to enter edit mode
			const nodeDiv = screen.getByText("Initial content").closest("div");
			if (nodeDiv) {
				fireEvent.doubleClick(nodeDiv);
			}

			// Find the textarea
			const textarea = screen.getByRole("textbox");

			// Press Cmd+Enter without changing content
			fireEvent.keyDown(textarea, {
				key: "Enter",
				metaKey: true,
				ctrlKey: true,
			});

			// onUpdateContent should not be called
			expect(onUpdateContent).not.toHaveBeenCalled();
		});

		it("should show editing badge when in edit mode", () => {
			renderEditableUserNode(mockNode, vi.fn());

			// Initially not in edit mode
			expect(screen.queryByText("Editing")).not.toBeInTheDocument();

			// Double-click to enter edit mode
			const nodeDiv = screen.getByText("Initial content").closest("div");
			if (nodeDiv) {
				fireEvent.doubleClick(nodeDiv);
			}

			// Should show editing badge
			expect(screen.getByText("Editing")).toBeInTheDocument();
		});

		it("should work without onUpdateContent callback", () => {
			expect(() => {
				renderEditableUserNode(mockNode);
			}).not.toThrow();
		});
	});

	describe("createEditableNode", () => {
		it("should create a node component with editing support", () => {
			const onUpdateContent = vi.fn();
			const EditableComponent = createEditableNode();

			const props = {
				data: mockNode.data,
				position: mockNode.position,
				selected: false,
				isHovered: false,
			};

			expect(() => {
				render(
					<NodeEditingProvider onUpdateContent={onUpdateContent}>
						<EditableComponent {...props} />
					</NodeEditingProvider>,
				);
			}).not.toThrow();
		});

		it("should pass onUpdateContent to the wrapped component", async () => {
			const onUpdateContent = vi.fn();
			const onNodeFork = vi.fn();
			const EditableComponent = createEditableNode();

			const props = {
				data: mockNode.data,
				position: mockNode.position,
				selected: false,
				isHovered: false,
			};

			render(
				<NodeEditingProvider
					onUpdateContent={onUpdateContent}
					onNodeFork={onNodeFork}
				>
					<EditableComponent {...props} />
				</NodeEditingProvider>,
			);

			// Double-click to enter edit mode
			const nodeDiv = screen.getByText("Initial content").closest("div");
			if (nodeDiv) {
				fireEvent.doubleClick(nodeDiv);
			}

			// Find the textarea
			const textarea = screen.getByRole("textbox");

			// Change content
			fireEvent.change(textarea, {
				target: { value: "Updated content" },
			});

			// Press Cmd+Enter to save
			fireEvent.keyDown(textarea, {
				key: "Enter",
				metaKey: true,
				ctrlKey: true,
			});

			// onNodeFork should be called for USER nodes (non-destructive editing)
			expect(onNodeFork).toHaveBeenCalledWith(
				"node-123",
				"Updated content",
				expect.any(Number),
				expect.any(Number),
			);
		});
	});

	describe("keyboard shortcuts", () => {
		it("should exit edit mode on Escape without saving", () => {
			const onUpdateContent = vi.fn();

			renderEditableUserNode(mockNode, onUpdateContent);

			// Double-click to enter edit mode
			const nodeDiv = screen.getByText("Initial content").closest("div");
			if (nodeDiv) {
				fireEvent.doubleClick(nodeDiv);
			}

			// Find the textarea
			const textarea = screen.getByRole("textbox");

			// Change content
			fireEvent.change(textarea, {
				target: { value: "Updated content" },
			});

			// Press Escape to cancel
			fireEvent.keyDown(textarea, { key: "Escape" });

			// onUpdateContent should not be called on Escape
			expect(onUpdateContent).not.toHaveBeenCalled();

			// Should show original content
			expect(screen.getByText("Initial content")).toBeInTheDocument();
		});
	});
});
