import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { dbEnv } from "@repo/config";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: dbEnv.DATABASE_URL,
});

export const db = drizzle(pool, { schema, casing: "snake_case" });

export type Database = typeof db;
