import { hc } from "hono/client";
import type { AppType } from "@repo/api";
import { serverEnv } from "./env.server";

/**
 * A typed api client for loaders and actions. It forwards the incoming
 * request's cookies, so calls run as the signed-in user.
 */
export function api(request: Request) {
  return hc<AppType>(serverEnv.INTERNAL_API_URL, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });
}
