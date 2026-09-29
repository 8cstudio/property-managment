import "server-only";
import postgres from "postgres";
import { getDatabaseUrl } from "./config";

let pool: ReturnType<typeof postgres> | null = null;

/** Shared Postgres pool (Supabase direct / pooler URL). */
export function getPg(): ReturnType<typeof postgres> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "SUPABASE_DB_URL (or DATABASE_URL) is required in supabase mode.",
    );
  }
  if (!pool) {
    pool = postgres(url, {
      prepare: false,
      max: 8,
      connect_timeout: 15,
      idle_timeout: 20,
      connection: { statement_timeout: 20_000 },
    });
  }
  return pool;
}
