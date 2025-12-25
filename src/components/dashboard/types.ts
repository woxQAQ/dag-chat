/**
 * UI-007: Dashboard - Type Definitions
 */

import type { ProjectResult } from "@/lib/project-crud";

export type DashboardProjectCardProps = {
	project: ProjectResult;
	onOpen: (projectId: string) => void;
	onDelete: (projectId: string) => void;
	onRename?: (projectId: string, newName: string) => void;
};

export type CreateProjectDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (name: string, description?: string) => Promise<void>;
	isCreating?: boolean;
};

export type DashboardProps = {
	projects?: ProjectResult[];
	total?: number;
	hasMore?: boolean;
	onCreateProject?: (name: string, description?: string) => Promise<void>;
	onDeleteProject?: (projectId: string) => Promise<void>;
	onOpenProject?: (projectId: string) => void;
	onLoadMore?: () => void;
	loading?: boolean;
	error?: string;
};
