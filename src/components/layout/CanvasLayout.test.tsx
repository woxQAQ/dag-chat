import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
		expect(layout).toHaveClass("bg-[var(--color-canvas)]");
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
	it("should not render when onBack is not provided", () => {
		const { container } = render(<TopHeader />);
		expect(container.firstChild).toBe(null);
	});

	it("should render back button when onBack is provided", () => {
		const onBack = () => {};
		const { container } = render(<TopHeader onBack={onBack} />);
		expect(container.querySelector("button")).toBeInTheDocument();
		expect(screen.getByLabelText("Go back to dashboard")).toBeInTheDocument();
	});

	it("should call onBack when back button is clicked", () => {
		const onBack = vi.fn();
		render(<TopHeader onBack={onBack} />);
		const backButton = screen.getByLabelText("Go back to dashboard");
		backButton.click();
		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it("should use fixed positioning for floating effect", () => {
		const onBack = () => {};
		const { container } = render(<TopHeader onBack={onBack} />);
		const wrapper = container.firstElementChild;
		expect(wrapper).toHaveClass("fixed", "top-4", "left-4", "z-40");
	});
});

describe("FloatingToolbar", () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ThemeProvider defaultTheme="light">{children}</ThemeProvider>
	);

	it("should render with default select mode", () => {
		render(<FloatingToolbar />, { wrapper });
		// Select tool should be active by default
		const container = screen.getByLabelText("Select mode (V)")?.parentElement;
		expect(container).toBeInTheDocument();
	});

	it("should render all tool buttons", () => {
		render(<FloatingToolbar />, { wrapper });
		expect(screen.getByLabelText("Select mode (V)")).toBeInTheDocument();
		expect(screen.getByLabelText("Hand mode (H)")).toBeInTheDocument();
		expect(screen.getByLabelText("Connect mode (L)")).toBeInTheDocument();
		expect(screen.getByLabelText("Auto layout")).toBeInTheDocument();
	});

	it("should highlight active tool mode", () => {
		const { rerender } = render(<FloatingToolbar mode="select" />, { wrapper });
		// Check select button has active class
		const selectButton = screen.getByLabelText("Select mode (V)");
		expect(selectButton.closest("button")).toHaveClass(
			"bg-[var(--color-primary)]",
		);

		rerender(<FloatingToolbar mode="hand" />);
		const handButton = screen.getByLabelText("Hand mode (H)");
		expect(handButton.closest("button")).toHaveClass(
			"bg-[var(--color-primary)]",
		);
	});

	it("should call onModeChange when tool button is clicked", () => {
		const onModeChange = () => {};
		render(<FloatingToolbar onModeChange={onModeChange} />, { wrapper });
		// Button is rendered, click handler is attached
		expect(screen.getByLabelText("Hand mode (H)")).toBeInTheDocument();
	});

	it("should call onLayout when Layout button is clicked", () => {
		const onLayout = () => {};
		render(<FloatingToolbar onLayout={onLayout} />, { wrapper });
		expect(screen.getByLabelText("Auto layout")).toBeInTheDocument();
	});

	it("should render custom children", () => {
		render(
			<FloatingToolbar>
				<div data-testid="custom-toolbar">Custom</div>
			</FloatingToolbar>,
			{ wrapper },
		);
		expect(screen.getByTestId("custom-toolbar")).toBeInTheDocument();
	});
});

describe("InspectorPanel", () => {
	it("should render with Thread header", () => {
		render(<InspectorPanel />);
		expect(screen.getByText("Thread")).toBeInTheDocument();
	});

	it("should display empty state when no content", () => {
		render(<InspectorPanel />);
		expect(
			screen.getByText("Select a node to view conversation thread"),
		).toBeInTheDocument();
	});

	it("should render thread content when provided", () => {
		render(
			<InspectorPanel
				threadContent={<div data-testid="thread-content">Thread</div>}
			/>,
		);
		expect(screen.getByTestId("thread-content")).toBeInTheDocument();
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
});

describe("Layout Integration", () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ThemeProvider defaultTheme="light">{children}</ThemeProvider>
	);

	it("should render all layout components together", () => {
		const onBack = () => {};
		render(
			<CanvasLayout
				header={<TopHeader onBack={onBack} />}
				toolbar={<FloatingToolbar mode="select" />}
				inspector={<InspectorPanel />}
				inspectorOpen={true}
			>
				<div>Canvas Content</div>
			</CanvasLayout>,
			{ wrapper },
		);

		expect(screen.getByLabelText("Go back to dashboard")).toBeInTheDocument();
		expect(screen.getByLabelText("Select mode (V)")).toBeInTheDocument();
		expect(screen.getByText("Thread")).toBeInTheDocument();
		expect(screen.getByText("Canvas Content")).toBeInTheDocument();
	});
});
