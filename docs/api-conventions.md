# API conventions

- JSON at `/api/v1/*`. OpenAPI at `/api/v1/openapi.json`, generated from the same Zod schemas as the use-case DTOs.
- Lists are keyset pages: `limit` plus `cursor`. No offset on large tables.
- Errors are RFC 9457 problem details, mapped from `AppError`.
- Write endpoints accept `Idempotency-Key`.
- Server actions call the same use-cases as the route handlers.
