/**
 * Create the platform super-admin in Supabase Auth + Postgres mirror.
 *
 *   pnpm --filter @ezzi/console db:seed-admin
 *
 * Uses EZZI_SUPER_ADMIN_* from apps/console/.env.local (or defaults).
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

const url = process.env.SUPABASE_URL?.trim()?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl =
  process.env.SUPABASE_DB_URL?.trim() ?? process.env.DATABASE_URL?.trim();

const email = (
  process.env.EZZI_SUPER_ADMIN_EMAIL?.trim() || "admin@ezzi.app"
).toLowerCase();
const password = process.env.EZZI_SUPER_ADMIN_PASSWORD || "admin12345";
const name = process.env.EZZI_SUPER_ADMIN_NAME?.trim() || "Platform Admin";

if (!url || !serviceKey || !dbUrl) {
  console.error(
    "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_DB_URL in .env.local",
  );
  process.exit(1);
}

/** @type {{ id: string; email: string; user_metadata?: { name?: string } } | null} */
let authUser = null;

const listRes = await fetch(
  `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
  {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  },
);

if (listRes.ok) {
  const body = await listRes.json();
  const users = body.users ?? (body.id ? [body] : []);
  if (Array.isArray(users)) {
    authUser =
      users.find((u) => String(u.email ?? "").toLowerCase() === email) ??
      null;
    if (authUser) console.log("GoTrue user already exists:", authUser.id);
  }
}

if (!authUser) {
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    }),
  });
  if (!createRes.ok) {
    console.error("Create GoTrue user failed:", await createRes.text());
    process.exit(1);
  }
  authUser = await createRes.json();
  console.log("Created GoTrue user:", authUser.id);
} else {
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
    console.warn("Could not reset password:", await updateRes.text());
  } else {
    console.log("Password updated for", email);
  }
}

const sql = postgres(dbUrl, { prepare: false, max: 1 });
try {
  await sql.unsafe(`
    alter table public.chat_messages
      add column if not exists receipts jsonb not null default '[]'::jsonb;
  `);
  const mirror = await sql`
    select id from app_users where lower(email) = lower(${email}) limit 1
  `;
  if (mirror[0] && mirror[0].id !== authUser.id) {
    await sql`
      delete from platform_super_admins where user_id = ${mirror[0].id}
    `;
    await sql`delete from app_users where id = ${mirror[0].id}`;
    console.log("Removed stale mirror row (id mismatch with GoTrue).");
  }
  await sql`
    insert into app_users (id, email, name, activated, created_at)
    values (
      ${authUser.id},
      ${email},
      ${name},
      true,
      now()
    )
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      activated = true
  `;
  await sql`delete from platform_super_admins`;
  await sql`
    insert into platform_super_admins (user_id)
    values (${authUser.id})
    on conflict do nothing
  `;
  console.log("Postgres mirror + platform_super_admins OK for", email);
} finally {
  await sql.end({ timeout: 5 });
}

console.log("\nSign in at /role/super-admin/sign-in");
console.log("  email:", email);
console.log("  password: (EZZI_SUPER_ADMIN_PASSWORD or default admin12345)");
