import type { ReactNode } from "react";
import { ChatArea } from "./chat-area";
import { Sidebar } from "./sidebar";

export interface AppLayoutProps {
	children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
	return (
		<div className="flex h-screen w-full overflow-hidden bg-white dark:bg-black">
			{/* Sidebar - Conversation list and tree view */}
			<Sidebar />

			{/* Main chat area */}
			<ChatArea>{children}</ChatArea>
		</div>
	);
}
