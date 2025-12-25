"use client";

import {
	addEdge,
	type Edge,
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { type GraphData, getProjectGraphAction } from "@/app/nodes/actions";
import {
	EmptyStateCanvas,
	InfiniteCanvas,
	PromptInputDialog,
} from "@/components/canvas";
import {
	CanvasLayout,
	FloatingToolbar,
	InspectorPanel,
	type InspectorTab,
	type ToolMode,
	TopHeader,
} from "@/components/layout";
import { type MindFlowNode, nodeTypes } from "@/components/nodes";
import { useRootNodeCreation } from "@/hooks/use-root-creation";

function WorkspaceContent() {
	const searchParams = useSearchParams();
	const projectId = searchParams.get("project") || "";

	// Tool and inspector state (existing)
	const [toolMode, setToolMode] = useState<ToolMode>("select");
	const [inspectorOpen, setInspectorOpen] = useState(false);
	const [inspectorTab, setInspectorTab] = useState<InspectorTab>("thread");
	const [saveStatus, _setSaveStatus] = useState<"saving" | "saved" | "unsaved">(
		"saved",
	);

	// NEW: Graph data state
	const [nodes, setNodes, onNodesChange] = useNodesState<MindFlowNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [reactFlowInstance, setReactFlowInstance] =
		useState<ReactFlowInstance | null>(null);
	const [graphLoaded, setGraphLoaded] = useState(false);
	const [projectExists, setProjectExists] = useState(true);

	// NEW: Prompt dialog state
	const [showPromptDialog, setShowPromptDialog] = useState(false);
	const [pendingPosition, setPendingPosition] = useState<{
		x: number;
		y: number;
		content: string;
	} | null>(null);

	// NEW: Fetch graph data on mount
	useEffect(() => {
		const loadGraph = async () => {
			// Handle missing project ID
			if (!projectId) {
				setProjectExists(false);
				setGraphLoaded(true);
				return;
			}

			try {
				const result = await getProjectGraphAction(projectId);

				if (!result.success || !result.data) {
					// Check if error is about project not found vs other errors
					if (
						result.error?.includes("not found") ||
						result.error?.includes("Project")
					) {
						setProjectExists(false);
					} else {
						// Only log unexpected errors, not "project not found" (expected with placeholder IDs)
						console.error("Failed to load graph:", result.error);
					}
					setGraphLoaded(true);
					return;
				}

				const graph = result.data;

				// Convert GraphNode[] to ReactFlow Node[]
				const flowNodes: MindFlowNode[] = graph.nodes.map((node) => ({
					id: node.id,
					type: node.role.toLowerCase(), // "user" or "assistant"
					position: { x: node.positionX, y: node.positionY },
					data: {
						id: node.id,
						role: node.role,
						content: node.content,
						isEditing: false,
						isStreaming: false,
						createdAt: node.createdAt,
						metadata: (node.metadata || {}) as Record<string, unknown>,
					},
				}));

				// Convert GraphEdge[] to ReactFlow Edge[]
				const flowEdges: Edge[] = graph.edges.map((edge) => ({
					id: edge.id,
					source: edge.source,
					target: edge.target,
					type: "smoothstep",
					animated: false,
				}));

				setNodes(flowNodes);
				setEdges(flowEdges);
				setProjectExists(true);
				setGraphLoaded(true);
			} catch (error) {
				console.error("Failed to load graph:", error);
				setProjectExists(false);
				setGraphLoaded(true);
			}
		};

		loadGraph();
	}, [projectId, setNodes, setEdges]);

	// NEW: Root node creation hook
	const { isCreating, createRootNode } = useRootNodeCreation({
		projectId,
		onNodeCreated: (nodeId, x, y) => {
			// Add new node to ReactFlow state
			const newNode: MindFlowNode = {
				id: nodeId,
				type: "user",
				position: { x, y },
				data: {
					id: nodeId,
					role: "USER",
					content: pendingPosition?.content || "",
					isEditing: false,
					isStreaming: false,
					createdAt: new Date(),
					metadata: { isRoot: true },
				},
			};
			setNodes((prev) => [...prev, newNode]);
			setPendingPosition(null);
		},
		onError: (error) => {
			// TODO: Show toast notification
			console.error("Root creation error:", error);
		},
	});

	// NEW: Handle double-click on canvas - opens prompt dialog
	const onPaneDoubleClick = useCallback(
		(event: React.MouseEvent) => {
			console.log("Double-click detected!", {
				isCreating,
				nodesLength: nodes.length,
				projectExists,
				reactFlowInstanceReady: !!reactFlowInstance,
				projectId,
			});

			// Prevent creation if already creating
			if (isCreating) {
				console.log("Already creating a node");
				return;
			}

			// Prevent if project already has nodes
			if (nodes.length > 0) {
				console.log(
					"Project already has nodes. Use branching to create new nodes.",
				);
				return;
			}

			// Get ReactFlow instance for coordinate conversion
			if (!reactFlowInstance) {
				console.error("ReactFlow instance not ready");
				return;
			}

			// Use ReactFlow's built-in screen to flow position conversion
			const position = reactFlowInstance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			console.log("Opening prompt dialog for position:", position);

			// Store position and open dialog
			setPendingPosition({ x: position.x, y: position.y, content: "" });
			setShowPromptDialog(true);
		},
		[isCreating, nodes.length, reactFlowInstance, projectExists, projectId],
	);

	// NEW: Handle prompt submission from dialog
	const handlePromptSubmit = useCallback(
		async (prompt: string) => {
			if (!pendingPosition) return;

			console.log("Creating root node with prompt:", {
				prompt,
				position: pendingPosition,
			});

			// Update pending position with content
			setPendingPosition({ ...pendingPosition, content: prompt });

			// Create root node with the prompt content
			await createRootNode(prompt, pendingPosition.x, pendingPosition.y);

			// Close dialog
			setShowPromptDialog(false);
		},
		[pendingPosition, createRootNode],
	);

	// NEW: Handle prompt dialog close
	const handlePromptClose = useCallback(() => {
		setShowPromptDialog(false);
		setPendingPosition(null);
	}, []);

	// NEW: Handle connections (for future use)
	const onConnect = useCallback(
		(params: any) => {
			setEdges((eds) => addEdge(params, eds));
		},
		[setEdges],
	);

	// Existing handlers (unchanged)
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
		<>
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
				{/* Empty State Overlay */}
				<EmptyStateCanvas
					show={nodes.length === 0 && graphLoaded}
					message={
						projectExists
							? undefined
							: projectId
								? "Project not found. Please create a project first."
								: "No project selected. Please select a project from the dashboard."
					}
					onDoubleClick={projectExists ? onPaneDoubleClick : undefined}
				/>

				{/* Infinite Canvas with ReactFlow integration */}
				<InfiniteCanvas
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodesChange={onNodesChange as any}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onInit={setReactFlowInstance}
					backgroundVariant="dots"
					backgroundGap={24}
					showControls={false}
				/>
			</CanvasLayout>

			{/* Prompt Input Dialog */}
			<PromptInputDialog
				isOpen={showPromptDialog}
				onClose={handlePromptClose}
				onSubmit={handlePromptSubmit}
			/>
		</>
	);
}

// Wrapper component with Suspense boundary for useSearchParams
export default function WorkspacePage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center text-slate-400">
					Loading...
				</div>
			}
		>
			<WorkspaceContent />
		</Suspense>
	);
}
