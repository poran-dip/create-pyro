import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeScope,
  scaffold,
  toSlug,
  validateScope,
  writeEnv,
} from "../src/scaffold.js";

describe("scaffold", () => {
  it("converts CRLF to LF and leaves binary files untouched", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "create-pyro-crlf-"));
    const templateDir = path.join(root, "template");
    const dest = path.join(root, "out");
    const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x00]);
    fs.mkdirSync(templateDir);
    fs.writeFileSync(
      path.join(templateDir, "compose.yml"),
      "name: my-pyro-app\r\nimage: @repo/api\r\n",
    );
    fs.writeFileSync(path.join(templateDir, "logo.png"), binary);

    scaffold({ templateDir, dest, name: "demo", scope: "acme" });

    expect(fs.readFileSync(path.join(dest, "compose.yml"), "utf8")).toBe(
      "name: demo\nimage: @acme/api\n",
    );
    expect(fs.readFileSync(path.join(dest, "logo.png"))).toEqual(binary);
    fs.rmSync(root, { recursive: true, force: true });
  });
});

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
