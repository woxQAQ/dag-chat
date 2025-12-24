import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

// Load environment variables for database connection
config({ path: ".env.local" });

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL!;

const createPrismaClient = () => {
	const pool = new Pool({ connectionString });
	const adapter = new PrismaPg(pool);
	return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
