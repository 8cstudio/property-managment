# ADR 006 — Single console web app (supersedes ADR 005)

All product UI ships in **`apps/console`**: platform super-admin, organisation staff, and external personas (landlord, tenant, contractor).

There is **no** separate `apps/portal` Next.js app. “Portal” means **role-scoped routes and shells** inside console (e.g. `/role/tenant/...`), with server-side `can` and tenant scope enforcing what each persona sees.

Deployable web processes: **console** + **worker**. External users may still be isolated later via subdomain, WAF, or auth policies pointing at the same app — not a second codebase.
