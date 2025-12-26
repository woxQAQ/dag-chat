import path from "node:path";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load test environment variables BEFORE anything else
config({ path: ".env.test" });

export default defineConfig({
	plugins: [react()],
	// Ensure VITEST is set for src/lib/prisma.ts environment detection
	define: {
		"process.env.VITEST": '"vitest"',
	},
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["**/*.test.{ts,tsx}"],
		exclude: ["node_modules", "dist"],
		setupFiles: ["./src/test-setup.ts"],
		// Run test files sequentially to prevent database pollution
		fileParallelism: false,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			// Mock CSS imports
			"highlight.js/styles/github-dark.css": path.resolve(
				__dirname,
				"./src/__mocks__/empty.ts",
			),
			"@xyflow/react/dist/style.css": path.resolve(
				__dirname,
				"./src/__mocks__/empty.ts",
			),
		},
	},
	// Handle CSS imports in tests
	css: {
		modules: {
			scopeBehaviour: "global",
		},
	},
});
