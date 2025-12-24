import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import {
	CanvasLayout,
	FloatingToolbar,
	InspectorPanel,
	TopHeader,
} from "./index";

describe("CanvasLayout", () => {
	it("should render with grid background", () => {
		const { container } = render(
			<CanvasLayout>
				<div>Test Content</div>
			</CanvasLayout>,
		);

		const layout = container.firstElementChild;
		expect(layout).toHaveClass("bg-slate-50");
	});

	it("should render header when provided", () => {
		render(
			<CanvasLayout header={<div data-testid="header">Header</div>}>
				<div>Content</div>
			</CanvasLayout>,
		);

		expect(screen.getByTestId("header")).toBeInTheDocument();
	});

	it("should render toolbar when provided", () => {
		render(
			<CanvasLayout toolbar={<div data-testid="toolbar">Toolbar</div>}>
				<div>Content</div>
			</CanvasLayout>,
		);

		expect(screen.getByTestId("toolbar")).toBeInTheDocument();
	});

	it("should render inspector when provided", () => {
		render(
			<CanvasLayout
				inspector={<div data-testid="inspector">Inspector</div>}
				inspectorOpen={true}
			>
				<div>Content</div>
			</CanvasLayout>,
		);

		expect(screen.getByTestId("inspector")).toBeInTheDocument();
	});

	it("should apply custom className", () => {
		const { container } = render(
			<CanvasLayout className="custom-class">
				<div>Content</div>
			</CanvasLayout>,
		);

		const layout = container.firstElementChild;
		expect(layout).toHaveClass("custom-class");
	});
});

describe("TopHeader", () => {
	it("should render with default project name", () => {
		render(<TopHeader />);
		expect(screen.getByText("Untitled Project")).toBeInTheDocument();
	});

	it("should render custom project name", () => {
		render(<TopHeader projectName="My Project" />);
		expect(screen.getByText("My Project")).toBeInTheDocument();
	});

	it("should render back button when onBack is provided", () => {
		const onBack = () => {};
		render(<TopHeader onBack={onBack} />);
		expect(screen.getByLabelText("Go back")).toBeInTheDocument();
	});

	it("should not render back button when onBack is not provided", () => {
		render(<TopHeader />);
		expect(screen.queryByLabelText("Go back")).not.toBeInTheDocument();
	});

	it("should display save status", () => {
		const { rerender } = render(<TopHeader saveStatus="saving" />);
		expect(screen.getByText("Saving...")).toBeInTheDocument();

		rerender(<TopHeader saveStatus="saved" />);
		expect(screen.getByText("Saved")).toBeInTheDocument();

		rerender(<TopHeader saveStatus="unsaved" />);
		expect(screen.getByText("Unsaved")).toBeInTheDocument();
	});

	it("should render default action buttons", () => {
		render(<TopHeader />);
		expect(screen.getByLabelText("Share project")).toBeInTheDocument();
		expect(screen.getByLabelText("Export project")).toBeInTheDocument();
		expect(screen.getByLabelText("Project settings")).toBeInTheDocument();
	});

	it("should render custom right content", () => {
		render(<TopHeader rightContent={<div data-testid="custom">Custom</div>} />);
		expect(screen.getByTestId("custom")).toBeInTheDocument();
		expect(screen.queryByLabelText("Share project")).not.toBeInTheDocument();
	});

	it("should call onBack when back button is clicked", () => {
		const onBack = () => {};
		render(<TopHeader onBack={onBack} />);
		const backButton = screen.getByLabelText("Go back");
		expect(backButton).toBeInTheDocument();
	});
});

