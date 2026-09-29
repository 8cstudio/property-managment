/**
 * Apply supabase/schema.sql to the database in SUPABASE_DB_URL.
 *
 *   pnpm --filter @ezzi/console db:apply
 */
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");

function loadEnvFile(relativePath) {
  const path = join(appRoot, relativePath);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const url =
  process.env.SUPABASE_DB_URL?.trim() ?? process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Set SUPABASE_DB_URL or DATABASE_URL.");
  process.exit(1);
}

const schemaPath = join(appRoot, "supabase", "schema.sql");
const sqlText = await readFile(schemaPath, "utf8");

const sql = postgres(url, { prepare: false, max: 1 });
try {
  await sql.unsafe(sqlText);
  console.log("Schema applied:", schemaPath);
} finally {
  await sql.end({ timeout: 5 });
}
