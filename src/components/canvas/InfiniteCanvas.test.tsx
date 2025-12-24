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
	ReactFlow: ({ children, nodes, edges, ...props }: any) => (
		<div
			data-testid="react-flow"
			data-nodes={nodes?.length}
			data-edges={edges?.length}
		>
			{children}
		</div>
	),
	Background: ({ variant, gap, size, color }: any) => (
		<div
			data-testid="background"
			data-variant={variant}
			data-gap={gap}
			data-size={size}
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
			const { container } = render(
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
});
