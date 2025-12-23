import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MessageNode } from "@/types/tree";

type RawMessageNode = {
	id: string;
	conversation_id: string;
	parent_id: string | null;
	role: string;
	content: string;
	created_at: Date;
};

/**
 * GET /api/tree?conversationId={id}
 *
 * API-002: Tree Retrieval
 *
 * Fetches the complete tree structure of a conversation using
 * PostgreSQL queries for efficient tree traversal.
 *
 * @returns TreeResponse with nested tree structure
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const conversationId = searchParams.get("conversationId");

		if (!conversationId) {
			return NextResponse.json(
				{ error: "conversationId is required" },
				{ status: 400 },
			);
		}

		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(conversationId)) {
			return NextResponse.json(
				{ error: "Invalid conversationId format" },
				{ status: 400 },
			);
		}

		// Verify conversation exists
		const conversation = await prisma.conversation.findUnique({
			where: { id: conversationId },
		});

		if (!conversation) {
			return NextResponse.json(
				{ error: "Conversation not found" },
				{ status: 404 },
			);
		}

		// Fetch all nodes for this conversation
		// We'll build the tree structure in memory for simplicity
		const nodes = await prisma.$queryRaw<
			RawMessageNode[]
		>`SELECT id, conversation_id, parent_id, role, content, created_at
			 FROM "MessageNode"
			 WHERE "conversation_id" = ${conversationId}::uuid
			 ORDER BY "created_at" ASC`;

		// Build tree structure using adjacency list pattern
		const nodeMap = new Map<string, MessageNode>();
		const rootNodes: MessageNode[] = [];

		// First pass: create node map
		for (const node of nodes) {
			nodeMap.set(node.id, {
				id: node.id,
				parentId: node.parent_id,
				role: node.role as "system" | "user" | "assistant",
				content: node.content,
				createdAt: node.created_at,
				children: [],
			});
		}

		// Second pass: build tree structure
		for (const node of nodes) {
			const treeNode = nodeMap.get(node.id);
			if (!treeNode) continue;

			if (node.parent_id) {
				const parent = nodeMap.get(node.parent_id);
				if (parent) {
					parent.children.push(treeNode);
				} else {
					// Orphaned node (parent not found), treat as root
					rootNodes.push(treeNode);
				}
			} else {
				rootNodes.push(treeNode);
			}
		}

		return NextResponse.json({
			conversationId,
			tree: rootNodes,
			nodeCount: nodes.length,
		});
	} catch (error) {
		console.error("Error fetching conversation tree:", error);
		return NextResponse.json(
			{
				error: "Failed to fetch conversation tree",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
