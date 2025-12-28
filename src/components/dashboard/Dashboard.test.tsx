/**
 * UI-007: Dashboard - Tests
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { ProjectCard } from "./ProjectCard";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		refresh: vi.fn(),
	}),
}));

// Mock next/link
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

describe("ProjectCard", () => {
	const mockProject = {
		id: "project-123",
		name: "Test Project",
		description: "A test project for unit testing",
		rootNodeId: null,
		createdAt: new Date("2024-01-15T10:00:00Z"),
		updatedAt: new Date("2024-12-25T10:00:00Z"),
		_nodeCount: 42,
	};

	const mockOnOpen = vi.fn();
	const mockOnDelete = vi.fn();
	const mockOnRename = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should render project name and description", () => {
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		expect(screen.getByText("Test Project")).toBeInTheDocument();
		expect(
			screen.getByText("A test project for unit testing"),
		).toBeInTheDocument();
	});

	it("should render node count", () => {
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		expect(screen.getByText("42 nodes")).toBeInTheDocument();
	});

	it("should render zero nodes when _nodeCount is undefined", () => {
		const projectWithoutCount = { ...mockProject, _nodeCount: undefined };
		render(
			<ProjectCard
				project={projectWithoutCount}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		expect(screen.getByText("0 nodes")).toBeInTheDocument();
	});

	it("should call onOpen when Open button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		const openButton = screen.getByRole("link", { name: "Open" });
		await user.click(openButton);

		expect(mockOnOpen).toHaveBeenCalledWith("project-123");
	});

	it("should enter rename mode when rename button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Find rename button by title
		const renameButton = screen.getByTitle("Rename project");
		await user.click(renameButton);

		// Should show input field
		const input = screen.getByRole("textbox");
		expect(input).toBeInTheDocument();
		expect(input).toHaveValue("Test Project");
	});

	it("should save rename when form is submitted", async () => {
		const user = userEvent.setup();
		mockOnRename.mockResolvedValue(undefined);
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Enter rename mode
		const renameButton = screen.getByTitle("Rename project");
		await user.click(renameButton);

		// Change name
		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "New Project Name");

		// Click save button to submit form
		const saveButton = screen.getByRole("button", { name: "Save" });
		await user.click(saveButton);

		expect(mockOnRename).toHaveBeenCalledWith(
			"project-123",
			"New Project Name",
		);
	});

	it("should cancel rename when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Enter rename mode
		const renameButton = screen.getByTitle("Rename project");
		await user.click(renameButton);

		// Change name
		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "Changed Name");

		// Click cancel
		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		await user.click(cancelButton);

		expect(mockOnRename).not.toHaveBeenCalled();

		// Should show original name again
		expect(screen.getByText("Test Project")).toBeInTheDocument();
	});

	it("should show delete confirmation when delete button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		const deleteButton = screen.getByTitle("Delete project");
		await user.click(deleteButton);

		expect(screen.getByText("Delete this project?")).toBeInTheDocument();
	});

	it("should call onDelete when delete is confirmed", async () => {
		const user = userEvent.setup();
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Click delete button
		const deleteButton = screen.getByTitle("Delete project");
		await user.click(deleteButton);

		// Click confirm delete
		const confirmButton = screen.getByRole("button", { name: "Delete" });
		await user.click(confirmButton);

		expect(mockOnDelete).toHaveBeenCalledWith("project-123");
	});

	it("should hide delete confirmation when cancel is clicked", async () => {
		const user = userEvent.setup();
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Click delete button
		const deleteButton = screen.getByTitle("Delete project");
		await user.click(deleteButton);

		// Click cancel
		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		await user.click(cancelButton);

		expect(screen.queryByText("Delete this project?")).not.toBeInTheDocument();
	});

	it("should not show rename button when onRename is not provided", () => {
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
			/>,
		);

		expect(screen.queryByTitle("Rename project")).not.toBeInTheDocument();
	});

	it("should handle project without description", () => {
		const projectWithoutDesc = { ...mockProject, description: null };
		render(
			<ProjectCard
				project={projectWithoutDesc}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Should still render the card
		expect(screen.getByText("Test Project")).toBeInTheDocument();
	});

	it("should format date correctly", () => {
		render(
			<ProjectCard
				project={mockProject}
				onOpen={mockOnOpen}
				onDelete={mockOnDelete}
				onRename={mockOnRename}
			/>,
		);

		// Should show date in format like "Dec 25, 2024"
		expect(screen.getByText(/Dec 25.*2024/)).toBeInTheDocument();
	});
});

describe("CreateProjectDialog", () => {
	const mockOnCreate = vi.fn();
	const mockOnClose = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should not render when isOpen is false", () => {
		const { container } = render(
			<CreateProjectDialog
				isOpen={false}
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		expect(container.firstChild).toBeNull();
	});

	it("should render dialog when isOpen is true", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		expect(screen.getByText("New Project")).toBeInTheDocument();
		expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
		expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
	});

	it("should call onCreate with name and description when form is submitted", async () => {
		const user = userEvent.setup();
		mockOnCreate.mockResolvedValue(undefined);

		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/);
		const descInput = screen.getByLabelText(/Description/);

		await user.type(nameInput, "My New Project");
		await user.type(descInput, "This is a description");

		const submitButton = screen.getByRole("button", { name: "Create Project" });
		await user.click(submitButton);

		expect(mockOnCreate).toHaveBeenCalledWith(
			"My New Project",
			"This is a description",
		);
	});

	it("should call onCreate with only name when description is empty", async () => {
		const user = userEvent.setup();
		mockOnCreate.mockResolvedValue(undefined);

		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/);
		await user.type(nameInput, "Test Project");

		const submitButton = screen.getByRole("button", { name: "Create Project" });
		await user.click(submitButton);

		expect(mockOnCreate).toHaveBeenCalledWith("Test Project", undefined);
	});

	it("should disable submit button when name is empty", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const submitButton = screen.getByRole("button", { name: "Create Project" });
		expect(submitButton).toBeDisabled();
	});

	it("should disable submit button when isCreating is true", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
				isCreating
			/>,
		);

		const submitButton = screen.getByRole("button", { name: "Creating..." });
		expect(submitButton).toBeDisabled();
	});

	it("should call onClose when cancel button is clicked", async () => {
		const user = userEvent.setup();
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const cancelButton = screen.getByRole("button", { name: "Cancel" });
		await user.click(cancelButton);

		expect(mockOnClose).toHaveBeenCalled();
	});

	it("should call onClose when backdrop is clicked", async () => {
		const user = userEvent.setup();
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		// The backdrop is the fixed overlay div with the dialog inside
		// Click outside the dialog content (on the backdrop)
		const backdrop = document.querySelector(".fixed.inset-0") as HTMLElement;
		expect(backdrop).toBeInTheDocument();

		if (backdrop) {
			await user.click(backdrop);
			expect(mockOnClose).toHaveBeenCalled();
		}
	});

	it("should show character count for name", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		expect(screen.getByText("0/100 characters")).toBeInTheDocument();
	});

	it("should show character count for description", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		// Two instances of character count (name and description)
		const counts = screen.getAllByText(/characters/);
		expect(counts).toHaveLength(2);
	});

	it("should update character count when typing", async () => {
		const user = userEvent.setup();
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/);
		await user.type(nameInput, "Test");

		expect(screen.getByText("4/100 characters")).toBeInTheDocument();
	});

	it("should enforce max length on name input", async () => {
		const user = userEvent.setup();
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
		await user.type(nameInput, "a".repeat(150));

		// Input should be limited to 100 characters
		expect(nameInput.value.length).toBeLessThanOrEqual(100);
	});

	it("should enforce max length on description textarea", async () => {
		const user = userEvent.setup();
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const descInput = screen.getByLabelText(
			/Description/,
		) as HTMLTextAreaElement;
		await user.type(descInput, "a".repeat(1500));

		// Input should be limited to 1000 characters
		expect(descInput.value.length).toBeLessThanOrEqual(1000);
	});

	it("should focus name input when dialog opens", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/);
		expect(nameInput).toHaveFocus();
	});

	it("should reset form when dialog closes and reopens", async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/) as HTMLInputElement;
		await user.type(nameInput, "Test Project");

		// Close dialog
		rerender(
			<CreateProjectDialog
				isOpen={false}
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		// Reopen dialog
		rerender(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		// Form should be reset
		const nameInputAfter = screen.getByLabelText(/Name/) as HTMLInputElement;
		expect(nameInputAfter.value).toBe("");
	});
});

describe("CreateProjectDialog accessibility", () => {
	const mockOnCreate = vi.fn();
	const mockOnClose = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should have proper ARIA attributes", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAttribute("aria-labelledby", "create-project-title");
	});

	it("should have close button with aria-label", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const closeButton = screen.getByRole("button", { name: "Close" });
		expect(closeButton).toBeInTheDocument();
	});

	it("should mark name input as required", () => {
		render(
			<CreateProjectDialog
				isOpen
				onClose={mockOnClose}
				onCreate={mockOnCreate}
			/>,
		);

		const nameInput = screen.getByLabelText(/Name/);
		expect(nameInput).toBeRequired();
	});
});
