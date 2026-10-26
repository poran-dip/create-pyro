import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { apiEnv } from "@repo/config";
import { fail } from "./lib/response";
import { resolveSession, type SessionResolver } from "./lib/session";
import { createAuthMiddleware } from "./middleware/auth";
import api from "./routes";
import type { AppEnv } from "./types/context";

export type CreateAppOptions = {
  /** Swap how a request's session is resolved, e.g. with a stub in tests. */
  sessionResolver?: SessionResolver;
};

const SKIP_LOG = new Set(["/api/health", "/api/auth/get-session"]);

export function createApp(options: CreateAppOptions = {}) {
  const resolver = options.sessionResolver ?? resolveSession;

  return new Hono<AppEnv>()
    .use("*", async (c, next) => {
      if (apiEnv.NODE_ENV === "test" || SKIP_LOG.has(c.req.path)) return next();
      return logger()(c, next);
    })

    .use(
      "/api/*",
      cors({
        origin: (origin) => (origin === apiEnv.CORS_ORIGIN ? origin : null),
        credentials: true,
      }),
    )

    .use("/api/*", createAuthMiddleware(resolver))

    .get("/api/health", (c) => c.json({ ok: true }))

    .route("/api", api)

    .notFound((c) => fail(c, "NOT_FOUND", "Not found", 404))

    .onError((err, c) => {
      if (err instanceof HTTPException) return err.getResponse();

      console.error(err);
      return fail(c, "INTERNAL", "Internal server error", 500);
    });
}

const app = createApp();

export default app;
