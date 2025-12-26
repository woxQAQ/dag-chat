/**
 * useNodeStream Hook
 *
 * Custom hook for streaming node content updates via Server-Sent Events (SSE).
 * Replaces polling for real-time content updates during AI streaming.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";

export interface UseNodeStreamOptions {
	/** Callback when node content is updated */
	onContentUpdate?: (nodeId: string, content: string) => void;
	/** Callback when streaming is complete */
	onComplete?: (nodeId: string) => void;
	/** Callback when an error occurs */
	onError?: (nodeId: string, error: string) => void;
}

export interface UseNodeStreamReturn {
	/** Start streaming for a node */
	startStream: (nodeId: string) => void;
	/** Stop streaming for a specific node */
	stopStream: (nodeId: string) => void;
	/** Stop all streams */
	stopAllStreams: () => void;
	/** Get streaming state for a node */
	isStreaming: (nodeId: string) => boolean;
}

/**
 * Hook for streaming node content updates via SSE.
 * Manages multiple concurrent streams for different nodes.
 *
 * @param options - Stream event handlers
 * @returns Stream control functions
 *
 * @example
 * ```tsx
 * const { startStream, stopStream, stopAllStreams } = useNodeStream({
 *   onContentUpdate: (nodeId, content) => {
 *     setNodes((nds) => nds.map((node) =>
 *       node.id === nodeId ? { ...node, data: { ...node.data, content } } : node
 *     ));
 *   },
 *   onComplete: (nodeId) => {
 *     console.log('Streaming complete for:', nodeId);
 *   },
 * });
 *
 * // Start streaming when ASSISTANT node is created
 * useEffect(() => {
 *   if (aiNodeId) {
 *     startStream(aiNodeId);
 *   }
 * }, [aiNodeId]);
 * ```
 */
export function useNodeStream(options: UseNodeStreamOptions = {}): UseNodeStreamReturn {
	const { onContentUpdate, onComplete, onError } = options;

	// Track active streams using a Map
	const streamsRef = useRef<Map<string, EventSource>>(new Map());
	const streamingStateRef = useRef<Map<string, boolean>>(new Map());

	const startStream = useCallback(
		(nodeId: string) => {
			// Skip if already streaming
			if (streamsRef.current.has(nodeId)) {
				console.log("[useNodeStream] Already streaming node:", nodeId);
				return;
			}

			console.log("[useNodeStream] Starting SSE stream for node:", nodeId);
			streamingStateRef.current.set(nodeId, true);

			try {
				const eventSource = new EventSource(
					`/api/chat/stream?nodeId=${nodeId}`,
				);

				// Handle message event (default SSE event)
				eventSource.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data);
						if (data.error) {
							onError?.(nodeId, data.error);
							return;
						}
						onContentUpdate?.(nodeId, data.content);
					} catch (error) {
						console.error("[useNodeStream] Failed to parse SSE data:", error);
					}
				};

				// Handle update event
				eventSource.addEventListener("update", (event) => {
					try {
						const data = JSON.parse(event.data);
						onContentUpdate?.(nodeId, data.content);
					} catch (error) {
						console.error("[useNodeStream] Failed to parse update:", error);
					}
				});

				// Handle complete event
				eventSource.addEventListener("complete", (event) => {
					try {
						const data = JSON.parse(event.data);
						onContentUpdate?.(nodeId, data.content);
						streamingStateRef.current.set(nodeId, false);
						onComplete?.(nodeId);
						eventSource.close();
						streamsRef.current.delete(nodeId);
						console.log("[useNodeStream] Streaming complete for node:", nodeId);
					} catch (error) {
						console.error("[useNodeStream] Failed to parse complete:", error);
					}
				});

				// Handle connection errors
				eventSource.onerror = (error) => {
					console.error("[useNodeStream] EventSource error for node:", nodeId, error);
					streamingStateRef.current.set(nodeId, false);
					eventSource.close();
					streamsRef.current.delete(nodeId);
					onError?.(nodeId, "Connection error");
				};

				streamsRef.current.set(nodeId, eventSource);
			} catch (error) {
				console.error("[useNodeStream] Failed to create EventSource for node:", nodeId, error);
				streamingStateRef.current.set(nodeId, false);
				onError?.(nodeId, "Failed to connect to stream");
			}
		},
		[onContentUpdate, onComplete, onError],
	);

	const stopStream = useCallback((nodeId: string) => {
		const eventSource = streamsRef.current.get(nodeId);
		if (eventSource) {
			console.log("[useNodeStream] Stopping SSE stream for node:", nodeId);
			eventSource.close();
			streamsRef.current.delete(nodeId);
			streamingStateRef.current.set(nodeId, false);
		}
	}, []);

	const stopAllStreams = useCallback(() => {
		console.log("[useNodeStream] Stopping all SSE streams");
		streamsRef.current.forEach((eventSource, nodeId) => {
			eventSource.close();
			streamingStateRef.current.set(nodeId, false);
		});
		streamsRef.current.clear();
	}, []);

	const isStreaming = useCallback(
		(nodeId: string) => streamingStateRef.current.get(nodeId) ?? false,
		[],
	);

	// Cleanup all streams on unmount
	useEffect(() => {
		return () => {
			stopAllStreams();
		};
	}, [stopAllStreams]);

	return {
		startStream,
		stopStream,
		stopAllStreams,
		isStreaming,
	};
}
