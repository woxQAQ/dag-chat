import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { Pool } from "pg";

// Load environment variables for database connection
// Use .env.test for testing, .env.local for development
if (process.env.NODE_ENV === "test" || process.env.VITEST === "vitest") {
	config({ path: ".env.test" });
} else {
	config({ path: ".env.local" });
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// biome-ignore lint/style/noNonNullAssertion: DATABASE_URL is required and validated at runtime
const connectionString = process.env.DATABASE_URL!;

const createPrismaClient = () => {
	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
