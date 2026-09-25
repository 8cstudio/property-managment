# ADR 003 — Auth behind a port

Better Auth on Postgres is the local adapter. Use-cases depend on `AuthPort`, not the Better Auth SDK. Supabase Auth is a later adapter (`supabase-auth.adapter.ts`) plus an env change.
