import {
  type IdCtx,
  ok,
  readJson,
  requireOrgRole,
  route,
} from "@/server/http";
import { addOrgUser } from "@/server/orgs";
import { listStaffForOrg } from "@/server/repo";

export const runtime = "nodejs";

export const GET = route<IdCtx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  await requireOrgRole(id, ["org-admin"]);
  return ok({ staff: await listStaffForOrg(id) });
});

export const POST = route<IdCtx>(async (req, ctx) => {
  const { id } = await ctx.params;
  await requireOrgRole(id, ["org-admin"]);
  const body = await readJson(req);
  const staff = await addOrgUser(id, {
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    role: String(body.role ?? ""),
    ...(body.scope ? { scope: String(body.scope) } : {}),
  });
  return ok({ staff }, 201);
});
