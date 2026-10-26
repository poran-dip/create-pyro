import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI = path.resolve(__dirname, "../dist/index.js");

/** Skip the slow, side-effecting steps unless a test opts in. */
const OFFLINE = ["--no-git", "--no-install"];

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "create-pyro-test-"));
}

function run(args: string[], cwd: string, input?: string) {
  return spawnSync("node", [CLI, ...args], {
    cwd,
    input,
    encoding: "utf8",
    timeout: 15_000,
    env: {
      ...process.env,
      NO_COLOR: "1",
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
    },
  });
}

function* files(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== ".git") yield* files(full);
    } else yield full;
  }
}

const read = (...parts: string[]) =>
  fs.readFileSync(path.join(...parts), "utf8");

describe("create-pyro CLI", () => {
  let dir: string;

  beforeEach(() => {
    dir = tmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe("project directory", () => {
    it("uses the default name when you hit enter", () => {
      const result = run([...OFFLINE, "--scope", "acme"], dir, "\n");
      expect(result.status).toBe(0);
      expect(fs.existsSync(path.join(dir, "my-pyro-app"))).toBe(true);
      expect(result.stdout).toContain("Created my-pyro-app");
    });

    it("creates the folder you type at the prompt", () => {
      const result = run([...OFFLINE, "--scope", "acme"], dir, "nice\n");
      expect(result.status).toBe(0);
      expect(fs.existsSync(path.join(dir, "nice"))).toBe(true);
      expect(result.stdout).toContain("Created nice");
    });

    it("scaffolds into the current directory for '.'", () => {
      const result = run([...OFFLINE, "--scope", "acme"], dir, ".\n");
      expect(result.status).toBe(0);
      expect(fs.existsSync(path.join(dir, "package.json"))).toBe(true);
      expect(result.stdout).not.toContain("  cd ");
    });

    it("skips the prompt when the directory is an argument", () => {
      const result = run(["new-app", "-y", ...OFFLINE], dir);
      expect(result.status).toBe(0);
      expect(fs.existsSync(path.join(dir, "new-app"))).toBe(true);
      expect(result.stdout).toContain("cd new-app");
    });

    it("refuses a directory that isn't empty", () => {
      fs.mkdirSync(path.join(dir, "new-app"));
      fs.writeFileSync(path.join(dir, "new-app", "dummy.txt"), "");
      const result = run(["new-app", "-y", ...OFFLINE], dir);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("already exists");
    });

    it("refuses '.' when the current directory has files", () => {
      fs.writeFileSync(path.join(dir, "dummy.txt"), "");
      const result = run([".", "-y", ...OFFLINE], dir);
      expect(result.status).toBe(1);
      expect(fs.existsSync(path.join(dir, "package.json"))).toBe(false);
    });

    it("allows a directory that only holds a .git folder", () => {
      fs.mkdirSync(path.join(dir, ".git"));
      const result = run([".", "-y", ...OFFLINE], dir);
      expect(result.status).toBe(0);
    });

    it("exits without creating anything when stdin closes", () => {
      const result = run([], dir, "");
      expect(result.status).toBe(13);
      expect(fs.readdirSync(dir)).toHaveLength(0);
    });

    it("slugifies a directory name for the package name", () => {
      const result = run(["My App", "-y", ...OFFLINE], dir);
      expect(result.status).toBe(0);
      const pkg = JSON.parse(read(dir, "My App", "package.json"));
      expect(pkg.name).toBe("my-app");
    });
  });

  describe("scaffolded files", () => {
    it("names the root package after the project", () => {
      run(["my-project", "-y", ...OFFLINE], dir);
      const pkg = JSON.parse(read(dir, "my-project", "package.json"));
      expect(pkg.name).toBe("my-project");
    });

    it("restores .gitignore", () => {
      run(["my-project", "-y", ...OFFLINE], dir);
      const root = path.join(dir, "my-project");
      expect(fs.existsSync(path.join(root, ".gitignore"))).toBe(true);
      expect(fs.existsSync(path.join(root, "gitignore"))).toBe(false);
    });

    it("includes every app and package", () => {
      run(["my-project", "-y", ...OFFLINE], dir);
      const root = path.join(dir, "my-project");
      for (const ws of [
        "apps/api",
        "apps/web",
        "packages/config",
        "packages/db",
        "packages/shared",
      ])
        expect(fs.existsSync(path.join(root, ws, "package.json"))).toBe(true);
    });

    it("leaves no template placeholders behind", () => {
      run(["my-project", "--scope", "acme", ...OFFLINE], dir);
      const root = path.join(dir, "my-project");
      for (const file of files(root)) {
        const text = fs.readFileSync(file, "utf8");
        expect(text, file).not.toContain("@repo/");
        expect(text, file).not.toContain("my-pyro-app");
      }
    });

    it("names compose projects after the project", () => {
      run(["my-project", "-y", ...OFFLINE], dir);
      const root = path.join(dir, "my-project");
      expect(read(root, "compose.yml")).toContain("name: my-project\n");
      expect(read(root, "compose.dev.yml")).toContain("name: my-project-dev\n");
    });

    it("writes a .env with fresh, consistent secrets", () => {
      run(["my-project", "-y", ...OFFLINE], dir);
      const env = Object.fromEntries(
        read(dir, "my-project", ".env")
          .split("\n")
          .filter((line) => line.includes("="))
          .map((line) => line.split(/=(.*)/s).slice(0, 2)),
      );
      expect(env.BETTER_AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
      expect(env.POSTGRES_PASSWORD).not.toBe("password");
      expect(new URL(env.DATABASE_URL).password).toBe(env.POSTGRES_PASSWORD);
    });
  });

  describe("package scope", () => {
    it("defaults to the project name", () => {
      run(["my-project", "-y", ...OFFLINE], dir);
      const pkg = JSON.parse(
        read(dir, "my-project", "apps", "api", "package.json"),
      );
      expect(pkg.name).toBe("@my-project/api");
      expect(pkg.dependencies["@my-project/db"]).toBe("workspace:*");
    });

    it("rewrites imports and Dockerfile filters to the chosen scope", () => {
      run(["my-project", "--scope", "@Acme", ...OFFLINE], dir);
      const root = path.join(dir, "my-project");
      expect(read(root, "apps/api/src/lib/auth.ts")).toContain(
        'from "@acme/db"',
      );
      expect(read(root, "apps/api/Dockerfile")).toContain(
        "--filter @acme/api...",
      );
    });

    it("rejects an invalid scope", () => {
      const result = run(
        ["my-project", "--scope", "no spaces", ...OFFLINE],
        dir,
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("Invalid --scope");
      expect(fs.existsSync(path.join(dir, "my-project"))).toBe(false);
    });
  });

  describe("options", () => {
    it("initializes git with an initial commit when asked", () => {
      const result = run(["my-project", "-y", "--git", "--no-install"], dir);
      expect(result.status).toBe(0);
      const log = spawnSync("git", ["log", "--oneline"], {
        cwd: path.join(dir, "my-project"),
        encoding: "utf8",
      });
      expect(log.stdout).toContain("Initial commit from create-pyro");
    });

    it("skips git and install with the --no flags", () => {
      const result = run(["my-project", "-y", ...OFFLINE], dir);
      expect(result.status).toBe(0);
      const root = path.join(dir, "my-project");
      expect(fs.existsSync(path.join(root, ".git"))).toBe(false);
      expect(fs.existsSync(path.join(root, "node_modules"))).toBe(false);
      expect(result.stdout).toContain("pnpm install");
    });

    it("prints usage for --help", () => {
      const result = run(["--help"], dir);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Usage: create-pyro");
    });
  });
});
