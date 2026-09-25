# ADR 007 — No Docker for local setup

Developers need Node, pnpm, and native PostgreSQL. The job queue is pg-boss, so Redis is not required. `infra/docker-compose.yml` is optional and no script depends on it. CI may use a Postgres service container.
