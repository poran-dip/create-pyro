import { defineConfig } from "drizzle-kit";
import { dbEnv } from "@repo/config";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: dbEnv.DATABASE_URL,
  },
});
