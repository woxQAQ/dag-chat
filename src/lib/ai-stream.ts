/**
 * AI-001: AI Streaming Service
 *
 * Integrates Vercel AI SDK for streaming LLM responses.
 * Supports multiple providers (DeepSeek, Anthropic, OpenAI).
 *
 * Key features:
 * - Streaming text generation for real-time UX
 * - Context-aware responses using conversation history
 * - Automatic provider selection based on environment
 * - Error handling and retry logic
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// ============================================================================
// Configuration
// ============================================================================

export type AIProvider = "deepseek" | "anthropic" | "openai";

export type CoreMessage = {
	role: "system" | "user" | "assistant" | "SYSTEM" | "USER" | "ASSISTANT";
	content: string;
};

export type StreamChatInput = {
	/**
	 * Conversation history messages in AI SDK format
	 */
	messages: CoreMessage[];

	/**
	 * AI provider to use (defaults to deepseek)
	 */
	provider?: AIProvider;

	/**
	 * Model name override (optional, uses env default if not specified)
	 */
	model?: string;

	/**
	 * Maximum tokens to generate
	 */
	maxTokens?: number;

	/**
	 * Temperature for response randomness (0-1)
	 */
	temperature?: number;
};

export type StreamChatResult = {
	/**
	 * The text stream from the AI model
	 */
	toStreamResponse: () => Response;

	/**
	 * Full text accumulated (for testing/debugging)
	 */
	text: Promise<string>;

	/**
	 * Usage statistics (tokens in/out)
	 */
	usage: Promise<{
		promptTokens: number;
		completionTokens: number;
	}>;
};

// ============================================================================
// Provider Factory
// ============================================================================

/**
 * Creates an AI model instance based on the provider.
 * Supports DeepSeek, Anthropic, and OpenAI.
 */
function createAIModel(provider: AIProvider, model?: string) {
	switch (provider) {
		case "deepseek": {
			const apiKey = process.env.DEEPSEEK_API_KEY;
			if (!apiKey) {
				throw new Error("DEEPSEEK_API_KEY is not set");
			}
			const deepseek = createDeepSeek({
				baseURL: process.env.DEEPSEEK_BASE_URL,
				apiKey,
			});
			return deepseek(model || process.env.DEEPSEEK_MODEL || "deepseek-chat");
		}

		case "anthropic": {
			const apiKey = process.env.ANTHROPIC_API_KEY;
			if (!apiKey) {
				throw new Error("ANTHROPIC_API_KEY is not set");
			}
			const anthropic = createAnthropic({
				apiKey,
			});
			return anthropic(model || "claude-3-5-sonnet-20241022");
		}

		case "openai": {
			const apiKey = process.env.OPENAI_API_KEY;
			if (!apiKey) {
				throw new Error("OPENAI_API_KEY is not set");
			}
			const openai = createOpenAI({
				apiKey,
			});
			return openai(model || "gpt-4-turbo");
		}

		default:
			throw new Error(`Unsupported AI provider: ${provider}`);
	}
}

// ============================================================================
// Streaming Operations
// ============================================================================

/**
 * Streams a chat response from the AI model.
 *
 * This is the main entry point for AI streaming in the application.
 * Use this in API routes to get real-time streaming responses.
 *
 * @param input - Chat parameters including messages and provider
 * @returns StreamChatResult with streaming response and metadata
 *
 * @example
 * ```ts
 * // In an API route:
 * const result = await streamChat({
 *   messages: [
 *     { role: "user", content: "Hello!" }
 *   ],
 *   provider: "deepseek"
 * });
 *
 * return result.toStreamResponse();
 * ```
 */
export async function streamChat(
	input: StreamChatInput,
): Promise<StreamChatResult> {
	const {
		messages,
		provider = "deepseek",
		model,
		maxTokens = 4096,
		temperature = 0.7,
	} = input;

	// Validate messages
	if (!messages || messages.length === 0) {
		throw new Error("Messages array is required and cannot be empty");
	}

	// Get the last message to ensure it's from user
	const lastMessage = messages[messages.length - 1];
	if (lastMessage.role !== "user") {
		throw new Error("Last message must be from user role");
	}

	// Create the AI model
	const aiModel = createAIModel(provider, model);

	// Stream the response using Vercel AI SDK
	const result = streamText({
		model: aiModel,
		messages: messages as Array<{
			role: "system" | "user" | "assistant";
			content: string;
		}>,
		...(maxTokens !== undefined && { maxTokens }),
		...(temperature !== undefined && { temperature }),
	});

	// Return the streaming result
	return {
		toStreamResponse: () => result.toTextStreamResponse(),
		text: Promise.resolve(result.text),
		usage: (async () => {
			const usage = await result.usage;
			return {
				promptTokens:
					(usage as unknown as { promptTokens: number }).promptTokens ?? 0,
				completionTokens:
					(usage as unknown as { completionTokens: number }).completionTokens ??
					0,
			};
		})(),
	};
}

