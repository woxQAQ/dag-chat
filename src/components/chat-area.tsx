import type { ReactNode } from "react";

export interface ChatAreaProps {
	children?: ReactNode;
}

/**
 * Main chat area component
 *
 * Displays the linear conversation flow for the currently selected path
 * Will integrate with Vercel AI SDK for streaming responses (UI-004)
 */
export function ChatArea({ children }: ChatAreaProps) {
	return (
		<main className="flex flex-1 flex-col">
			{/* Chat header - shows current conversation title */}
			<header className="flex h-14 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
				<h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
					New Conversation
				</h2>
			</header>

			{/* Messages area - will be populated with actual messages */}
			<div className="flex-1 overflow-y-auto">
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<p className="text-lg text-zinc-900 dark:text-zinc-50">
							Welcome to MindFlow
						</p>
						<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
							Start a conversation to begin exploring
						</p>
					</div>
				</div>
			</div>

			{/* Input area - will be implemented in UI-004 */}
			<div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
				<div className="mx-auto max-w-3xl">
					<div className="relative">
						<input
							type="text"
							placeholder="Type your message..."
							className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 pr-12 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500"
							disabled
						/>
						<button
							type="button"
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
							disabled
							aria-label="Send message"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<title>Send message</title>
								<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Child content slot */}
			{children}
		</main>
	);
}
