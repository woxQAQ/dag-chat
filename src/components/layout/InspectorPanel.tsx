import type { ReactNode } from "react";

export type InspectorTab = "thread" | "properties";

export interface InspectorPanelProps {
	/**
	 * Currently active tab
	 */
	activeTab?: InspectorTab;

	/**
	 * Callback when tab changes
	 */
	onTabChange?: (tab: InspectorTab) => void;

	/**
	 * Thread tab content (linear conversation flow)
	 */
	threadContent?: ReactNode;

	/**
	 * Properties tab content (node metadata)
	 */
	propertiesContent?: ReactNode;

	/**
	 * Panel close handler
	 */
	onClose?: () => void;

	/**
	 * Additional CSS class name
	 */
	className?: string;
}

/**
 * InspectorPanel - Right slide-out panel for MindFlow workspace.
 *
 * Features:
 * - Thread tab: Shows linear conversation flow from Root to selected node
 * - Properties tab: Shows node metadata (created time, token count, model params)
 * - Smooth slide-in/slide-out animation
 * - Backdrop overlay
 * - Close button
 *
 * @example
 * ```tsx
 * <InspectorPanel
 *   activeTab="thread"
 *   onTabChange={(tab) => setActiveTab(tab)}
 *   threadContent={<ThreadView messages={messages} />}
 *   propertiesContent={<NodeProperties node={selectedNode} />}
 * />
 * ```
 */
export function InspectorPanel({
	activeTab = "thread",
	onTabChange,
	threadContent,
	propertiesContent,
	onClose,
	className = "",
}: InspectorPanelProps) {
	return (
		<aside
			className={`flex flex-col h-full bg-white border-l border-slate-200 shadow-lg ${className}`}
		>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
				<div className="flex gap-1">
					<button
						type="button"
						className={`px-3 py-1.5 text-sm font-medium border-0 rounded-md cursor-pointer transition-colors ${
							activeTab === "thread"
								? "bg-blue-50 text-blue-600"
								: "bg-transparent text-slate-500 hover:bg-slate-100"
						}`}
						onClick={() => onTabChange?.("thread")}
					>
						Thread
					</button>
					<button
						type="button"
						className={`px-3 py-1.5 text-sm font-medium border-0 rounded-md cursor-pointer transition-colors ${
							activeTab === "properties"
								? "bg-blue-50 text-blue-600"
								: "bg-transparent text-slate-500 hover:bg-slate-100"
						}`}
						onClick={() => onTabChange?.("properties")}
					>
						Properties
					</button>
				</div>

				<button
					type="button"
					className="flex items-center justify-center w-8 h-8 border-0 bg-transparent text-slate-400 cursor-pointer rounded-md hover:bg-slate-100 hover:text-slate-600 transition-colors"
					onClick={onClose}
					aria-label="Close panel"
				>
					<svg
						aria-hidden="true"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M18 6L6 18M6 6l12 12" />
					</svg>
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto">
				{activeTab === "thread" && threadContent}
				{activeTab === "properties" && propertiesContent}

				{/* Empty state */}
				{!threadContent && !propertiesContent && (
					<div className="flex items-center justify-center h-full px-4">
						<p className="text-sm text-slate-400">
							{activeTab === "thread"
								? "Select a node to view conversation thread"
								: "Select a node to view properties"}
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}
