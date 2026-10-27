import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db, usersTable } from "@repo/db";
import { fail, getUser, ok } from "../lib/response";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types/context";

const me = new Hono<AppEnv>().get("/", requireAuth(), async (c) => {
  const { id } = getUser(c);

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      emailVerified: usersTable.emailVerified,
      image: usersTable.image,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user) return fail(c, "NOT_FOUND", "User not found", 404);
  return ok(c, user);
});

export default me;
