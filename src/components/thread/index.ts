/**
 * UI-004: Thread View Components
 *
 * Linear conversation view for the Inspector Panel.
 *
 * Components:
 * - ThreadView: Main component with message list and input
 * - ThreadMessage: Individual message display
 * - ThreadInput: Message input area
 *
 * @example
 * ```tsx
 * import { ThreadView } from "@/components/thread";
 *
 * <ThreadView
 *   nodeId="node-uuid"
 *   projectId="project-uuid"
 *   onSendMessage={async (message, parentNodeId) => { ... }}
 * />
 * ```
 */

// Main components
export { ThreadView, ThreadViewServer } from "./ThreadView";
export { ThreadMessage } from "./ThreadMessage";
export { ThreadInput } from "./ThreadInput";

// Types
export type {
	ThreadMessage,
	ThreadMessageRole,
	ThreadViewProps,
	ThreadMessageProps,
	ThreadInputProps,
} from "./types";

// Re-export context builder types for convenience
export type { ContextMessage, ContextResult } from "@/lib/context-builder";
