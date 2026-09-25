# API conventions

- JSON at `/api/v1/*`. OpenAPI at `/api/v1/openapi.json`, generated from the same Zod schemas as the use-case DTOs.
- Lists are keyset pages: `limit` plus `cursor`. No offset on large tables.
- List search runs when the user submits (Search button), not on every keystroke. Query params: optional `q` plus filter params (e.g. `status`, `role`). Server-side index or SQL applies both; return keyset pages only.
- Errors are RFC 9457 problem details, mapped from `AppError`.
- Write endpoints accept `Idempotency-Key`.
- Server actions call the same use-cases as the route handlers.
