import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const configured = process.env.DATABASE_URL || "";
const sqlite = !configured || configured.startsWith("file:");
if (!configured) process.env.DATABASE_URL = "file:./build.db";

run("npx", ["prisma", "generate"]);

if (sqlite) {
  run("npx", ["prisma", "db", "push", "--skip-generate"]);
  run("npx", ["tsx", "prisma/seed.ts"]);
}

run("npx", ["next", "build"]);
