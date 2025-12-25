/**
 * UI-NEW-002: Branching Interaction Tests
 *
 * Tests for the branching interaction components and hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BranchingUserNode, BranchingAINode } from "./BranchingNode";
import type { MindFlowNode } from "./types";

// Mock React Flow's Handle component
vi.mock("@xyflow/react", () => ({
	Handle: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
		<div data-testid="react-flow-handle" className={className}>
			{children}
		</div>
	),
	Position: {
		Top: "top",
		Bottom: "bottom",
		Left: "left",
		Right: "right",
	},
}));

describe("BranchingUserNode", () => {
	const mockNode: MindFlowNode = {
		id: "user-node-1",
		type: "user",
		position: { x: 100, y: 100 },
		data: {
			id: "user-node-1",
			role: "USER",
			content: "Hello, this is a user message",
		},
	};

	const mockOnCreateChild = vi.fn();

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should render user node without branch button when not hovered", () => {
		render(
			<BranchingUserNode
				node={mockNode}
				isHovered={false}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Check that the user node content is rendered
		expect(screen.getByText("Hello, this is a user message")).toBeInTheDocument();

		// Branch button should not be visible when not hovered
		const branchButton = screen.queryByLabelText("Create child node");
		expect(branchButton).not.toBeInTheDocument();
	});

	it("should show branch button when hovered", () => {
		render(
			<BranchingUserNode
				node={mockNode}
				isHovered={true}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Branch button should be visible when hovered
		const branchButton = screen.getByLabelText("Create child node");
		expect(branchButton).toBeInTheDocument();
	});

	it("should call onCreateChild when branch button is clicked", async () => {
		render(
			<BranchingUserNode
				node={mockNode}
				isHovered={true}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		const branchButton = screen.getByLabelText("Create child node");
		fireEvent.click(branchButton);

		expect(mockOnCreateChild).toHaveBeenCalledTimes(1);
	});

	it("should stop propagation when branch button is clicked", () => {
		const mockParentClick = vi.fn();

		render(
			<div onClick={mockParentClick}>
				<BranchingUserNode
					node={mockNode}
					isHovered={true}
					onCreateChild={mockOnCreateChild}
				/>
			</div>,
		);

		const branchButton = screen.getByLabelText("Create child node");
		fireEvent.click(branchButton);

		// onCreateChild should be called
		expect(mockOnCreateChild).toHaveBeenCalledTimes(1);
		// Parent click handler should not be called (propagation stopped)
		expect(mockParentClick).not.toHaveBeenCalled();
	});

	it("should not show edit hint when branch button is present", () => {
		render(
			<BranchingUserNode
				node={mockNode}
				isHovered={true}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Edit hint should not be shown when branch button is present
		const editHint = screen.queryByText("Double-click to edit");
		expect(editHint).not.toBeInTheDocument();
	});

	it("should show edit hint when branch button is not provided", () => {
		render(
			<BranchingUserNode node={mockNode} isHovered={true} />,
		);

		// Edit hint should be shown when no branch button
		const editHint = screen.queryByText("Double-click to edit");
		expect(editHint).toBeInTheDocument();
	});
});

describe("BranchingAINode", () => {
	const mockNode: MindFlowNode = {
		id: "ai-node-1",
		type: "assistant",
		position: { x: 100, y: 200 },
		data: {
			id: "ai-node-1",
			role: "ASSISTANT",
			content: "# AI Response\n\nThis is **markdown** content.",
			metadata: {
				provider: "deepseek",
				model: "deepseek-chat",
			},
		},
	};

	const mockOnRegenerate = vi.fn();
	const mockOnCopy = vi.fn();
	const mockOnCreateChild = vi.fn();

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should render AI node without branch button when not hovered", () => {
		render(
			<BranchingAINode
				node={mockNode}
				isHovered={false}
				onRegenerate={mockOnRegenerate}
				onCopy={mockOnCopy}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Check that the AI node content is rendered
		expect(screen.getByText("AI Response")).toBeInTheDocument();
		expect(screen.getByText("deepseek")).toBeInTheDocument();

		// Branch button should not be visible when not hovered
		const branchButton = screen.queryByLabelText("Create child node");
		expect(branchButton).not.toBeInTheDocument();
	});

	it("should show branch button when hovered", () => {
		render(
			<BranchingAINode
				node={mockNode}
				isHovered={true}
				onRegenerate={mockOnRegenerate}
				onCopy={mockOnCopy}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Branch button should be visible when hovered
		const branchButton = screen.getByLabelText("Create child node");
		expect(branchButton).toBeInTheDocument();
	});

	it("should call onCreateChild when branch button is clicked", async () => {
		render(
			<BranchingAINode
				node={mockNode}
				isHovered={true}
				onRegenerate={mockOnRegenerate}
				onCopy={mockOnCopy}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		const branchButton = screen.getByLabelText("Create child node");
		fireEvent.click(branchButton);

		expect(mockOnCreateChild).toHaveBeenCalledTimes(1);
	});

	it("should show both branch button and action bar when hovered", () => {
		render(
			<BranchingAINode
				node={mockNode}
				isHovered={true}
				onRegenerate={mockOnRegenerate}
				onCopy={mockOnCopy}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Both branch button and action buttons should be present
		const branchButton = screen.getByLabelText("Create child node");
		const copyButton = screen.getByTitle("Copy content");
		const regenerateButton = screen.getByTitle("Regenerate response");

		expect(branchButton).toBeInTheDocument();
		expect(copyButton).toBeInTheDocument();
		expect(regenerateButton).toBeInTheDocument();
	});

	it("should not show action hint when branch button is present", () => {
		render(
			<BranchingAINode
				node={mockNode}
				isHovered={true}
				onRegenerate={mockOnRegenerate}
				onCopy={mockOnCopy}
				onCreateChild={mockOnCreateChild}
			/>,
		);

		// Action hint should not be shown when branch button is present
		const actionHint = screen.queryByText("Double-click to regenerate");
		expect(actionHint).not.toBeInTheDocument();
	});
});

describe("createBranchingNode factory function", () => {
	it("should be exported and is a function", async () => {
		const { createBranchingNode } = await import("./BranchingNode");
		expect(typeof createBranchingNode).toBe("function");
	});

	// Note: Full integration tests for createBranchingNode would require
	// more complex setup with React Flow context, so we do a simple
	// smoke test here to verify the function is exported correctly.
});
