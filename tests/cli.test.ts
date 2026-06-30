import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI = path.resolve(__dirname, "../dist/index.js");

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "create-pyro-test-"));
}

function run(args: string[], cwd: string, input?: string) {
  return spawnSync("node", [CLI, ...args], {
    cwd,
    input,
    encoding: "utf8",
    timeout: 5000,
    env: { ...process.env, NO_COLOR: "1" },
  });
}

describe("create-pyro CLI", () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("test 1: default name when hitting enter (empty input)", () => {
    const result = run([], dir, "\n");
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(dir, "my-pyro-app"))).toBe(true);
    expect(result.stdout).toContain("Created my-pyro-app");
  });

  it("test 2: using . scaffolds into current directory", () => {
    const result = run([], dir, ".\n");
    expect(result.status).toBe(0);
    const basename = path.basename(dir);
    expect(result.stdout).toContain(`Created ${basename}`);
    expect(fs.existsSync(path.join(dir, "package.json"))).toBe(true);
  });

  it("test 3: arg skips prompt and scaffolds new-app/", () => {
    const result = run(["new-app"], dir);
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(dir, "new-app"))).toBe(true);
    expect(result.stdout).toContain("Created new-app");
  });

  it("test 4: existing directory exits with error", () => {
    fs.mkdirSync(path.join(dir, "new-app"));
    fs.writeFileSync(path.join(dir, "new-app", "dummy.txt"), "");
    const result = run(["new-app"], dir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("already exists");
  });

  it("test 5: typed name via prompt creates correct folder", () => {
    const result = run([], dir, "nice\n");
    expect(result.status).toBe(0);
    expect(fs.existsSync(path.join(dir, "nice"))).toBe(true);
    expect(result.stdout).toContain("Created nice");
  });

  it("test 6: closed/empty stdin exits cleanly without creating a directory", () => {
    const result = run([], dir, "");
    expect(result.status).toBe(13);
    expect(fs.readdirSync(dir)).toHaveLength(0);
  });

  it("scaffolded package.json has correct name", () => {
    run(["my-project"], dir);
    const pkg = JSON.parse(
      fs.readFileSync(path.join(dir, "my-project", "package.json"), "utf8"),
    );
    expect(pkg.name).toBe("my-project");
  });

  it(".gitignore exists in scaffolded project", () => {
    run(["my-project"], dir);
    expect(fs.existsSync(path.join(dir, "my-project", ".gitignore"))).toBe(
      true,
    );
  });
});
