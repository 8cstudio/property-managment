# ADR 004 — Outbox and pg-boss

State changes and domain events commit in one transaction via an outbox table. `apps/worker` relays the outbox and runs pg-boss on Postgres. No Redis is required locally. Handlers are idempotent and failed events can be replayed.
