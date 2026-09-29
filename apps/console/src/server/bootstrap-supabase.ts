import "server-only";
import { getAuthProvider } from "./auth-provider";
import { backendMode, bootstrapSuperAdmin } from "./config";
import type { Db } from "./types";

/**
 * First-run seed for Supabase mode: create the platform super-admin in GoTrue
 * and mirror rows in Postgres. Idempotent when the admin email already exists.
 */
export async function bootstrapSupabase(db: Db): Promise<boolean> {
  if (backendMode !== "supabase") return false;
  const email = bootstrapSuperAdmin.email;
  if (db.users.some((u) => u.email === email)) return false;

  const identity = await getAuthProvider().createAuthUser({
    email,
    password: bootstrapSuperAdmin.password,
    name: bootstrapSuperAdmin.name,
  });

  db.users.push({
    id: identity.id,
    email: identity.email,
    name: identity.name,
    createdAt: new Date().toISOString(),
    activated: true,
  });
  if (!db.superAdmins.includes(identity.id)) {
    db.superAdmins.push(identity.id);
  }
  return true;
}
