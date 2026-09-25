# Architecture

Ezzi is one deployable monolith with strict package boundaries, plus a separate worker process. Console and portal scale and ship separately. Modules can later move to their own services because they do not share tables or internal imports.

## Rules

- Domain and application are pure TypeScript.
- Infrastructure implements ports (database, auth, storage, queue, cache, email, search, AI).
- Delivery (`apps/*/src/app`, server actions, worker handlers) calls use-cases only.
- Every tenant table is scoped by `organisation_id` in one repository helper. Branch and portfolio filters are added in that same helper when the query needs them.
- Application code is the access check. Postgres RLS is added at Supabase cutover, not as a second unchecked path.
- Permission keys look like `module.resource.action`. Roles are stored bundles of keys. An organisation admin cannot grant a platform super-admin key.
- Writes that matter emit an outbox event in the same database transaction. The worker delivers it. Handlers are idempotent.
- Heavy work runs on the worker. Lists use keyset pagination.
- Local adapters are selected with env vars. Swapping to Supabase is an adapter and env change.

## Decisions

See `docs/adr/`.
