// Test setup file for Vitest
// This file is loaded before all tests run

import { afterAll, beforeAll } from "vitest";
import { prisma } from "./lib/prisma";
import "@testing-library/jest-dom";

// Setup Prisma for testing
beforeAll(async () => {
	try {
		// Verify database connection and schema
		await prisma.$connect();
		// Test query to verify database exists and has correct schema
		await prisma.$queryRaw`SELECT 1`;
	} catch (error) {
		throw new Error(
			`Test database connection failed. Please run:\n` +
				`  pnpm test:setup\n\n` +
				`Original error: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Clear test database before running tests
	await prisma.node.deleteMany({});
	await prisma.project.deleteMany({});
});

afterAll(async () => {
	// Disconnect Prisma client after all tests
	await prisma.$disconnect();
});
