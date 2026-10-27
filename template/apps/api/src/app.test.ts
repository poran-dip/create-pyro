import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import type { SessionResolver } from "./lib/session";

const signedOut: SessionResolver = async () => null;

describe("app", () => {
  it("answers the health check", async () => {
    const app = createApp({ sessionResolver: signedOut });
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rejects /api/me when signed out", async () => {
    const app = createApp({ sessionResolver: signedOut });
    const res = await app.request("/api/me");
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      success: false,
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const app = createApp({ sessionResolver: signedOut });
    const res = await app.request("/api/nope");
    expect(res.status).toBe(404);
  });

  it("only allows the configured web origin", async () => {
    const app = createApp({ sessionResolver: signedOut });
    const allowed = await app.request("/api/health", {
      headers: { Origin: "http://localhost:3000" },
    });
    const denied = await app.request("/api/health", {
      headers: { Origin: "https://evil.example" },
    });
    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });
});
