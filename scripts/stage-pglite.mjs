#!/usr/bin/env node
/**
 * Nitro bundles PGLite's JS into the Vercel function but not the data files
 * that module loads beside itself. Without them the deployed app 500s.
 * Neon skips this path when DATABASE_URL is set.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, ".vercel/output/functions/__server.func/_libs");
const src = join(root, "node_modules/@electric-sql/pglite/dist");

if (!existsSync(dest) || !existsSync(src)) {
  console.log("[pglite] function bundle not present — nothing to stage.");
  process.exit(0);
}

for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  const from = join(src, name);
  if (!existsSync(from)) {
    console.error(`[pglite] missing ${name}`);
    process.exit(1);
  }
  copyFileSync(from, join(dest, name));
}
console.log("[pglite] staged data files next to the function bundle.");
