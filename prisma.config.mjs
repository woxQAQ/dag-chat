import { defineConfig } from "@prisma/config";
import { config } from "dotenv";

// Load environment variables from .env.local (development)
const result = config({ path: ".env.local" });
if (result.error) {
	throw result.error;
}

export default defineConfig({
	schema: "./prisma/schema.prisma",
	datasource: {
		url: process.env.DATABASE_URL,
	},
});
