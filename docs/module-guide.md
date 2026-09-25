# Add a module

Start every module chat with: **follow the organisations reference slice**.

1. `pnpm gen:module <name>`
2. Register the manifest in `apps/console/src/modules.config.ts` (same app serves staff and external roles; gate routes with permissions, not a second app).
3. Copy the organisations flow: domain → use-case → repository → REST route and server action → `src/features/organisations`.
4. Add a cross-organisation denial test. Do not copy another module's tables or folders.

The organisations slice is not implemented yet. Build that slice before copying it. Stub modules have no business rules; do not invent any.

Removing a module: unregister the manifest, delete `packages/modules/<name>`. A boundary check must still pass.
