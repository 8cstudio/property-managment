# ADR 001 — Modular monolith

One codebase, one database, package boundaries enforced in CI. Console, portal, and the worker are the only deployable processes. A module moves to its own service only after its public API and events are the sole callers.
