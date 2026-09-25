# Supabase migration

No domain, application, or UI change. Swap env and adapters only.

1. Set `DATABASE_URL` to the pooled Supabase URL and `DIRECT_DATABASE_URL` to the direct URL. The database client uses `prepare: false` for the pooler.
2. Run the committed SQL migrations, including roles, grants, and RLS, against `DIRECT_DATABASE_URL`.
3. Select the Supabase auth and storage adapters. Local adapters stay the default for this machine.
4. Move data with `pg_dump` / `pg_restore`. Internal ids stay as they are. `source_system`, `source_id`, and `import_batch_id` stay on the row.
5. Enable RLS only after the auth adapter sets the organisation on the connection. Until then, the repository helper is the enforcement point.

Extensions allowed: `pgcrypto`, `pg_trgm`, `unaccent`, `pgvector`.

Checklist: domain and application still do not import Supabase, Drizzle, or Next.js. `pnpm boundaries` still passes.
