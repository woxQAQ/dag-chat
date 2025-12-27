"use client";

import {
	addEdge,
	type Connection,
	type Edge,
	type Node,
	type NodeTypes,
	type OnConnect,
	type OnEdgesChange,
	type OnNodesChange,
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { getProjectGraphAction } from "@/app/nodes/actions";
import { applyAutoLayoutAction } from "@/app/workspace/layout-actions";
import {
	EmptyStateCanvas,
	InfiniteCanvas,
	PromptInputDialog,
} from "@/components/canvas";
import {
	CanvasLayout,
	FloatingToolbar,
	InspectorPanel,
	type ToolMode,
	TopHeader,
} from "@/components/layout";
import { createEditableNode, type MindFlowNode } from "@/components/nodes";
import { ThreadView } from "@/components/thread";
import {
	NodeEditingProvider,
	useNodeEditingContext,
} from "@/contexts/NodeEditingContext";
import { useNodeEditing } from "@/hooks/use-node-editing";
import { useNodeForking } from "@/hooks/use-node-forking";
import { useNodeStream } from "@/hooks/use-node-stream";
import { usePathHighlightWithInspector } from "@/hooks/use-path-highlight";
import { useRootNodeCreation } from "@/hooks/use-root-creation";
import { useWorkspaceNavigation } from "@/hooks/use-workspace-navigation";

// ============================================================================
// Stable Node Types - Module level for performance
// ============================================================================

/**
 * Stable node types object for React Flow
 *
 * Moved to module level to prevent recreation on every render.
 * The createEditableNode() factory function creates stable components
 * that receive callbacks via NodeEditingContext, so the nodeTypes
 * object itself can be a constant reference.
 *
 * Performance impact: Reduces unnecessary ReactFlow re-renders
 */
const STABLE_NODE_TYPES: NodeTypes = {
	user: createEditableNode(),
	assistant: createEditableNode(),
	system: createEditableNode(),
};

// ============================================================================
// Canvas Wrapper Component with Edit Handling
// ============================================================================

/**
 * CanvasWithEditHandler - Wraps InfiniteCanvas with edit mode handling
 *
 * This component is rendered inside the NodeEditingProvider and can access
 * the context to handle pane clicks for exiting edit mode.
 *
 * When clicking outside the node (on the canvas), the edit mode is exited
 * and changes are saved.
 */
function CanvasWithEditHandler({
	nodes,
	edges,
	nodeTypes,
	onNodesChange,
	onEdgesChange,
	onConnect,
	onSelectionChange,
	onNodeMouseEnter,
	onNodeMouseLeave,
	onInit,
}: {
	nodes: MindFlowNode[];
	edges: Edge[];
	nodeTypes: NodeTypes;
	onNodesChange: OnNodesChange<MindFlowNode>;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	onSelectionChange: (params: { nodes: readonly { id: string }[] }) => void;
	onNodeMouseEnter?: (event: React.MouseEvent, node: Node) => void;
	onNodeMouseLeave?: () => void;
	onInit: (instance: ReactFlowInstance | null) => void;
}) {
	const { stopEditing } = useNodeEditingContext();

	// Handle pane click to exit edit mode and save changes
	const handlePaneClick = useCallback(() => {
		// Save changes when exiting edit mode by clicking outside
		stopEditing(true);
	}, [stopEditing]);

	return (
		<InfiniteCanvas
			nodes={nodes}
			edges={edges}
			nodeTypes={nodeTypes}
			// biome-ignore lint/suspicious/noExplicitAny: ReactFlow onNodesChange type compatibility with MindFlowNode
			onNodesChange={onNodesChange as any}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			onSelectionChange={onSelectionChange}
			onNodeMouseEnter={onNodeMouseEnter}
			onNodeMouseLeave={onNodeMouseLeave}
			onInit={onInit}
			onPaneClick={handlePaneClick}
			backgroundVariant="dots"
			backgroundGap={24}
			showControls={false}
		/>
	);
}

// ============================================================================
// Workspace Content Component
// ============================================================================

function WorkspaceContent() {
	const searchParams = useSearchParams();
	const projectId = searchParams.get("project") || "";

	// Tool and inspector state (existing)
	const [toolMode, setToolMode] = useState<ToolMode>("select");
	const [inspectorOpen, setInspectorOpen] = useState(false);
	// UI-004: Selected node ID for ThreadView
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	// UI-NEW-002: Track hovered node for showing branch button
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

	// UI-WORKSPACE-005: Workspace navigation
	const { handleBack } = useWorkspaceNavigation({
		projectId,
	});

	// NEW: Graph data state
	const [nodes, setNodes, onNodesChange] = useNodesState<MindFlowNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [reactFlowInstance, setReactFlowInstance] =
		useState<ReactFlowInstance | null>(null);
	const [graphLoaded, setGraphLoaded] = useState(false);
	const [projectExists, setProjectExists] = useState(true);

	// NEW: Prompt dialog state for root node creation
	const [showPromptDialog, setShowPromptDialog] = useState(false);
	const [pendingPosition, setPendingPosition] = useState<{
		x: number;
		y: number;
		content: string;
	} | null>(null);

	// NEW: Branch dialog state for creating child nodes
	const [showBranchDialog, setShowBranchDialog] = useState(false);
	const [branchParentId, setBranchParentId] = useState<string | null>(null);

	// NEW: Fetch graph data function (extracted for use in multiple places)
	const loadGraph = useCallback(async () => {
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
	}, [projectId, setNodes, setEdges]);

	// NEW: Fetch graph data on mount
	useEffect(() => {
		loadGraph();
	}, [loadGraph]);

	// NEW: Root node creation hook
	const { isCreating, createRootNode } = useRootNodeCreation({
		projectId,
		onUserNodeCreated: (nodeId, x, y, content) => {
			// Add user node to ReactFlow state with content from callback
			const userNode: MindFlowNode = {
				id: nodeId,
				type: "user",
				position: { x, y },
				data: {
					id: nodeId,
					role: "USER",
					content: content, // Use content from callback parameter
					isEditing: false,
					isStreaming: false,
					createdAt: new Date(),
					metadata: { isRoot: true },
				},
			};
			setNodes((prev) => [...prev, userNode]);
		},
		onAssistantNodeCreated: (nodeId, x, y, parentNodeId) => {
			console.log("[page.tsx] onAssistantNodeCreated called:", {
				nodeId,
				x,
				y,
				parentNodeId,
			});

			// Add assistant node to ReactFlow state initially empty
			const assistantNode: MindFlowNode = {
				id: nodeId,
				type: "assistant",
				position: { x, y },
				data: {
					id: nodeId,
					role: "ASSISTANT",
					content: "",
					isEditing: false,
					isStreaming: true,
					createdAt: new Date(),
					metadata: { streaming: true },
				},
			};
			setNodes((prev) => [...prev, assistantNode]);
			console.log("[page.tsx] Assistant node added to state");

			// Add edge from user node to assistant node
			const edgeId = `${parentNodeId}-${nodeId}`;
			setEdges((prev) => {
				const edgeExists = prev.some((e) => e.id === edgeId);
				if (edgeExists) return prev;
				return [
					...prev,
					{
						id: edgeId,
						source: parentNodeId,
						sourceHandle: getSourceHandle(parentNodeId),
						target: nodeId,
						targetHandle: "ai-top",
						type: "smoothstep",
						animated: false,
					},
				];
			});

			// Clear pending position after both nodes are created
			setPendingPosition(null);

			// Start SSE streaming for real-time content updates
			startStream(nodeId);
		},
		onError: (error) => {
			// TODO: Show toast notification
			console.error("Root creation error:", error);
		},
	});

	// UI-NEW-004: Node editing hook
	const { updateNodeContent } = useNodeEditing({
		onContentUpdated: (nodeId, content) => {
			// Update the node in ReactFlow state after save
			setNodes((nds) =>
				nds.map((node) =>
					node.id === nodeId
						? {
								...node,
								data: { ...node.data, content, isEditing: false },
							}
						: node,
				),
			);
		},
		onError: (error) => {
			console.error("Node update error:", error);
		},
	});

	// SSE streaming hook for real-time node content updates
	const { startStream } = useNodeStream({
		onContentUpdate: (nodeId, content) => {
			console.log("[workspace] SSE content update:", {
				nodeId,
				contentLength: content.length,
			});
			setNodes((nds) =>
				nds.map((node) =>
					node.id === nodeId
						? {
								...node,
								data: {
									...node.data,
									content,
									isStreaming: true,
								},
							}
						: node,
				),
			);
		},
		onComplete: (nodeId) => {
			console.log("[workspace] SSE streaming complete:", nodeId);
			setNodes((nds) =>
				nds.map((node) =>
					node.id === nodeId
						? {
								...node,
								data: {
									...node.data,
									isStreaming: false,
								},
							}
						: node,
				),
			);
		},
		onError: (nodeId, error) => {
			console.error("[workspace] SSE streaming error:", { nodeId, error });
		},
	});

	// UI-NEW-005: Node forking hook (non-destructive editing)
	const { forkUserNode } = useNodeForking({
		onNodeForked: async (userNodeId, aiNodeId) => {
			console.log("[workspace] Node forked:", { userNodeId, aiNodeId });

			try {
				// Get the newly created nodes to add them to the graph
				// Use Server Action to fetch node data instead of importing server module
				const { getNodesAction } = await import("@/app/nodes/actions");

				const nodeIds = aiNodeId ? [userNodeId, aiNodeId] : [userNodeId];
				const result = await getNodesAction(nodeIds);

				if (!result.success || !result.data) {
					throw new Error(result.error || "Failed to fetch nodes");
				}

				const userNode = result.data[0];
				const aiNode = aiNodeId ? result.data[1] : null;

				// Fetch and add the new USER node
				const flowUserNode: MindFlowNode = {
					id: userNode.id,
					type: "user",
					position: { x: userNode.positionX, y: userNode.positionY },
					data: {
						id: userNode.id,
						role: userNode.role,
						content: userNode.content,
						isEditing: false,
						isStreaming: false,
						createdAt: userNode.createdAt,
						metadata: (userNode.metadata || {}) as Record<string, unknown>,
					},
				};

				// Add USER node if not already in state
				setNodes((prev) => {
					if (prev.some((n) => n.id === userNodeId)) return prev;
					return [...prev, flowUserNode];
				});

				// Add edge from parent to USER node
				if (userNode.parentId) {
					const parentId = userNode.parentId; // Type narrowing
					const userEdgeId = `${parentId}-${userNodeId}`;
					setEdges((prev) => {
						if (prev.some((e) => e.id === userEdgeId)) return prev;
						return [
							...prev,
							{
								id: userEdgeId,
								source: parentId,
								sourceHandle: getSourceHandle(parentId),
								target: userNodeId,
								targetHandle: "user-top",
								type: "smoothstep",
								animated: false,
							},
						];
					});
				}

				// Fetch and add the ASSISTANT node if it exists
				if (aiNode && aiNodeId) {
					const flowAiNode: MindFlowNode = {
						id: aiNode.id,
						type: "assistant",
						position: { x: aiNode.positionX, y: aiNode.positionY },
						data: {
							id: aiNode.id,
							role: aiNode.role,
							content: aiNode.content,
							isEditing: false,
							isStreaming: true, // Mark as streaming
							createdAt: aiNode.createdAt,
							metadata: (aiNode.metadata || {}) as Record<string, unknown>,
						},
					};

					// Add ASSISTANT node if not already in state
					setNodes((prev) => {
						if (prev.some((n) => n.id === aiNodeId)) return prev;
						return [...prev, flowAiNode];
					});

					// Add edge from USER node to ASSISTANT node
					const aiEdgeId = `${userNodeId}-${aiNodeId}`;
					setEdges((prev) => {
						if (prev.some((e) => e.id === aiEdgeId)) return prev;
						return [
							...prev,
							{
								id: aiEdgeId,
								source: userNodeId,
								sourceHandle: "user-bottom",
								target: aiNodeId,
								targetHandle: "ai-top",
								type: "smoothstep",
								animated: false,
							},
						];
					});

					// Start SSE streaming for the AI node
					console.log(
						"[workspace] Starting stream for forked AI node:",
						aiNodeId,
					);
					// Small delay to ensure node is in ReactFlow state before starting stream
					await new Promise((resolve) => setTimeout(resolve, 100));
					startStream(aiNodeId);
				}

				// Apply auto-layout to organize the tree structure after forking
				console.log("[workspace] Applying auto-layout...");
				const layoutResult = await applyAutoLayoutAction(projectId);
				if (layoutResult.success && layoutResult.data) {
					console.log(
						`[fork] Auto-layout applied: ${layoutResult.data.updatedCount} nodes`,
					);
					// Reload graph to get the new positions from layout
					// Use a small delay to ensure layout is persisted
					await new Promise((resolve) => setTimeout(resolve, 200));
					await loadGraph();
				}
			} catch (error) {
				console.error("[workspace] Error in onNodeForked:", error);
				// Fallback: reload the entire graph if something goes wrong
				await loadGraph();
			}
		},
		onError: (error) => {
			console.error("Node fork error:", error);
		},
	});

	// Helper function to get the correct source handle based on node type
	const getSourceHandle = useCallback(
		(nodeId: string): string => {
			const node = nodes.find((n) => n.id === nodeId);
			if (!node) return "user-bottom"; // Fallback
			return node.type === "assistant" ? "ai-bottom" : "user-bottom";
		},
		[nodes],
	);

	// UI-005: Path highlighting hook
	const {
		highlightedNodes,
		highlightedEdges,
		handleNodeSelect,
		handleSelectionClear,
	} = usePathHighlightWithInspector({
		nodes,
		edges,
		highlightColor: "#2563eb",
		dimmedColor: "#cbd5e1",
		onNodeSelected: (nodeId) => {
			// Update selected node ID for ThreadView
			setSelectedNodeId(nodeId);
			// Open inspector panel when node is selected
			setInspectorOpen(true);
		},
		onSelectionCleared: () => {
			// Clear selected node ID
			setSelectedNodeId(null);
			// Optional: close inspector when selection is cleared
			// setInspectorOpen(false);
		},
	});

	// UI-NEW-004: Use stable node types (module-level constant for performance)
	// The nodeTypes are defined as STABLE_NODE_TYPES at module level to prevent
	// unnecessary ReactFlow re-renders when parent component updates.

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
		(params: Connection) => {
			setEdges((eds) => addEdge(params, eds));
		},
		[setEdges],
	);

	// UI-005: Handle selection change from ReactFlow
	const onSelectionChange = useCallback(
		(params: { nodes: readonly { id: string }[] }) => {
			const selectedNodeId = params.nodes?.[0]?.id || null;
			if (selectedNodeId) {
				handleNodeSelect(selectedNodeId);
			} else {
				handleSelectionClear();
			}
		},
		[handleNodeSelect, handleSelectionClear],
	);

	// UI-NEW-002: Handle node hover for branch button
	const onNodeMouseEnter = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			setHoveredNodeId(node.id);
		},
		[],
	);

	const onNodeMouseLeave = useCallback(() => {
		setHoveredNodeId(null);
	}, []);

	// UI-WORKSPACE-004: Auto layout handler
	const handleLayout = useCallback(async () => {
		if (!projectId) return;

		const result = await applyAutoLayoutAction(projectId);

		if (result.success && result.data) {
			// Reload graph to get new positions
			await loadGraph();
			// Optional: show feedback - you can add a toast notification here
			console.log(`Layout applied: ${result.data.updatedCount} nodes`);
		} else {
			console.error("Auto-layout failed:", result.error);
			// Optional: show error toast
		}
	}, [projectId, loadGraph]);

	// Helper function to calculate node position with smart layout
	const calculateNodePosition = useCallback(
		(parentNodeId: string): { x: number; userY: number; aiY: number } => {
			const parentNode = nodes.find((n) => n.id === parentNodeId);
			if (!parentNode) {
				return { x: 0, userY: 150, aiY: 300 };
			}

			const parentX = parentNode.position.x;
			const parentY = parentNode.position.y;

			// Count existing children (branches) of the parent node
			const existingChildren = edges.filter((e) => e.source === parentNodeId);
			const branchCount = existingChildren.length;

			// Calculate horizontal offset based on branch count
			// Branch 0: center (no offset)
			// Branch 1: shift left
			// Branch 2: shift right
			// Branch 3+: continue alternating
			const horizontalSpacing = 250; // Distance between branches
			let xOffset = 0;

			if (branchCount === 0) {
				xOffset = 0; // First branch, center
			} else if (branchCount === 1) {
				xOffset = -horizontalSpacing; // Second branch, left
			} else if (branchCount === 2) {
				xOffset = horizontalSpacing; // Third branch, right
			} else {
				// For more branches, alternate left/right
				xOffset =
					(branchCount % 2 === 0 ? 1 : -1) *
					Math.ceil(branchCount / 2) *
					horizontalSpacing;
			}

			// Calculate vertical positions
			const userY = parentY + 180;
			const aiY = userY + 180;

			return { x: parentX + xOffset, userY, aiY };
		},
		[nodes, edges],
	);

	// UI-NEW-002: Handle create child node callback - show dialog instead of creating directly
	const handleCreateChild = useCallback(
		(parentId: string) => {
			if (!projectId) {
				console.error("Cannot create child node: no project ID");
				return;
			}

			console.log("[workspace] Opening branch dialog for parent:", parentId);
			setBranchParentId(parentId);
			setShowBranchDialog(true);
		},
		[projectId],
	);

	// Handle branch dialog submit - create child node with user's message
	const handleBranchPromptSubmit = useCallback(
		async (prompt: string) => {
			if (!projectId || !branchParentId) {
				console.error(
					"Cannot create child node: missing project ID or parent ID",
				);
				return;
			}

			console.log(
				"[workspace] Creating child node with prompt from:",
				branchParentId,
			);

			try {
				// Calculate position for the new child node
				const { x: positionX, userY } = calculateNodePosition(branchParentId);

				// Create USER node as child with the provided message
				const response = await fetch("/api/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						parentNodeId: branchParentId,
						message: prompt,
						positionX,
						positionY: userY,
						skipUserNode: false, // Create USER node for editing
					}),
				});

				if (!response.ok) {
					const errorData = (await response.json()) as { error?: string };
					throw new Error(errorData.error || "Failed to create child node");
				}

				// Get the new node IDs from response headers
				const userNodeId = response.headers.get("X-User-Node-Id");
				const aiNodeId = response.headers.get("X-Node-Id");
				console.log("[workspace] Child nodes created:", {
					userNodeId,
					aiNodeId,
				});

				// Add USER node to ReactFlow state
				if (userNodeId) {
					const userNode: MindFlowNode = {
						id: userNodeId,
						type: "user",
						position: { x: positionX, y: userY },
						data: {
							id: userNodeId,
							role: "USER",
							content: prompt,
							isEditing: false,
							isStreaming: false,
							createdAt: new Date(),
							metadata: {},
						},
					};
					setNodes((prev) => [...prev, userNode]);

					// Add edge from parent to USER node
					const userEdgeId = `${branchParentId}-${userNodeId}`;
					setEdges((prev) => {
						const edgeExists = prev.some((e) => e.id === userEdgeId);
						if (edgeExists) return prev;
						return [
							...prev,
							{
								id: userEdgeId,
								source: branchParentId,
								sourceHandle: getSourceHandle(branchParentId),
								target: userNodeId,
								targetHandle: "user-top",
								type: "smoothstep",
								animated: false,
							},
						];
					});
				}

				// Add ASSISTANT node to ReactFlow state and start streaming
				if (aiNodeId) {
					const { x: aiX, aiY } = calculateNodePosition(branchParentId);
					const assistantNode: MindFlowNode = {
						id: aiNodeId,
						type: "assistant",
						position: { x: aiX, y: aiY },
						data: {
							id: aiNodeId,
							role: "ASSISTANT",
							content: "",
							isEditing: false,
							isStreaming: true,
							createdAt: new Date(),
							metadata: { streaming: true },
						},
					};
					setNodes((prev) => [...prev, assistantNode]);

					// Add edge from USER node to ASSISTANT node
					if (userNodeId) {
						const aiEdgeId = `${userNodeId}-${aiNodeId}`;
						setEdges((prev) => {
							const edgeExists = prev.some((e) => e.id === aiEdgeId);
							if (edgeExists) return prev;
							return [
								...prev,
								{
									id: aiEdgeId,
									source: userNodeId,
									sourceHandle: "user-bottom",
									target: aiNodeId,
									targetHandle: "ai-top",
									type: "smoothstep",
									animated: false,
								},
							];
						});

						// Start SSE streaming for real-time content updates
						startStream(aiNodeId);
					}
				}

				// Close dialog
				setShowBranchDialog(false);
				setBranchParentId(null);
			} catch (error) {
				console.error("[workspace] Create child node error:", error);
			}
		},
		[
			projectId,
			branchParentId,
			calculateNodePosition,
			getSourceHandle,
			setEdges,
			setNodes,
			startStream,
		],
	);

	// Handle branch dialog close
	const handleBranchDialogClose = useCallback(() => {
		setShowBranchDialog(false);
		setBranchParentId(null);
	}, []);

	// UI-004: Send message handler for ThreadView
	const handleSendMessage = useCallback(
		async (message: string, parentNodeId: string) => {
			if (!projectId) {
				console.error("Cannot send message: no project ID");
				return;
			}

			console.log("[workspace] Sending message:", {
				message: `${message.substring(0, 50)}...`,
				parentNodeId,
				projectId,
			});

			try {
				// Calculate position for the new nodes with smart layout
				const {
					x: positionX,
					userY,
					aiY,
				} = calculateNodePosition(parentNodeId);

				const response = await fetch("/api/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						projectId,
						parentNodeId,
						message,
						positionX,
						positionY: aiY,
					}),
				});

				if (!response.ok) {
					const errorData = (await response.json()) as { error?: string };
					throw new Error(errorData.error || "Failed to send message");
				}

				// Get the new node IDs from response headers
				const aiNodeId = response.headers.get("X-Node-Id");
				const userNodeId = response.headers.get("X-User-Node-Id");
				console.log("[workspace] Nodes created:", { userNodeId, aiNodeId });

				// Add USER node to ReactFlow state (only if X-User-Node-Id header is present)
				// If header is missing, it means the API skipped USER node creation (skipUserNode=true)
				if (userNodeId) {
					const userNode: MindFlowNode = {
						id: userNodeId,
						type: "user",
						position: { x: positionX, y: userY },
						data: {
							id: userNodeId,
							role: "USER",
							content: message,
							isEditing: false,
							isStreaming: false,
							createdAt: new Date(),
							metadata: {},
						},
					};
					setNodes((prev) => [...prev, userNode]);

					// Add edge from parent to USER node
					const userEdgeId = `${parentNodeId}-${userNodeId}`;
					setEdges((prev) => {
						const edgeExists = prev.some((e) => e.id === userEdgeId);
						if (edgeExists) return prev;
						return [
							...prev,
							{
								id: userEdgeId,
								source: parentNodeId,
								sourceHandle: getSourceHandle(parentNodeId),
								target: userNodeId,
								targetHandle: "user-top",
								type: "smoothstep",
								animated: false,
							},
						];
					});
				}

				// Add ASSISTANT node to ReactFlow state (placeholder, will be updated by polling)
				if (aiNodeId) {
					const assistantNode: MindFlowNode = {
						id: aiNodeId,
						type: "assistant",
						position: { x: positionX, y: aiY },
						data: {
							id: aiNodeId,
							role: "ASSISTANT",
							content: "",
							isEditing: false,
							isStreaming: true,
							createdAt: new Date(),
							metadata: { streaming: true },
						},
					};
					setNodes((prev) => [...prev, assistantNode]);

					// Add edge from USER node to ASSISTANT node
					if (userNodeId) {
						const aiEdgeId = `${userNodeId}-${aiNodeId}`;
						setEdges((prev) => {
							const edgeExists = prev.some((e) => e.id === aiEdgeId);
							if (edgeExists) return prev;
							return [
								...prev,
								{
									id: aiEdgeId,
									source: userNodeId,
									sourceHandle: "user-bottom",
									target: aiNodeId,
									targetHandle: "ai-top",
									type: "smoothstep",
									animated: false,
								},
							];
						});

						// Start SSE streaming for real-time content updates
						startStream(aiNodeId);
					}

					// Update selectedNodeId to the new ASSISTANT node
					// This triggers ThreadView to refresh with the new conversation context
					setSelectedNodeId(aiNodeId);
				}
			} catch (error) {
				console.error("[workspace] Send message error:", error);
				throw error;
			}
		},
		[
			projectId,
			calculateNodePosition,
			startStream,
			getSourceHandle,
			setEdges,
			setNodes,
		],
	);

	return (
		<>
			<CanvasLayout
				header={<TopHeader onBack={handleBack} />}
				toolbar={
					<FloatingToolbar
						mode={toolMode}
						onModeChange={setToolMode}
						onLayout={handleLayout}
					/>
				}
				inspector={
					<InspectorPanel
						onClose={() => setInspectorOpen(false)}
						threadContent={
							<ThreadView
								nodeId={selectedNodeId}
								projectId={projectId}
								onSendMessage={handleSendMessage}
							/>
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
				<NodeEditingProvider
					onUpdateContent={updateNodeContent}
					onNodeFork={forkUserNode}
					onCreateChild={handleCreateChild}
					hoveredNodeId={hoveredNodeId}
					setHoveredNodeId={setHoveredNodeId}
				>
					<CanvasWithEditHandler
						nodes={highlightedNodes as MindFlowNode[]}
						edges={highlightedEdges}
						nodeTypes={STABLE_NODE_TYPES}
						// biome-ignore lint/suspicious/noExplicitAny: ReactFlow onNodesChange type compatibility with custom MindFlowNode
						onNodesChange={onNodesChange as any}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						onSelectionChange={onSelectionChange}
						onNodeMouseEnter={onNodeMouseEnter}
						onNodeMouseLeave={onNodeMouseLeave}
						onInit={setReactFlowInstance}
					/>
				</NodeEditingProvider>
			</CanvasLayout>

			{/* Prompt Input Dialog for root node creation */}
			<PromptInputDialog
				isOpen={showPromptDialog}
				onClose={handlePromptClose}
				onSubmit={handlePromptSubmit}
			/>

			{/* Branch Dialog for creating child nodes */}
			<PromptInputDialog
				isOpen={showBranchDialog}
				onClose={handleBranchDialogClose}
				onSubmit={handleBranchPromptSubmit}
				placeholder="Enter your message to continue the conversation..."
				maxLength={4000}
				title="Branch Conversation"
				description="Create a new branch from this point in the conversation"
				submitButtonText="Create Branch"
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
