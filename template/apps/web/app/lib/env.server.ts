import { webEnv } from "@repo/config";
import type { PublicEnv } from "./public-env";

export const serverEnv = webEnv;

/** The subset of the server's env that is safe to send to the browser. */
export function getPublicEnv(): PublicEnv {
  return {
    API_URL: webEnv.PUBLIC_API_URL,
  };
}