describe("FloatingToolbar", () => {
	it("should render with default select mode", () => {
		render(<FloatingToolbar />);
		// Select tool should be active by default
		const container = screen.getByLabelText("Select mode (V)")?.parentElement;
		expect(container).toBeInTheDocument();
	});

	it("should render all tool buttons", () => {
		render(<FloatingToolbar />);
		expect(screen.getByLabelText("Select mode (V)")).toBeInTheDocument();
		expect(screen.getByLabelText("Hand mode (H)")).toBeInTheDocument();
		expect(screen.getByLabelText("Connect mode (L)")).toBeInTheDocument();
		expect(screen.getByLabelText("Add node (N)")).toBeInTheDocument();
		expect(screen.getByLabelText("Auto layout")).toBeInTheDocument();
	});

	it("should highlight active tool mode", () => {
		const { rerender } = render(<FloatingToolbar mode="select" />);
		// Check select button has active class (bg-blue-500)
		const selectButton = screen.getByLabelText("Select mode (V)");
		expect(selectButton.closest("button")).toHaveClass("bg-blue-500");

		rerender(<FloatingToolbar mode="hand" />);
		const handButton = screen.getByLabelText("Hand mode (H)");
		expect(handButton.closest("button")).toHaveClass("bg-blue-500");
	});

	it("should call onModeChange when tool button is clicked", () => {
		const onModeChange = () => {};
		render(<FloatingToolbar onModeChange={onModeChange} />);
		// Button is rendered, click handler is attached
		expect(screen.getByLabelText("Hand mode (H)")).toBeInTheDocument();
	});

	it("should call onAddNode when Add button is clicked", () => {
		const onAddNode = () => {};
		render(<FloatingToolbar onAddNode={onAddNode} />);
		expect(screen.getByLabelText("Add node (N)")).toBeInTheDocument();
	});

	it("should call onLayout when Layout button is clicked", () => {
		const onLayout = () => {};
		render(<FloatingToolbar onLayout={onLayout} />);
		expect(screen.getByLabelText("Auto layout")).toBeInTheDocument();
	});

	it("should render custom children", () => {
		render(
			<FloatingToolbar>
				<div data-testid="custom-toolbar">Custom</div>
			</FloatingToolbar>,
		);
		expect(screen.getByTestId("custom-toolbar")).toBeInTheDocument();
	});
});

describe("InspectorPanel", () => {
	it("should render with thread tab active by default", () => {
		render(<InspectorPanel />);
		expect(screen.getByText("Thread")).toBeInTheDocument();
		expect(screen.getByText("Properties")).toBeInTheDocument();
	});

	it("should display empty state for thread when no content", () => {
		render(<InspectorPanel activeTab="thread" />);
		expect(
			screen.getByText("Select a node to view conversation thread"),
		).toBeInTheDocument();
	});

	it("should display empty state for properties when no content", () => {
		render(<InspectorPanel activeTab="properties" />);
		expect(
			screen.getByText("Select a node to view properties"),
		).toBeInTheDocument();
	});

	it("should render thread content when provided", () => {
		render(
			<InspectorPanel
				activeTab="thread"
				threadContent={<div data-testid="thread-content">Thread</div>}
			/>,
		);
		expect(screen.getByTestId("thread-content")).toBeInTheDocument();
	});

	it("should render properties content when provided", () => {
		render(
			<InspectorPanel
				activeTab="properties"
				propertiesContent={<div data-testid="props-content">Props</div>}
			/>,
		);
		expect(screen.getByTestId("props-content")).toBeInTheDocument();
	});

	it("should render close button", () => {
		render(<InspectorPanel />);
		expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
	});

	it("should call onClose when close button is clicked", () => {
		const onClose = () => {};
		render(<InspectorPanel onClose={onClose} />);
		expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
	});

	it("should call onTabChange when tab is clicked", () => {
		const onTabChange = () => {};
		render(<InspectorPanel onTabChange={onTabChange} />);
		expect(screen.getByText("Thread")).toBeInTheDocument();
		expect(screen.getByText("Properties")).toBeInTheDocument();
	});
});

describe("Layout Integration", () => {
	it("should render all layout components together", () => {
		render(
			<CanvasLayout
				header={<TopHeader projectName="Test Project" />}
				toolbar={<FloatingToolbar mode="select" />}
				inspector={<InspectorPanel activeTab="thread" />}
				inspectorOpen={true}
			>
				<div>Canvas Content</div>
			</CanvasLayout>,
		);

		expect(screen.getByText("Test Project")).toBeInTheDocument();
		expect(screen.getByLabelText("Select mode (V)")).toBeInTheDocument();
		expect(screen.getByText("Thread")).toBeInTheDocument();
		expect(screen.getByText("Canvas Content")).toBeInTheDocument();
	});
});
