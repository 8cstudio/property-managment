# Ezzi

Multi-tenant property-management platform. Modular monolith, hexagonal modules, one Next.js web app, one worker.

## Layout

- `apps/console` — all web UI: super-admin, org staff, landlord, tenant, contractor (role-scoped; no separate portal app)
- `apps/worker` — outbox, jobs, schedules
- `packages/modules/*` — one bounded context per package
- `packages/platform/*` — ports and adapters
- `packages/shared-kernel` — Result, ids, money, RequestContext

Rules for agents: `.cursor/rules/` and `docs/module-guide.md`. UI copy: `docs/i18n-conventions.md` (never translate org or person names). Do not paste the original architecture prompt into new chats.

## Not installed yet

Dependencies are pinned in `pnpm-workspace.yaml` (catalog). Run `pnpm install` only when asked.

Versions checked on 2026-09-25: Next `16.3.6`, React `19.3.0`, TypeScript `7.0.2`, Tailwind `4.3.3`, Zod `4.6.5`, Drizzle `0.45.3`, Better Auth `1.7.6`, pnpm `12.6.0`. `@types/node` is `24.13.6` to match Node 24 LTS, not the Node 26 type package.
