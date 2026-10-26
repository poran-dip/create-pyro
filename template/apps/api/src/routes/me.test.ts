import { isCuid } from "@paralleldrive/cuid2";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import app from "../app";

// Runs against the real test database (see src/test/global-setup.ts).

const ORIGIN = "http://localhost:3000";

async function signUp() {
  const email = `user-${crypto.randomUUID()}@example.com`;
  const res = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ name: "Test User", email, password: "password123" }),
  });
  expect(res.status).toBe(200);

  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { email, cookie };
}

describe("GET /api/me", () => {
  const client = testClient(app);

  it("returns the signed-in user, with a cuid2 id", async () => {
    const { email, cookie } = await signUp();

    const res = await client.api.me.$get({}, { headers: { cookie } });
    expect(res.status).toBe(200);

    const body = await res.json();
    if (!body.success) throw new Error(body.error.message);
    expect(body.data).toMatchObject({ email, name: "Test User" });
    expect(isCuid(body.data.id)).toBe(true);
  });

  it("returns 401 without a session cookie", async () => {
    const res = await client.api.me.$get();
    expect(res.status).toBe(401);
  });
});
