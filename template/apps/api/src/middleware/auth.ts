import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { fail } from "../lib/response";
import type { SessionResolver } from "../lib/session";
import type { AppEnv } from "../types/context";

/** Puts the request's user (or null) on the context for every /api route. */
export function createAuthMiddleware(
  resolver: SessionResolver,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    c.set("user", null);
    c.set("sessionId", null);

    const path = c.req.path;
    if (path.startsWith("/api/auth") || path === "/api/health") return next();

    const resolved = await resolver(c.req.raw.headers);
    if (resolved) {
      c.set("user", resolved.user);
      c.set("sessionId", resolved.sessionId);
    }

    await next();
  };
}

/** Rejects the request with 401 unless someone is signed in. */
export const requireAuth = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (!c.get("user"))
      return fail(c, "UNAUTHORIZED", "You need to sign in", 401);
    await next();
  });
