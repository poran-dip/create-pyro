import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

const DB_URL = "postgresql://app:password@localhost:15432/app";
const SECRET = "a".repeat(32);

describe("laziness", () => {
  it("importing the module never throws, even with an empty environment", async () => {
    await expect(import("./index")).resolves.toBeDefined();
  });
});

describe("dbEnv", () => {
  it("reads DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", DB_URL);
    const { dbEnv } = await import("./index");
    expect(dbEnv.DATABASE_URL).toBe(DB_URL);
  });

  it("does not require variables from other scopes", async () => {
    vi.stubEnv("DATABASE_URL", DB_URL);
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    vi.stubEnv("CORS_ORIGIN", "");
    const { dbEnv } = await import("./index");
    expect(() => dbEnv.DATABASE_URL).not.toThrow();
  });

  it("explains an absent variable rather than reporting a type error", async () => {
    vi.stubEnv("DATABASE_URL", undefined);
    const { dbEnv } = await import("./index");
    expect(() => dbEnv.DATABASE_URL).toThrow(/DATABASE_URL: required/);
    expect(() => dbEnv.DATABASE_URL).not.toThrow(/received undefined/);
  });
});

describe("authEnv", () => {
  it("reports every problem in the scope at once", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "not-a-url");
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");
    const { authEnv } = await import("./index");
    let message = "";
    try {
      void authEnv.BETTER_AUTH_URL;
    } catch (err) {
      message = err instanceof Error ? err.message : "";
    }
    expect(message).toContain("BETTER_AUTH_URL");
    expect(message).toContain("BETTER_AUTH_SECRET");
  });

  it("accepts a valid scope", async () => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3002/");
    vi.stubEnv("BETTER_AUTH_SECRET", SECRET);
    const { authEnv } = await import("./index");
    expect(authEnv.BETTER_AUTH_URL).toBe("http://localhost:3002");
  });
});

describe("apiEnv", () => {
  it("applies defaults for the port and NODE_ENV", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", undefined);
    vi.stubEnv("API_PORT", undefined);
    const { apiEnv } = await import("./index");
    expect(apiEnv.API_PORT).toBe(3002);
    expect(apiEnv.NODE_ENV).toBe("development");
  });

  it("coerces a port from a string", async () => {
    vi.stubEnv("CORS_ORIGIN", "http://localhost:3000");
    vi.stubEnv("API_PORT", "4000");
    const { apiEnv } = await import("./index");
    expect(apiEnv.API_PORT).toBe(4000);
  });

  it("rejects a CORS_ORIGIN that is not an absolute URL", async () => {
    vi.stubEnv("CORS_ORIGIN", "localhost:3000");
    const { apiEnv } = await import("./index");
    expect(() => apiEnv.CORS_ORIGIN).toThrow(/CORS_ORIGIN/);
  });
});

describe("webEnv", () => {
  it("rejects a PUBLIC_API_URL with a trailing /api", async () => {
    vi.stubEnv("PUBLIC_API_URL", "http://localhost/api");
    const { webEnv } = await import("./index");
    expect(() => webEnv.PUBLIC_API_URL).toThrow(/PUBLIC_API_URL/);
  });

  it("defaults INTERNAL_API_URL for the non-Docker dev loop", async () => {
    vi.stubEnv("PUBLIC_API_URL", "http://localhost:3002");
    vi.stubEnv("INTERNAL_API_URL", undefined);
    const { webEnv } = await import("./index");
    expect(webEnv.INTERNAL_API_URL).toBe("http://localhost:3002");
  });
});
