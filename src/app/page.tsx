import Link from "next/link";

export default function Home() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
			<main className="flex flex-col items-center gap-8 p-8">
				<h1 className="text-4xl font-bold text-slate-800">MindFlow</h1>
				<p className="text-lg text-slate-600 text-center max-w-md">
					Tree-structured AI chatbot that solves the context loss problem in
					complex conversations.
				</p>

				<div className="flex gap-4">
					<Link
						href="/workspace"
						className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
					>
						Open Workspace
					</Link>
				</div>

				<div className="mt-8 text-sm text-slate-400">
					<p>UI-001: Application Layout Framework</p>
				</div>
			</main>
		</div>
	);
}
