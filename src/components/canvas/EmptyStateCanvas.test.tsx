/**
 * UI-NEW-001 / UI-NEW-003: Empty State Canvas Component Tests
 *
 * Tests for the EmptyStateCanvas component.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyStateCanvas } from "./EmptyStateCanvas";

describe("EmptyStateCanvas", () => {
	describe("Rendering", () => {
		it("should not render when show is false", () => {
			render(<EmptyStateCanvas show={false} />);
			expect(screen.queryByText(/double click/i)).not.toBeInTheDocument();
		});

		it("should render when show is true", () => {
			render(<EmptyStateCanvas show={true} />);
			expect(screen.getByText(/double click/i)).toBeInTheDocument();
		});

		it("should render with default message", () => {
			render(<EmptyStateCanvas show={true} />);
			expect(
				screen.getByText("Double click anywhere to start your thought flow"),
			).toBeInTheDocument();
		});

		it("should render with custom message", () => {
			const customMessage = "Click anywhere to begin";
			render(<EmptyStateCanvas show={true} message={customMessage} />);
			expect(screen.getByText(customMessage)).toBeInTheDocument();
		});

		it("should have correct z-index style", () => {
			render(<EmptyStateCanvas show={true} />);
			const container =
				screen.getByText(/double click/i).parentElement?.parentElement;
			expect(container).toHaveStyle({ zIndex: 1 });
		});

		it("should be positioned absolutely", () => {
			render(<EmptyStateCanvas show={true} />);
			const container =
				screen.getByText(/double click/i).parentElement?.parentElement;
			expect(container).toHaveClass("absolute", "inset-0");
		});

		it("should have correct text styling", () => {
			render(<EmptyStateCanvas show={true} />);
			const message = screen.getByText(/double click/i);
			expect(message).toHaveClass(
				"text-lg",
				"text-slate-400",
				"font-light",
				"tracking-wide",
			);
		});
	});

	describe("Double Click Handler", () => {
		it("should call onDoubleClick when double-clicked", () => {
			const handleClick = vi.fn();
			render(<EmptyStateCanvas show={true} onDoubleClick={handleClick} />);

			const container =
				screen.getByText(/double click/i).parentElement?.parentElement;
			if (container) {
				fireEvent.doubleClick(container);
			}

			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		it("should pass mouse event to onDoubleClick handler", () => {
			const handleClick = vi.fn();
			render(<EmptyStateCanvas show={true} onDoubleClick={handleClick} />);

			const container =
				screen.getByText(/double click/i).parentElement?.parentElement;
			if (container) {
				fireEvent.doubleClick(container, {
					clientX: 100,
					clientY: 200,
				});
			}

			expect(handleClick).toHaveBeenCalledWith(
				expect.objectContaining({
					clientX: 100,
					clientY: 200,
				}),
			);
		});

		it("should set pointer-events to none on text element when onDoubleClick is provided", () => {
			render(<EmptyStateCanvas show={true} onDoubleClick={() => {}} />);

			const textContainer = screen.getByText(/double click/i).parentElement;
			expect(textContainer).toHaveStyle({ pointerEvents: "none" });
		});

		it("should not have pointer-events style when onDoubleClick is not provided", () => {
			render(<EmptyStateCanvas show={true} />);

			const textContainer = screen.getByText(/double click/i).parentElement;
			expect(textContainer).toHaveStyle({ pointerEvents: "auto" });
		});
	});

	describe("Conditional Display", () => {
		it("should show when nodes array is empty", () => {
			const nodes: never[] = [];
			render(<EmptyStateCanvas show={nodes.length === 0} />);
			expect(screen.getByText(/double click/i)).toBeInTheDocument();
		});

		it("should hide when nodes array has items", () => {
			const nodes = [{ id: "1" }];
			render(<EmptyStateCanvas show={nodes.length === 0} />);
			expect(screen.queryByText(/double click/i)).not.toBeInTheDocument();
		});
	});

	describe("Message Content", () => {
		it("should allow empty custom message", () => {
			render(<EmptyStateCanvas show={true} message="" />);
			// Should show default message when custom is empty
			expect(
				screen.getByText("Double click anywhere to start your thought flow"),
			).toBeInTheDocument();
		});

		it("should render long custom messages", () => {
			const longMessage =
				"This is a very long message that explains to the user how they can start using the application by double clicking anywhere on the canvas.";
			render(<EmptyStateCanvas show={true} message={longMessage} />);
			expect(screen.getByText(longMessage)).toBeInTheDocument();
		});
	});
});
