/**
 * Reset a Supabase Auth password (GoTrue) for an invited/org user.
 *
 *   pnpm --filter @ezzi/console db:reset-password -- osman.rashid@convo.com '11111111'
 */
import { existsSync, readFileSync } from "node:fs";
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

const emailArg = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];
if (!emailArg || !password) {
  console.error(
    "Usage: pnpm --filter @ezzi/console db:reset-password -- <email> <password>",
  );
  process.exit(1);
}

const url = process.env.SUPABASE_URL?.trim()?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl =
  process.env.SUPABASE_DB_URL?.trim() ?? process.env.DATABASE_URL?.trim();

if (!url || !serviceKey || !dbUrl) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL.");
  process.exit(1);
}

const listRes = await fetch(
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(emailArg)}`,
  {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  },
);

if (!listRes.ok) {
  console.error("List user failed:", await listRes.text());
  process.exit(1);
}

const body = await listRes.json();
const users = body.users ?? (body.id ? [body] : []);
const authUser = users.find(
  (u) => String(u.email ?? "").trim().toLowerCase() === emailArg,
);
if (!authUser?.id) {
  console.error(
    "No GoTrue user with exact email",
    emailArg,
    users.length ? `(API returned ${users.length} other user(s))` : "",
  );
  process.exit(1);
}

const updateRes = await fetch(`${url}/auth/v1/admin/users/${authUser.id}`, {
  method: "PUT",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ password, email_confirm: true }),
});

if (!updateRes.ok) {
  console.error("Reset password failed:", await updateRes.text());
  process.exit(1);
}

const sql = postgres(dbUrl, { prepare: false, max: 1 });
try {
  await sql`
    update app_users
    set activated = true
    where lower(email) = lower(${emailArg})
  `;
} finally {
  await sql.end({ timeout: 5 });
}

console.log("Password updated for", emailArg, "(GoTrue id:", authUser.id + ")");
