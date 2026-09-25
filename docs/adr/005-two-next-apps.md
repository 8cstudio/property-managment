# ADR 005 — Two Next.js apps

`apps/console` is the staff and super-admin surface. `apps/portal` is landlord, tenant, and contractor. They share packages and do not share sessions or route trees, so the portal can scale and be locked down on its own.
