import type { AuthPort } from "./port";

/** Selected when auth moves to Supabase. Not implemented in this scaffold. */
export function createSupabaseAuthAdapter(): AuthPort {
  throw new Error("Supabase auth adapter is not implemented");
}
