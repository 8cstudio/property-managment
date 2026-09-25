import type { StoragePort } from "./port";

/** Selected when files move to Supabase Storage. Not implemented in this scaffold. */
export function createSupabaseStorageAdapter(): StoragePort {
  throw new Error("Supabase storage adapter is not implemented");
}
