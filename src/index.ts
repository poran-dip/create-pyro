#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import prompts from "prompts";

const __dirname = import.meta.dirname;

const arg = process.argv[2];

const { targetDir } = arg
  ? { targetDir: arg }
  : await prompts(
      {
        type: "text",
        name: "targetDir",
        message: "Project name:",
        initial: "my-pyro-app",
        validate: (value) =>
          value.trim() ? true : "Project name cannot be empty",
      },
      {
        onCancel: () => {
          process.exit(0);
        },
      },
    );

if (!targetDir) process.exit(0);

const dest =
  targetDir === "." ? process.cwd() : path.resolve(process.cwd(), targetDir);

const projectName = path.basename(dest);

if (
  fs.existsSync(dest) &&
  fs.readdirSync(dest).length > 0 &&
  targetDir !== "."
) {
  console.error(`\n❌ Directory "${projectName}" already exists.\n`);
  process.exit(1);
}

fs.cpSync(path.join(__dirname, "../template"), dest, { recursive: true });

fs.renameSync(`${dest}/gitignore`, `${dest}/.gitignore`);

const pkgPath = path.join(dest, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = projectName;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`\n✅ Created ${projectName}! Now run:\n`);
console.log(`  cd ${projectName}`);
console.log(`  pnpm install`);
console.log(`  pnpm dev\n`);
