/**
 * Tests for EditableNode component (UI-NEW-004)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NodeEditingProvider } from "@/contexts/NodeEditingContext";
import { createEditableNode, EditableUserNode } from "./EditableNode";
import type { MindFlowNode } from "./types";

// Mock the Handle component and useReactFlow from @xyflow/react
vi.mock("@xyflow/react", async () => {
	const actual = await vi.importActual("@xyflow/react");
	return {
		...actual,
		Handle: ({ id, className }: { id: string; className: string }) => (
			<div data-testid={`handle-${id}`} className={className} />
		),
		useReactFlow: () => ({
			getNodes: () => [],
			getEdges: () => [],
		}),
	};
});

// Helper function to render EditableUserNode with required context
function renderEditableUserNode(
	node: MindFlowNode,
	onCreateChild = vi.fn(),
	isHovered = false,
) {
	return render(
		<NodeEditingProvider
			onUpdateContent={vi.fn()}
			onCreateChild={onCreateChild}
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
			renderEditableUserNode(mockNode);

			expect(screen.getByText("Initial content")).toBeInTheDocument();
			expect(screen.getByText("You")).toBeInTheDocument();
		});

		it("should not render branch button when not hovered", () => {
			const onCreateChild = vi.fn();
			renderEditableUserNode(mockNode, onCreateChild, false);

			expect(
				screen.queryByRole("button", { name: /create child node/i }),
			).not.toBeInTheDocument();
		});

		it("should render branch button when hovered", () => {
			const onCreateChild = vi.fn();
			renderEditableUserNode(mockNode, onCreateChild, true);

			expect(
				screen.getByRole("button", { name: /create child node/i }),
			).toBeInTheDocument();
		});

		it("should call onCreateChild when branch button is clicked", () => {
			const onCreateChild = vi.fn();
			renderEditableUserNode(mockNode, onCreateChild, true);

			const branchButton = screen.getByRole("button", {
				name: /create child node/i,
			});
			branchButton.click();

			expect(onCreateChild).toHaveBeenCalledTimes(1);
			expect(onCreateChild).toHaveBeenCalledWith("node-123");
		});

		it("should work without onCreateChild callback", () => {
			expect(() => {
				renderEditableUserNode(mockNode);
			}).not.toThrow();
		});
	});

	describe("createEditableNode", () => {
		it("should create a node component", () => {
			const onCreateChild = vi.fn();
			const EditableComponent = createEditableNode();

			const props = {
				data: mockNode.data,
				position: mockNode.position,
				selected: false,
				isHovered: false,
			};

			expect(() => {
				render(
					<NodeEditingProvider
						onUpdateContent={vi.fn()}
						onCreateChild={onCreateChild}
					>
						<EditableComponent {...props} />
					</NodeEditingProvider>,
				);
			}).not.toThrow();
		});

		it("should render UserNode for USER role", () => {
			const onCreateChild = vi.fn();
			const EditableComponent = createEditableNode();

			const props = {
				data: mockNode.data,
				position: mockNode.position,
				selected: false,
				isHovered: false,
			};

			render(
				<NodeEditingProvider
					onUpdateContent={vi.fn()}
					onCreateChild={onCreateChild}
				>
					<EditableComponent {...props} />
				</NodeEditingProvider>,
			);

			expect(screen.getByText("Initial content")).toBeInTheDocument();
			expect(screen.getByText("You")).toBeInTheDocument();
		});
	});
});
