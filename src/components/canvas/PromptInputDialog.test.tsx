/**
 * Prompt Input Dialog Component Tests
 *
 * Tests for the PromptInputDialog component.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PromptInputDialog } from "./PromptInputDialog";

describe("PromptInputDialog", () => {
	describe("Rendering", () => {
		it("should not render when isOpen is false", () => {
			render(
				<PromptInputDialog
					isOpen={false}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);
			expect(
				screen.queryByText("Start Your Thought Flow"),
			).not.toBeInTheDocument();
		});

		it("should render when isOpen is true", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);
			expect(screen.getByText("Start Your Thought Flow")).toBeInTheDocument();
		});

		it("should render with custom placeholder", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
					placeholder="Custom placeholder"
				/>,
			);
			expect(
				screen.getByPlaceholderText("Custom placeholder"),
			).toBeInTheDocument();
		});

		it("should render default placeholder", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);
			expect(
				screen.getByPlaceholderText(/Enter your prompt to start/i),
			).toBeInTheDocument();
		});

		it("should show correct character count", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);
			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "Hello world" } });
			expect(screen.getByText("11 / 4000")).toBeInTheDocument();
		});

		it("should show warning color when near character limit", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
					maxLength={100}
				/>,
			);
			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			// Enter 90 characters (90% of 100)
			fireEvent.change(textarea, {
				target: { value: "a".repeat(90) },
			});
			expect(screen.getByText("90 / 100")).toHaveClass("text-amber-600");
		});
	});

	describe("User Interactions", () => {
		it("should call onClose when Cancel button is clicked", () => {
			const handleClose = vi.fn();
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={handleClose}
					onSubmit={vi.fn()}
				/>,
			);

			const cancelButton = screen.getByText("Cancel");
			fireEvent.click(cancelButton);

			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it("should call onClose when backdrop is clicked", () => {
			const handleClose = vi.fn();
			const { container } = render(
				<PromptInputDialog
					isOpen={true}
					onClose={handleClose}
					onSubmit={vi.fn()}
				/>,
			);

			const backdrop = container.querySelector(".bg-black\\/50");
			fireEvent.click(backdrop!);

			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it("should call onSubmit with trimmed content when Create Node is clicked", () => {
			const handleSubmit = vi.fn();
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={handleSubmit}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "  My prompt  " } });

			const createButton = screen.getByText("Create Node");
			fireEvent.click(createButton);

			expect(handleSubmit).toHaveBeenCalledWith("My prompt");
		});

		it("should not call onSubmit when content is empty", () => {
			const handleSubmit = vi.fn();
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={handleSubmit}
				/>,
			);

			const createButton = screen.getByText("Create Node");
			fireEvent.click(createButton);

			expect(handleSubmit).not.toHaveBeenCalled();
		});

		it("should call onSubmit when Cmd+Enter is pressed", () => {
			const handleSubmit = vi.fn();
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={handleSubmit}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "My prompt" } });
			fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

			expect(handleSubmit).toHaveBeenCalledWith("My prompt");
		});

		it("should call onSubmit when Ctrl+Enter is pressed", () => {
			const handleSubmit = vi.fn();
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={handleSubmit}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "My prompt" } });
			fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

			expect(handleSubmit).toHaveBeenCalledWith("My prompt");
		});

		it("should call onClose when Escape is pressed", () => {
			const handleClose = vi.fn();
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={handleClose}
					onSubmit={vi.fn()}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.keyDown(textarea, { key: "Escape" });

			expect(handleClose).toHaveBeenCalledTimes(1);
		});

		it("should reset prompt when dialog reopens", () => {
			const handleClose = vi.fn();
			const handleSubmit = vi.fn();
			const { rerender } = render(
				<PromptInputDialog
					isOpen={true}
					onClose={handleClose}
					onSubmit={handleSubmit}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "My prompt" } });

			// Close and reopen
			rerender(
				<PromptInputDialog
					isOpen={false}
					onClose={handleClose}
					onSubmit={handleSubmit}
				/>,
			);
			rerender(
				<PromptInputDialog
					isOpen={true}
					onClose={handleClose}
					onSubmit={handleSubmit}
				/>,
			);

			const newTextarea = screen.getByPlaceholderText(/Enter your prompt/i);
			expect(newTextarea).toHaveValue("");
		});
	});

	describe("Button States", () => {
		it("should disable Create Node button when content is empty", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);

			const createButton = screen.getByText("Create Node");
			expect(createButton).toBeDisabled();
		});

		it("should enable Create Node button when content is not empty", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "My prompt" } });

			const createButton = screen.getByText("Create Node");
			expect(createButton).not.toBeDisabled();
		});

		it("should disable Create Node button when content is only whitespace", () => {
			render(
				<PromptInputDialog
					isOpen={true}
					onClose={vi.fn()}
					onSubmit={vi.fn()}
				/>,
			);

			const textarea = screen.getByPlaceholderText(/Enter your prompt/i);
			fireEvent.change(textarea, { target: { value: "   " } });

			const createButton = screen.getByText("Create Node");
			expect(createButton).toBeDisabled();
		});
	});
});
