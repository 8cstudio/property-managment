import "server-only";

/**
 * Runtime configuration for the console API layer.
 *
 * The app runs in one of two modes:
 *  - "local"    : file-backed store + local credential auth. Used until real
 *                 Supabase credentials are supplied. No external calls.
 *  - "supabase" : Supabase Auth (GoTrue) + Postgres (SUPABASE_DB_URL). Enabled
 *                 when SUPABASE_URL, keys, and SUPABASE_DB_URL are all set.
 */
export type BackendMode = "local" | "supabase";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

/** Direct Postgres URL (Supabase pooler or direct). Required in supabase mode. */
export function getDatabaseUrl(): string | null {
  const raw =
    process.env.SUPABASE_DB_URL?.trim() ??
    process.env.DATABASE_URL?.trim() ??
    null;
  return raw || null;
}

function readSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const dbUrl = getDatabaseUrl();
  if (!url || !serviceRoleKey || !anonKey || !dbUrl) return null;
  return { url: url.replace(/\/$/, ""), anonKey, serviceRoleKey };
}

const supabaseConfig = readSupabaseConfig();

export const backendMode: BackendMode = supabaseConfig ? "supabase" : "local";

export function getSupabaseConfig(): SupabaseConfig {
  if (!supabaseConfig) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_DB_URL.",
    );
  }
  return supabaseConfig;
}

/** Secret used to sign local session cookies. A dev default is used when unset. */
export const sessionSecret =
  process.env.SESSION_SECRET?.trim() ||
  "ezzi-dev-session-secret-change-me-in-production";

export const sessionCookieName = "ezzi_session";

/** Session lifetime in seconds (default 7 days). */
export const sessionTtlSeconds = 60 * 60 * 24 * 7;

/**
 * Bootstrap platform super-admin when the database has no admin yet (local file
 * or Supabase Postgres + GoTrue).
 */
export const bootstrapSuperAdmin = {
  email:
    process.env.EZZI_SUPER_ADMIN_EMAIL?.trim().toLowerCase() ||
    "admin@ezzi.app",
  password: process.env.EZZI_SUPER_ADMIN_PASSWORD || "admin12345",
  name: process.env.EZZI_SUPER_ADMIN_NAME?.trim() || "Platform Admin",
};
