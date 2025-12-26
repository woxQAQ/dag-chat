// Test setup file for Vitest
// This file is loaded before all tests run

import { afterAll, beforeAll } from "vitest";
import { prisma } from "./lib/prisma";
import "@testing-library/jest-dom";

// Setup Prisma for testing
beforeAll(async () => {
	// Clear test database before running tests
	await prisma.node.deleteMany({});
	await prisma.project.deleteMany({});
});

afterAll(async () => {
	// Disconnect Prisma client after all tests
	await prisma.$disconnect();
});
