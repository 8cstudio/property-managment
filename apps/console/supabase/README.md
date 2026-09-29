# Supabase setup (console)

1. In the Supabase dashboard → **Project Settings → API**, copy:
   - Project URL → `SUPABASE_URL`
   - `anon` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

2. In **Database → Connection string**, copy the **URI** (pooler `6543` or direct `5432`) → `SUPABASE_DB_URL`.

3. Create `apps/console/.env.local` (gitignored):

```env
SUPABASE_URL=https://YOUR_REF.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=postgresql://postgres.YOUR_REF:YOUR_PASSWORD@....pooler.supabase.com:6543/postgres
SESSION_SECRET=change-me
```

4. Apply schema:

```bash
pnpm --filter @ezzi/console db:apply
```

5. Start the app. On first load it creates the platform super-admin in GoTrue and Postgres (`EZZI_SUPER_ADMIN_*` env vars).

Legacy `app_state` JSON blob is removed; data lives in the relational tables in `schema.sql`.
