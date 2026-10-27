import { createAuthClient } from "better-auth/react";
import { publicApiUrl } from "./public-env";

let client: ReturnType<typeof createAuthClient> | undefined;

/**
 * The Better Auth client. Created on first use because it needs the browser's
 * runtime config, so only call it from event handlers and effects.
 */
export function authClient() {
  client ??= createAuthClient({ baseURL: `${publicApiUrl()}/api/auth` });
  return client;
}
