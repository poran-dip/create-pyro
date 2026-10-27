import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/** The placeholders the template uses, rewritten in every scaffolded file. */
export const TEMPLATE_SCOPE = "repo";
export const TEMPLATE_NAME = "my-pyro-app";

/** npm strips these from published packages, so the template stores them renamed. */
const RENAMED_FILES: Record<string, string> = {
  gitignore: ".gitignore",
};

const VALID_SCOPE = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Turns a directory name into something valid as an npm package name, a
 * docker compose project name and a Postgres-friendly identifier.
 */
export function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

/** Normalizes a scope as typed (`@acme`, `Acme`) to its bare form (`acme`). */
export function normalizeScope(input: string): string {
  return input.trim().replace(/^@/, "").replace(/\/$/, "").toLowerCase();
}

export function validateScope(scope: string): true | string {
  if (!scope) return "Scope cannot be empty";
  if (scope.length > 214) return "Scope is too long";
  if (!VALID_SCOPE.test(scope))
    return "Use lowercase letters, digits, '-', '.' or '_', starting with a letter or digit";
  return true;
}

/** True when `dir` is missing or has nothing in it but a `.git` folder. */
export function isEmptyDir(dir: string): boolean {
  if (!fs.existsSync(dir)) return true;
  return fs.readdirSync(dir).every((entry) => entry === ".git");
}

export type ScaffoldOptions = {
  templateDir: string;
  dest: string;
  /** Package name and compose project name, already slugified. */
  name: string;
  /** Workspace package scope, without the leading `@`. */
  scope: string;
};

export function scaffold({ templateDir, dest, name, scope }: ScaffoldOptions) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(templateDir, dest, { recursive: true });

  for (const [from, to] of Object.entries(RENAMED_FILES)) {
    const source = path.join(dest, from);
    if (fs.existsSync(source)) fs.renameSync(source, path.join(dest, to));
  }

  for (const file of walk(dest)) {
    const buffer = fs.readFileSync(file);
    if (buffer.includes(0)) continue; // binary, leave it alone

    const original = buffer.toString("utf8");
    const rewritten = original
      // A Windows checkout with core.autocrlf has CRLF, which the scaffold's
      // Biome config (LF) would reject on its first lint.
      .replaceAll("\r\n", "\n")
      .replaceAll(`@${TEMPLATE_SCOPE}/`, `@${scope}/`)
      .replaceAll(TEMPLATE_NAME, name);
    if (rewritten !== original) fs.writeFileSync(file, rewritten);
  }

  writeEnv(dest);
}

/**
 * Creates `.env` from `.env.example` with fresh secrets, so the project runs
 * without any manual setup.
 */
export function writeEnv(dest: string) {
  const example = path.join(dest, ".env.example");
  const target = path.join(dest, ".env");
  if (!fs.existsSync(example) || fs.existsSync(target)) return;

  const dbPassword = randomBytes(16).toString("hex");
  const authSecret = randomBytes(32).toString("base64url");

  const lines = fs
    .readFileSync(example, "utf8")
    .split("\n")
    .map((line) => {
      if (line.startsWith("POSTGRES_PASSWORD="))
        return `POSTGRES_PASSWORD=${dbPassword}`;
      if (line.startsWith("BETTER_AUTH_SECRET="))
        return `BETTER_AUTH_SECRET=${authSecret}`;
      if (line.startsWith("DATABASE_URL=")) {
        const url = new URL(line.slice("DATABASE_URL=".length));
        url.password = dbPassword;
        return `DATABASE_URL=${url.toString()}`;
      }
      return line;
    });

  fs.writeFileSync(target, lines.join("\n"));
}

function* walk(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}
