/**
 * Tests for InfiniteCanvas component
 */

import { render, screen } from "@testing-library/react";
import type { Edge, Node } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { InfiniteCanvas } from "./InfiniteCanvas";

// Mock the CSS import
vi.mock("@xyflow/react/dist/style.css", () => ({}));

// Mock @xyflow/react module
vi.mock("@xyflow/react", () => ({
	ReactFlow: ({
		children,
		nodes,
		edges,
		onMoveStart,
		onMoveEnd,
	}: {
		children?: React.ReactNode;
		nodes?: any[];
		edges?: any[];
		onMoveStart?: () => void;
		onMoveEnd?: () => void;
	}) => (
		<div
			data-testid="react-flow"
			data-nodes={nodes?.length ?? 0}
			data-edges={edges?.length ?? 0}
			onMoveStart={onMoveStart}
			onMoveEnd={onMoveEnd}
		>
			{children}
		</div>
	),
	Background: ({
		variant,
		gap,
		color,
	}: {
		variant?: string;
		gap?: number;
		color?: string;
	}) => (
		<div
			data-testid="background"
			data-variant={variant}
			data-gap={gap}
			data-color={color}
		/>
	),
	Controls: () => <div data-testid="controls">Controls</div>,
}));

describe("InfiniteCanvas", () => {
	describe("Rendering", () => {
		it("should render without crashing", () => {
			render(<InfiniteCanvas />);
			expect(screen.getByTestId("react-flow")).toBeInTheDocument();
		});

		it("should render with empty nodes and edges by default", () => {
			render(<InfiniteCanvas />);
			const canvas = screen.getByTestId("react-flow");
			expect(canvas).toHaveAttribute("data-nodes", "0");
			expect(canvas).toHaveAttribute("data-edges", "0");
		});

		it("should render with provided nodes", () => {
			const nodes: Node[] = [
				{
					id: "1",
					type: "default",
					position: { x: 0, y: 0 },
					data: { label: "Node 1" },
				},
				{
					id: "2",
					type: "default",
					position: { x: 100, y: 100 },
					data: { label: "Node 2" },
				},
			];
			render(<InfiniteCanvas nodes={nodes} />);
			const canvas = screen.getByTestId("react-flow");
			expect(canvas).toHaveAttribute("data-nodes", "2");
		});

		it("should render with provided edges", () => {
			const edges: Edge[] = [
				{ id: "e1-2", source: "1", target: "2" },
				{ id: "e2-3", source: "2", target: "3" },
			];
			render(<InfiniteCanvas edges={edges} />);
			const canvas = screen.getByTestId("react-flow");
			expect(canvas).toHaveAttribute("data-edges", "2");
		});

		it("should render background with dots variant by default", () => {
			render(<InfiniteCanvas />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute("data-variant", "dots");
		});

		it("should render background with custom variant", () => {
			render(<InfiniteCanvas backgroundVariant="lines" />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute("data-variant", "lines");
		});

		it("should render background with custom gap", () => {
			render(<InfiniteCanvas backgroundGap={48} />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute("data-gap", "48");
		});

		it("should render background with default gap of 24", () => {
			render(<InfiniteCanvas />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute("data-gap", "24");
		});
	});

	describe("Controls", () => {
		it("should not render controls by default", () => {
			render(<InfiniteCanvas />);
			expect(screen.queryByTestId("controls")).not.toBeInTheDocument();
		});

		it("should render controls when showControls is true", () => {
			render(<InfiniteCanvas showControls />);
			expect(screen.getByTestId("controls")).toBeInTheDocument();
		});
	});

	describe("Props", () => {
		it("should pass additional props to ReactFlow", () => {
			render(
				<InfiniteCanvas data-custom-prop="test" className="custom-class" />,
			);
			const canvas = screen.getByTestId("react-flow");
			expect(canvas).toBeInTheDocument();
		});

		it("should accept initial viewport prop", () => {
			render(
				<InfiniteCanvas initialViewport={{ x: 100, y: 200, zoom: 1.5 }} />,
			);
			expect(screen.getByTestId("react-flow")).toBeInTheDocument();
		});

		it("should accept panOnDrag prop", () => {
			render(<InfiniteCanvas panOnDrag={false} />);
			expect(screen.getByTestId("react-flow")).toBeInTheDocument();
		});

		it("should accept zoomOnScroll prop", () => {
			render(<InfiniteCanvas zoomOnScroll={false} />);
			expect(screen.getByTestId("react-flow")).toBeInTheDocument();
		});

		it("should accept zoomOnPinch prop", () => {
			render(<InfiniteCanvas zoomOnPinch={false} />);
			expect(screen.getByTestId("react-flow")).toBeInTheDocument();
		});

		it("should accept panOnScroll prop", () => {
			render(<InfiniteCanvas panOnScroll={true} />);
			expect(screen.getByTestId("react-flow")).toBeInTheDocument();
		});
	});

	describe("Integration", () => {
		it("should render with all props configured", () => {
			const nodes: Node[] = [
				{
					id: "1",
					type: "default",
					position: { x: 0, y: 0 },
					data: { label: "Node 1" },
				},
			];
			const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

			render(
				<InfiniteCanvas
					nodes={nodes}
					edges={edges}
					backgroundVariant="cross"
					backgroundGap={32}
					showControls
					initialViewport={{ x: 50, y: 50, zoom: 1.2 }}
					panOnDrag={true}
					zoomOnScroll={true}
					zoomOnPinch={true}
					panOnScroll={false}
				/>,
			);

			expect(screen.getByTestId("react-flow")).toHaveAttribute(
				"data-nodes",
				"1",
			);
			expect(screen.getByTestId("react-flow")).toHaveAttribute(
				"data-edges",
				"1",
			);
			expect(screen.getByTestId("background")).toHaveAttribute(
				"data-variant",
				"cross",
			);
			expect(screen.getByTestId("background")).toHaveAttribute(
				"data-gap",
				"32",
			);
			expect(screen.getByTestId("controls")).toBeInTheDocument();
		});
	});

	describe("UI-002-UPDATE: Visual Optimization", () => {
		it("should render background with default dotOpacity of 0.04", () => {
			render(<InfiniteCanvas />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute(
				"data-color",
				"rgba(203, 213, 225, 0.04)",
			);
		});

		it("should render background with custom dotOpacity", () => {
			render(<InfiniteCanvas dotOpacity={0.1} />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute(
				"data-color",
				"rgba(203, 213, 225, 0.1)",
			);
		});

		it("should show background by default when showDotsOnPanOnly is false", () => {
			render(<InfiniteCanvas showDotsOnPanOnly={false} />);
			expect(screen.getByTestId("background")).toBeInTheDocument();
		});

		it("should show background by default when showDotsOnPanOnly is not provided", () => {
			render(<InfiniteCanvas />);
			expect(screen.getByTestId("background")).toBeInTheDocument();
		});

		it("should accept showDotsOnPanOnly prop", () => {
			render(<InfiniteCanvas showDotsOnPanOnly={true} />);
			const canvas = screen.getByTestId("react-flow");
			expect(canvas).toBeInTheDocument();
			// Background should be hidden initially when showDotsOnPanOnly is true
			// Note: In a real scenario, background would appear during pan
		});

		it("should accept dotOpacity prop", () => {
			render(<InfiniteCanvas dotOpacity={0.05} />);
			const canvas = screen.getByTestId("react-flow");
			expect(canvas).toBeInTheDocument();
		});

		it("should support very subtle dots with 0.03 opacity", () => {
			render(<InfiniteCanvas dotOpacity={0.03} />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute(
				"data-color",
				"rgba(203, 213, 225, 0.03)",
			);
		});

		it("should support more visible dots with 0.08 opacity", () => {
			render(<InfiniteCanvas dotOpacity={0.08} />);
			const background = screen.getByTestId("background");
			expect(background).toHaveAttribute(
				"data-color",
				"rgba(203, 213, 225, 0.08)",
			);
		});
	});

	describe("UI-002-UPDATE: Integration with Visual Updates", () => {
		it("should render with all visual optimization props configured", () => {
			const nodes: Node[] = [
				{
					id: "1",
					type: "default",
					position: { x: 0, y: 0 },
					data: { label: "Node 1" },
				},
			];
			const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

			render(
				<InfiniteCanvas
					nodes={nodes}
					edges={edges}
					backgroundVariant="dots"
					backgroundGap={24}
					showDotsOnPanOnly={true}
					dotOpacity={0.05}
					showControls={false}
				/>,
			);

			expect(screen.getByTestId("react-flow")).toHaveAttribute(
				"data-nodes",
				"1",
			);
			expect(screen.getByTestId("react-flow")).toHaveAttribute(
				"data-edges",
				"1",
			);
			// When showDotsOnPanOnly is true and not panning, background is hidden
			expect(screen.queryByTestId("background")).not.toBeInTheDocument();
		});

		it("should render with visual optimization but always show dots when showDotsOnPanOnly is false", () => {
			const nodes: Node[] = [
				{
					id: "1",
					type: "default",
					position: { x: 0, y: 0 },
					data: { label: "Node 1" },
				},
			];
			const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

			render(
				<InfiniteCanvas
					nodes={nodes}
					edges={edges}
					backgroundVariant="dots"
					backgroundGap={24}
					showDotsOnPanOnly={false}
					dotOpacity={0.05}
					showControls={false}
				/>,
			);

			expect(screen.getByTestId("react-flow")).toHaveAttribute(
				"data-nodes",
				"1",
			);
			expect(screen.getByTestId("react-flow")).toHaveAttribute(
				"data-edges",
				"1",
			);
			// When showDotsOnPanOnly is false, background is always shown
			expect(screen.getByTestId("background")).toHaveAttribute(
				"data-variant",
				"dots",
			);
			expect(screen.getByTestId("background")).toHaveAttribute(
				"data-color",
				"rgba(203, 213, 225, 0.05)",
			);
		});
	});
});
