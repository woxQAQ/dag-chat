// Test setup file for Vitest
// This file is loaded before all tests run

import { afterAll, beforeAll } from "vitest";
import { prisma } from "./lib/prisma";
import "@testing-library/jest-dom";

// Setup Prisma for testing
beforeAll(async () => {
	// Prisma client is already initialized in lib/prisma.ts
	// No additional setup needed for now
});

afterAll(async () => {
	// Cleanup after all tests
	// Clean up nodes first due to foreign key constraints
	await prisma.node.deleteMany({});
	await prisma.project.deleteMany({});
	await prisma.$disconnect();
});
