/**
 * The database the suite runs against: TEST_DATABASE_URL if set, otherwise
 * DATABASE_URL with `_test` appended to its name, so tests never touch the
 * dev database.
 */
export function testDatabaseUrl() {
  const explicit = process.env.TEST_DATABASE_URL;
  const base = explicit ?? process.env.DATABASE_URL;

  if (!base)
    throw new Error(
      "Set DATABASE_URL (or TEST_DATABASE_URL) before running the apps/api suite.",
    );

  if (explicit) return explicit;

  const url = new URL(base);
  const name = url.pathname.replace(/^\//, "");
  if (!name) throw new Error("No database name in DATABASE_URL");
  if (!name.endsWith("_test")) url.pathname = `/${name}_test`;

  return url.toString();
}
