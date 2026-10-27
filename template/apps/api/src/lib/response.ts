import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiError, ApiSuccess } from "@repo/shared";
import type { AppEnv } from "../types/context";

/** The signed-in user. Only call behind `requireAuth()`. */
export function getUser(c: Context<AppEnv>) {
  const user = c.get("user");
  if (!user) throw new Error("No user on the context — requireAuth() missing");
  return user;
}

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  return c.json({ success: true, data } satisfies ApiSuccess<T>, status);
}

export function fail(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400,
  details?: unknown,
) {
  return c.json(
    { success: false, error: { code, message, details } } satisfies ApiError,
    status,
  );
}
