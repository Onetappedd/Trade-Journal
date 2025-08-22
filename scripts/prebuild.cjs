// scripts/prebuild.cjs
const { existsSync } = require("fs");
const { spawnSync } = require("child_process");
const pathsToCheck = ["./prisma/schema.prisma", "./schema.prisma"];

const hasSchema = pathsToCheck.some((p) => existsSync(p));

if (hasSchema) {
  const res = spawnSync("pnpm", ["prisma", "generate"], { stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error("[prebuild] prisma generate failed");
    process.exit(res.status || 1);
  } else {
    console.log("[prebuild] prisma generate completed");
  }
} else {
  console.log("[prebuild] No Prisma schema found, skipping prisma generate");
}
