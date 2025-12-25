/**
 * UI-007: Dashboard - Home Page
 *
 * This is the main dashboard page that displays all projects.
 * It's a Server Component that fetches projects and renders the Dashboard client component.
 */

import { listProjectsWithStats } from "@/app/projects/actions";
import { Dashboard } from "@/components/dashboard";

export default async function HomePage() {
	// Fetch projects with stats on the server
	const result = await listProjectsWithStats({
		take: 20,
		orderBy: "updatedAt",
		orderDirection: "desc",
	});

	return (
		<Dashboard
			projects={result.success && result.data ? result.data.projects : []}
			total={result.success && result.data ? result.data.total : 0}
			hasMore={result.success && result.data ? result.data.hasMore : false}
			error={!result.success ? result.error : undefined}
		/>
	);
}
