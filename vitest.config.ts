import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		include: ["**/*.test.{ts,tsx}"],
		exclude: ["node_modules", "dist"],
		setupFiles: ["./src/test-setup.ts"],
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
