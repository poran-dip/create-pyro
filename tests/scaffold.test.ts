import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeScope,
  toSlug,
  validateScope,
  writeEnv,
} from "../src/scaffold.js";

describe("toSlug", () => {
  it.each([
    ["my-app", "my-app"],
    ["My App", "my-app"],
    ["  Hello.World  ", "hello-world"],
    ["--edge--", "edge"],
    ["!!!", ""],
  ])("%j → %j", (input, expected) => {
    expect(toSlug(input)).toBe(expected);
  });
});

describe("normalizeScope", () => {
  it("drops a leading @ and trailing slash, and lowercases", () => {
    expect(normalizeScope(" @Acme/ ")).toBe("acme");
  });
});

describe("validateScope", () => {
  it("accepts npm-style scopes", () => {
    expect(validateScope("acme")).toBe(true);
    expect(validateScope("acme.io")).toBe(true);
  });

  it("rejects empty or malformed scopes", () => {
    expect(validateScope("")).not.toBe(true);
    expect(validateScope("has space")).not.toBe(true);
    expect(validateScope("-leading")).not.toBe(true);
  });
});

describe("writeEnv", () => {
  it("leaves an existing .env alone", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "create-pyro-env-"));
    fs.writeFileSync(path.join(dir, ".env.example"), "BETTER_AUTH_SECRET=\n");
    fs.writeFileSync(path.join(dir, ".env"), "KEEP=1\n");
    writeEnv(dir);
    expect(fs.readFileSync(path.join(dir, ".env"), "utf8")).toBe("KEEP=1\n");
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
