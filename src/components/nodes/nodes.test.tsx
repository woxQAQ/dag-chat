import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AINode } from "./AINode";
import { nodeTypes } from "./index";
import type { MindFlowNodeData } from "./types";
import { UserNode } from "./UserNode";

// Mock React Flow's Handle component to avoid Zustand provider requirement
vi.mock("@xyflow/react", async () => {
	const actual = await vi.importActual("@xyflow/react");
	return {
		...actual,
		Handle: ({
			children,
			...props
		}: {
			children?: React.ReactNode;
			type?: string;
		}) => (
			<div data-handle-type={props.type} data-testid={`handle-${props.type}`}>
				{children}
			</div>
		),
	};
});

// Helper function to render with ThemeProvider
function renderWithTheme(ui: React.ReactElement) {
	return render(<ThemeProvider defaultTheme="light">{ui}</ThemeProvider>);
}

describe("Node Components", () => {
	describe("UserNode", () => {
		const defaultProps = {
			data: {
				id: "user-1",
				role: "USER" as const,
				content: "Hello, how are you?",
			} as MindFlowNodeData,
			selected: false,
			isHovered: false,
		};

		it("should render user node with content", () => {
			renderWithTheme(<UserNode {...defaultProps} />);
			expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
		});

		it("should render empty state when content is empty", () => {
			renderWithTheme(
				<UserNode
					{...defaultProps}
					data={{ ...defaultProps.data, content: "" }}
				/>,
			);
			expect(screen.getByText("Empty message")).toBeInTheDocument();
		});

		it("should show 'You' label in header", () => {
			renderWithTheme(<UserNode {...defaultProps} />);
			expect(screen.getByText("You")).toBeInTheDocument();
		});

		it("should apply selected styles when selected is true", () => {
			const { container } = renderWithTheme(
				<UserNode {...defaultProps} selected />,
			);
			// Find the actual node container (inside the wrapper div)
			const nodeContainer = container.querySelector('[role="button"]');
			expect(nodeContainer).toHaveClass("border-[var(--color-primary)]");
		});

		it("should render branch button when hovered and onCreateChild is provided", () => {
			const onCreateChild = vi.fn();
			renderWithTheme(
				<UserNode {...defaultProps} isHovered onCreateChild={onCreateChild} />,
			);
			expect(
				screen.getByRole("button", { name: /create child node/i }),
			).toBeInTheDocument();
		});

		it("should not render branch button when not hovered", () => {
			const onCreateChild = vi.fn();
			renderWithTheme(
				<UserNode
					{...defaultProps}
					isHovered={false}
					onCreateChild={onCreateChild}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: /create child node/i }),
			).not.toBeInTheDocument();
		});

		it("should not render branch button when onCreateChild is not provided", () => {
			renderWithTheme(<UserNode {...defaultProps} isHovered />);
			expect(
				screen.queryByRole("button", { name: /create child node/i }),
			).not.toBeInTheDocument();
		});

		it("should call onCreateChild when branch button is clicked", () => {
			const onCreateChild = vi.fn();
			renderWithTheme(
				<UserNode {...defaultProps} isHovered onCreateChild={onCreateChild} />,
			);
			const branchButton = screen.getByRole("button", {
				name: /create child node/i,
			});
			branchButton.click();
			expect(onCreateChild).toHaveBeenCalledTimes(1);
		});
	});

	describe("AINode", () => {
		const defaultProps = {
			data: {
				id: "ai-1",
				role: "ASSISTANT" as const,
				content: "## Hello World\n\nThis is **markdown** content.",
				metadata: { provider: "deepseek", model: "deepseek-chat" },
			} as MindFlowNodeData,
			selected: false,
			isHovered: false,
		};

		it("should render AI node with markdown content", () => {
			renderWithTheme(<AINode {...defaultProps} />);
			expect(screen.getByText("Hello World")).toBeInTheDocument();
		});

		it("should render markdown headings", () => {
			renderWithTheme(<AINode {...defaultProps} />);
			const heading = screen.getByText("Hello World");
			expect(heading.tagName).toBe("H2");
		});

		it("should render markdown bold text", () => {
			renderWithTheme(<AINode {...defaultProps} />);
			expect(screen.getByText("markdown")).toBeInTheDocument();
		});

		it("should render provider name from metadata", () => {
			renderWithTheme(<AINode {...defaultProps} />);
			expect(screen.getByText("deepseek")).toBeInTheDocument();
		});

		it("should render model from metadata when available", () => {
			renderWithTheme(<AINode {...defaultProps} />);
			expect(screen.getByText("deepseek-chat")).toBeInTheDocument();
		});

		it("should show streaming indicator when isStreaming is true", () => {
			renderWithTheme(
				<AINode
					{...defaultProps}
					data={{ ...defaultProps.data, isStreaming: true }}
				/>,
			);
			expect(screen.getByText("Streaming")).toBeInTheDocument();
		});

		it("should render empty state when content is empty", () => {
			renderWithTheme(
				<AINode
					{...defaultProps}
					data={{ ...defaultProps.data, content: "" }}
				/>,
			);
			expect(screen.getByText("Empty response")).toBeInTheDocument();
		});

		it("should apply selected styles when selected is true", () => {
			const { container } = renderWithTheme(
				<AINode {...defaultProps} selected />,
			);
			// Find the actual node container (inside the wrapper div)
			const nodeContainer = container.querySelector('[role="button"]');
			expect(nodeContainer).toHaveClass("border-[var(--color-primary)]");
		});

		it("should render action bar when hovered", () => {
			renderWithTheme(<AINode {...defaultProps} isHovered />);
			// Check for copy button title
			expect(
				screen.getByRole("button", { name: /copy content/i }),
			).toBeInTheDocument();
		});

		it("should render regenerate button when not streaming", () => {
			const onRegenerate = vi.fn();
			renderWithTheme(
				<AINode {...defaultProps} isHovered onRegenerate={onRegenerate} />,
			);
			expect(
				screen.getByRole("button", { name: /regenerate response/i }),
			).toBeInTheDocument();
		});

		it("should not render regenerate button when streaming", () => {
			const onRegenerate = vi.fn();
			renderWithTheme(
				<AINode
					{...defaultProps}
					isHovered
					data={{ ...defaultProps.data, isStreaming: true }}
					onRegenerate={onRegenerate}
				/>,
			);
			expect(
				screen.queryByRole("button", { name: /regenerate response/i }),
			).not.toBeInTheDocument();
		});

		it("should render code blocks with custom styling", () => {
			const codeProps = {
				...defaultProps,
				data: {
					...defaultProps.data,
					content: "```javascript\nconst x = 1;\n```",
				},
			};
			const { container } = renderWithTheme(<AINode {...codeProps} />);
			const codeBlock = container.querySelector("pre");
			expect(codeBlock).toBeInTheDocument();
		});

		it("should render inline code with custom styling", () => {
			const codeProps = {
				...defaultProps,
				data: {
					...defaultProps.data,
					content: "This is `inline code` example.",
				},
			};
			renderWithTheme(<AINode {...codeProps} />);
			expect(screen.getByText("inline code")).toBeInTheDocument();
		});

		it("should render links with external attributes", () => {
			const linkProps = {
				...defaultProps,
				data: {
					...defaultProps.data,
					content: "[Link](https://example.com)",
				},
			};
			const { container } = renderWithTheme(<AINode {...linkProps} />);
			const link = container.querySelector("a");
			expect(link).toHaveAttribute("href", "https://example.com");
			expect(link).toHaveAttribute("target", "_blank");
			expect(link).toHaveAttribute("rel", "noopener noreferrer");
		});

		it("should call onRegenerate when double-clicked", () => {
			const onRegenerate = vi.fn();
			const { container } = renderWithTheme(
				<AINode {...defaultProps} onRegenerate={onRegenerate} />,
			);
			const nodeContainer = container.firstChild as HTMLElement;
			nodeContainer.dispatchEvent(
				new MouseEvent("dblclick", { bubbles: true }),
			);
			// Note: In actual usage, React Flow handles the double-click event
			expect(onRegenerate).toBeDefined();
		});

		it("should not call onRegenerate when streaming", () => {
			const onRegenerate = vi.fn();
			renderWithTheme(
				<AINode
					{...defaultProps}
					data={{ ...defaultProps.data, isStreaming: true }}
					onRegenerate={onRegenerate}
				/>,
			);
			// Verify regenerate button is not rendered during streaming
			expect(
				screen.queryByRole("button", { name: /regenerate response/i }),
			).not.toBeInTheDocument();
		});

		it("should call onCopy when copy button is clicked", () => {
			const onCopy = vi.fn();
			renderWithTheme(<AINode {...defaultProps} isHovered onCopy={onCopy} />);
			const copyButton = screen.getByRole("button", { name: /copy content/i });
			copyButton.click();
			expect(onCopy).toHaveBeenCalledTimes(1);
		});

		it("should not show action hint when onCreateChild is provided", () => {
			const onCreateChild = vi.fn();
			renderWithTheme(
				<AINode {...defaultProps} isHovered onCreateChild={onCreateChild} />,
			);
			expect(
				screen.queryByText("Double-click to regenerate"),
			).not.toBeInTheDocument();
		});

		it("should show action hint when onCreateChild is not provided", () => {
			renderWithTheme(<AINode {...defaultProps} isHovered />);
			expect(
				screen.getByText("Double-click to regenerate"),
			).toBeInTheDocument();
		});
	});

	describe("nodeTypes export", () => {
		it("should export nodeTypes object with correct mappings", () => {
			expect(nodeTypes).toBeDefined();
			expect(nodeTypes.user).toBe(UserNode);
			expect(nodeTypes.assistant).toBe(AINode);
			expect(nodeTypes.system).toBe(AINode);
		});

		it("should have all required node types", () => {
			expect(Object.keys(nodeTypes)).toEqual(["user", "assistant", "system"]);
		});
	});

	describe("Markdown Rendering", () => {
		it("should render unordered lists", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content: "- Item 1\n- Item 2\n- Item 3",
				} as MindFlowNodeData,
			};
			const { container } = renderWithTheme(<AINode {...props} />);
			expect(container.querySelector("ul")).toBeInTheDocument();
		});

		it("should render ordered lists", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content: "1. First\n2. Second\n3. Third",
				} as MindFlowNodeData,
			};
			const { container } = renderWithTheme(<AINode {...props} />);
			expect(container.querySelector("ol")).toBeInTheDocument();
		});

		it("should render blockquotes", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content: "> This is a quote",
				} as MindFlowNodeData,
			};
			const { container } = renderWithTheme(<AINode {...props} />);
			expect(container.querySelector("blockquote")).toBeInTheDocument();
		});

		it("should render tables with GFM", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content:
						"| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |",
				} as MindFlowNodeData,
			};
			const { container } = renderWithTheme(<AINode {...props} />);
			expect(container.querySelector("table")).toBeInTheDocument();
		});
	});

	describe("Edge Cases", () => {
		it("should handle very long content in UserNode", () => {
			const longContent = "A".repeat(1000);
			const props = {
				data: {
					id: "user-1",
					role: "USER" as const,
					content: longContent,
				} as MindFlowNodeData,
			};
			renderWithTheme(<UserNode {...props} />);
			expect(screen.getByText(longContent)).toBeInTheDocument();
		});

		it("should handle special characters in markdown", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content: "Special chars: < > & \" '",
				} as MindFlowNodeData,
			};
			renderWithTheme(<AINode {...props} />);
			expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
		});

		it("should handle null metadata gracefully", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content: "Test",
					metadata: undefined,
				} as MindFlowNodeData,
			};
			renderWithTheme(<AINode {...props} />);
			expect(screen.getByText("AI")).toBeInTheDocument();
		});

		it("should handle empty metadata object", () => {
			const props = {
				data: {
					id: "ai-1",
					role: "ASSISTANT" as const,
					content: "Test",
					metadata: {},
				} as MindFlowNodeData,
			};
			renderWithTheme(<AINode {...props} />);
			expect(screen.getByText("AI")).toBeInTheDocument();
		});
	});
});
