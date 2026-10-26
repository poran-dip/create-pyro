#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { parseArgs } from "node:util";
import prompts from "prompts";
import {
  isEmptyDir,
  normalizeScope,
  scaffold,
  TEMPLATE_NAME,
  toSlug,
  validateScope,
} from "./scaffold.js";

const HELP = `
Usage: create-pyro [directory] [options]

Options:
  --scope <name>    Package scope for workspace packages (default: project name)
  --git, --no-git   Initialize a git repository (default: ask, then yes)
  --install, --no-install
                    Install dependencies with pnpm (default: ask, then yes)
  -y, --yes         Accept the default for every question not set by a flag
  -h, --help        Show this help
`;

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  allowNegative: true,
  options: {
    scope: { type: "string" },
    git: { type: "boolean" },
    install: { type: "boolean" },
    yes: { type: "boolean", short: "y" },
    help: { type: "boolean", short: "h" },
  },
});

if (flags.help) {
  console.log(HELP);
  process.exit(0);
}

const onCancel = () => process.exit(0);
const useDefaults = flags.yes ?? false;

const fail = (message: string): never => {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
};

// Project directory.

let targetDir = positionals[0];
if (!targetDir && useDefaults) targetDir = TEMPLATE_NAME;
if (!targetDir) {
  ({ targetDir } = await prompts(
    {
      type: "text",
      name: "targetDir",
      message: "Project name:",
      initial: TEMPLATE_NAME,
      validate: (value: string) =>
        toSlug(value === "." ? path.basename(process.cwd()) : value)
          ? true
          : "Project name cannot be empty",
    },
    { onCancel },
  ));
}
if (!targetDir) process.exit(0);

const dest = path.resolve(process.cwd(), targetDir);
const dirName = path.basename(dest);
const name = toSlug(dirName);

if (!name) fail(`Can't derive a package name from "${dirName}".`);
if (!isEmptyDir(dest))
  fail(`Directory "${dirName}" already exists and is not empty.`);

// Remaining options: flags win, then --yes defaults, then prompts.

const flagScope =
  flags.scope !== undefined ? normalizeScope(flags.scope) : undefined;
if (flagScope !== undefined) {
  const valid = validateScope(flagScope);
  if (valid !== true) fail(`Invalid --scope "${flags.scope}": ${valid}`);
}

const answers = await prompts(
  [
    {
      type: flagScope !== undefined || useDefaults ? null : "text",
      name: "scope",
      message: "Package scope (workspace packages are named @scope/...):",
      initial: name,
      format: (value: string) => normalizeScope(value),
      validate: (value: string) => validateScope(normalizeScope(value)),
    },
    {
      type: flags.git !== undefined || useDefaults ? null : "confirm",
      name: "git",
      message: "Initialize a git repository?",
      initial: true,
    },
    {
      type: flags.install !== undefined || useDefaults ? null : "confirm",
      name: "install",
      message: "Install dependencies with pnpm?",
      initial: true,
    },
  ],
  { onCancel },
);

const scope: string = flagScope ?? answers.scope ?? name;
const initGit: boolean = flags.git ?? answers.git ?? true;
const install: boolean = flags.install ?? answers.install ?? true;

// Scaffold.

scaffold({
  templateDir: path.join(import.meta.dirname, "../template"),
  dest,
  name,
  scope,
});

console.log(`\n📦 Scaffolded ${name} with packages scoped @${scope}/*`);

const run = (command: string, args: string[], quiet = false) =>
  spawnSync(command, args, {
    cwd: dest,
    stdio: quiet ? "ignore" : "inherit",
    shell: process.platform === "win32",
  }).status === 0;

let installed = false;
if (install) {
  if (!run("pnpm", ["--version"], true)) {
    console.warn(
      "\n⚠️  pnpm isn't on your PATH, so dependencies weren't installed.\n" +
        "   Enable it with `corepack enable`, then run `pnpm install`.",
    );
  } else {
    console.log("\n📥 Installing dependencies...\n");
    installed = run("pnpm", ["install", "--no-frozen-lockfile"]);
    if (!installed)
      console.warn(
        "\n⚠️  `pnpm install` failed. Fix the error above and rerun it.",
      );
  }
}

if (initGit) {
  if (!run("git", ["--version"], true)) {
    console.warn("\n⚠️  git isn't on your PATH, so no repository was created.");
  } else if (run("git", ["rev-parse", "--is-inside-work-tree"], true)) {
    console.log("\nℹ️  Already inside a git repository, skipped git init.");
  } else {
    run("git", ["init", "--quiet", "--initial-branch=main"], true) ||
      run("git", ["init", "--quiet"], true);
    run("git", ["add", "-A"], true);
    const committed = run(
      "git",
      [
        "commit",
        "--quiet",
        "--no-verify",
        "-m",
        "Initial commit from create-pyro",
      ],
      true,
    );
    console.log(
      committed
        ? "\n🌱 Initialized a git repository with an initial commit."
        : "\n🌱 Initialized a git repository (files staged; commit when ready).",
    );
  }
}

// Next steps.

const steps = [
  path.relative(process.cwd(), dest) &&
    `cd ${path.relative(process.cwd(), dest)}`,
  !installed && "pnpm install",
  "docker compose -f compose.dev.yml up -d",
  "pnpm db:migrate",
  "pnpm dev",
].filter(Boolean);

console.log(`\n✅ Created ${name}! Now run:\n`);
for (const step of steps) console.log(`  ${step}`);
console.log("\nA .env with fresh secrets is already in place.\n");
