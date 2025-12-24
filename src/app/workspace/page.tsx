"use client";

import { useState } from "react";
import {
	CanvasLayout,
	FloatingToolbar,
	InspectorPanel,
	type InspectorTab,
	type ToolMode,
	TopHeader,
} from "@/components/layout";

export default function WorkspacePage() {
	const [toolMode, setToolMode] = useState<ToolMode>("select");
	const [inspectorOpen, setInspectorOpen] = useState(false);
	const [inspectorTab, setInspectorTab] = useState<InspectorTab>("thread");
	const [saveStatus, _setSaveStatus] = useState<"saving" | "saved" | "unsaved">(
		"saved",
	);

	const handleAddNode = () => {
		console.log("Add node clicked");
		// TODO: Implement node creation in UI-003
	};

	const handleLayout = () => {
		console.log("Auto layout clicked");
		// TODO: Implement auto layout in UI-002
	};

	const handleBack = () => {
		console.log("Back to dashboard");
		// TODO: Navigate to dashboard in UI-007
	};

	const handleShare = () => {
		console.log("Share clicked");
	};

	const handleExport = () => {
		console.log("Export clicked");
	};

	const handleSettings = () => {
		console.log("Settings clicked");
	};

	return (
		<CanvasLayout
			header={
				<TopHeader
					projectName="My MindFlow Project"
					onBack={handleBack}
					saveStatus={saveStatus}
					rightContent={
						<>
							<button
								type="button"
								className="px-3 py-1.5 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-sm font-medium whitespace-nowrap"
								onClick={handleShare}
							>
								Share
							</button>
							<button
								type="button"
								className="px-3 py-1.5 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-sm font-medium whitespace-nowrap"
								onClick={handleExport}
							>
								Export
							</button>
							<button
								type="button"
								className="px-3 py-1.5 border-0 bg-transparent text-slate-500 cursor-pointer rounded-md hover:bg-slate-200/60 hover:text-slate-800 transition-all duration-120 text-sm font-medium whitespace-nowrap"
								onClick={handleSettings}
							>
								Settings
							</button>
						</>
					}
				/>
			}
			toolbar={
				<FloatingToolbar
					mode={toolMode}
					onModeChange={setToolMode}
					onAddNode={handleAddNode}
					onLayout={handleLayout}
				/>
			}
			inspector={
				<InspectorPanel
					activeTab={inspectorTab}
					onTabChange={setInspectorTab}
					onClose={() => setInspectorOpen(false)}
					threadContent={
						<div className="p-4">
							<p className="text-sm text-slate-600">
								Thread view will be implemented in UI-004.
							</p>
						</div>
					}
					propertiesContent={
						<div className="p-4">
							<p className="text-sm text-slate-600">
								Node properties will be displayed here.
							</p>
						</div>
					}
				/>
			}
			inspectorOpen={inspectorOpen}
		>
			{/* Canvas Content - Placeholder for Infinite Canvas (UI-002) */}
			<div className="flex items-center justify-center w-full h-full">
				<div className="text-center">
					<p className="text-lg text-slate-600 font-medium mb-2">
						MindFlow Canvas
					</p>
					<p className="text-sm text-slate-400">
						Infinite canvas will be implemented in UI-002
					</p>
					<button
						type="button"
						className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
						onClick={() => setInspectorOpen(true)}
					>
						Open Inspector Panel
					</button>
				</div>
			</div>
		</CanvasLayout>
	);
}