/**
 * Streams a chat response with automatic node persistence.
 *
 * This is a convenience function that combines AI streaming with node creation.
 * It creates an ASSISTANT node and streams content into it.
 *
 * @param input - Chat parameters plus node creation info
 * @returns StreamChatResult with streaming response
 *
 * @example
 * ```ts
 * const result = await streamChatWithNode({
 *   messages: [{ role: "user", content: "Explain React" }],
 *   projectId: "project-uuid",
 *   parentId: "user-node-uuid",
 *   positionX: 100,
 *   positionY: 200
 * });
 * ```
 */
export async function streamChatWithNode(
	input: StreamChatInput & {
		projectId: string;
		parentId: string;
		positionX?: number;
		positionY?: number;
		metadata?: unknown;
	},
): Promise<StreamChatResult & { nodeId: string }> {
	const { messages, projectId, parentId, positionX, positionY, metadata } =
		input;

	console.log("[streamChatWithNode] Creating assistant node...", {
		projectId,
		parentId,
		positionX,
		positionY,
		messagesCount: messages.length,
	});

	// Import dynamically to avoid circular dependency
	const { createNode } = await import("./node-crud");

	// Create a placeholder ASSISTANT node first
	const node = await createNode({
		projectId,
		parentId,
		role: "ASSISTANT",
		content: "",
		positionX: positionX ?? 0,
		positionY: positionY ?? 0,
		metadata: {
			...(typeof metadata === "object" && metadata !== null ? metadata : {}),
			streaming: true,
			provider: input.provider || "deepseek",
		},
	});

	console.log("[streamChatWithNode] Assistant node created:", node.id);

	// Stream the response
	console.log("[streamChatWithNode] Starting AI stream...");
	const result = await streamChat({
		messages,
		provider: input.provider,
		model: input.model,
		maxTokens: input.maxTokens,
		temperature: input.temperature,
	});

	console.log(
		"[streamChatWithNode] AI stream started, will update node on completion",
	);

	// Accumulate full text and update node when complete
	result.text
		.then(async (fullText) => {
			console.log(
				"[streamChatWithNode] Stream complete, updating node content:",
				{
					nodeId: node.id,
					contentLength: fullText.length,
				},
			);
			const { updateNodeContent } = await import("./node-crud");
			await updateNodeContent(node.id, {
				content: fullText,
				metadata: {
					...(typeof metadata === "object" && metadata !== null
						? metadata
						: {}),
					streaming: false,
					provider: input.provider || "deepseek",
				},
			});
			console.log("[streamChatWithNode] Node content updated successfully");
		})
		.catch((error) => {
			console.error("[streamChatWithNode] Error updating node content:", error);
		});

	return {
		...result,
		nodeId: node.id,
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validates that the required environment variables are set.
 * Throws an error if configuration is missing.
 */
export function validateAIConfig(provider: AIProvider): void {
	switch (provider) {
		case "deepseek":
			if (!process.env.DEEPSEEK_API_KEY) {
				throw new Error("DEEPSEEK_API_KEY environment variable is required");
			}
			break;
		case "anthropic":
			if (!process.env.ANTHROPIC_API_KEY) {
				throw new Error("ANTHROPIC_API_KEY environment variable is required");
			}
			break;
		case "openai":
			if (!process.env.OPENAI_API_KEY) {
				throw new Error("OPENAI_API_KEY environment variable is required");
			}
			break;
	}
}

/**
 * Gets the default AI provider from environment.
 * Defaults to "deepseek" if not specified.
 */
export function getDefaultProvider(): AIProvider {
	const provider = process.env.AI_PROVIDER as AIProvider;
	if (provider && ["deepseek", "anthropic", "openai"].includes(provider)) {
		return provider;
	}
	return "deepseek";
}
