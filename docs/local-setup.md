# Local setup

Required: Node 24, pnpm 12, and PostgreSQL installed natively. Docker is optional and unused by the scripts.

1. Install the same PostgreSQL major version as the Supabase project you will migrate to. Confirm that major in the Supabase dashboard before production.
2. Create databases `ezzi_dev` and `ezzi_test`.
3. Copy `.env.example` to `.env`.
4. When asked to install: `pnpm install`, then `pnpm db:migrate` and `pnpm db:seed` after those scripts exist.

Windows, macOS, and Linux use the same `pnpm` scripts. Do not add bash-only scripts.

Optional Docker stack: `infra/docker-compose.yml`. Nothing in the apps reads that file.
