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

// Re-export context builder types for convenience
export type { ContextMessage, ContextResult } from "@/lib/context-builder";
export { ThreadInput } from "./ThreadInput";
export { ThreadMessage } from "./ThreadMessage";
// Main components
export { ThreadView, ThreadViewServer } from "./ThreadView";
// Types
// Export ThreadMessage data type as ThreadMessageData to avoid naming conflict
export type {
	ThreadInputProps,
	ThreadMessage as ThreadMessageData,
	ThreadMessageProps,
	ThreadMessageRole,
	ThreadViewProps,
} from "./types";
