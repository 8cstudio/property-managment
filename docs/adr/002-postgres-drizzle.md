# ADR 002 — PostgreSQL and Drizzle

PostgreSQL is the only database, using extensions Supabase already offers. Drizzle runs behind `packages/platform/db`. Migrations are plain SQL in git. Runtime uses the pooled URL with `prepare: false`. Migrations, the worker, and LISTEN/NOTIFY use the direct URL. Ids are UUIDv7 from application code.
