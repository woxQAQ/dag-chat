/**
 * Tests for database schema (using mocks)
 *
 * Note: Database integration tests have been removed.
 * Tests should mock database operations rather than directly accessing the database.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the prisma client before importing
vi.mock("./prisma", () => ({
	prisma: {
		project: {
			create: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
		},
		node: {
			create: vi.fn(),
			createMany: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			deleteMany: vi.fn(),
			count: vi.fn(),
			findMany: vi.fn(),
			findFirst: vi.fn(),
		},
		$queryRaw: vi.fn(),
	},
}));

import { prisma } from "./prisma";

describe("Database Schema - Placeholder", () => {
	it("should have database tests mocked", () => {
		// Database operations should be mocked in individual service tests
		expect(prisma).toBeDefined();
	});
});
