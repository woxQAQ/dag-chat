// Test setup file for Vitest
// This file is loaded before all tests run

import { beforeAll, afterAll } from "vitest";
import { prisma } from "./lib/prisma";

// Setup Prisma for testing
beforeAll(async () => {
	// Prisma client is already initialized in lib/prisma.ts
	// No additional setup needed for now
});

afterAll(async () => {
	// Cleanup after all tests
	await prisma.$disconnect();
});
