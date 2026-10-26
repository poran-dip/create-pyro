import { serve } from "@hono/node-server";
import { apiEnv } from "@repo/config";
import app from "./app";

const isProd = apiEnv.NODE_ENV === "production";

serve({ fetch: app.fetch, port: apiEnv.API_PORT }, (info) => {
  console.log(
    `API running on ${isProd ? `port ${info.port}` : `http://localhost:${info.port}`}`,
  );
});

export type AppType = typeof app;
