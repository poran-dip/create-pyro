import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client, Pool } from "pg";
import { testDatabaseUrl } from "./database-url";

const MIGRATIONS = fileURLToPath(
  new URL("../../../../packages/db/drizzle", import.meta.url),
);

/** Creates the test database if it's missing, then applies every migration. */
export default async function setup() {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.replace(/^\//, "");

  const admin = new URL(url);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      "select 1 from pg_database where datname = $1",
      [name],
    );
    if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end();
  }

  const pool = new Pool({ connectionString: url });
  try {
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS });
  } finally {
    await pool.end();
  }
}
