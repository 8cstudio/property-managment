import { ok, readJson, requireOrgRole, route } from "@/server/http";
import { removeOrgUser, updateOrgUser } from "@/server/orgs";
import type { StaffUser } from "@/features/workspace/data";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; staffId: string }> };

export const PATCH = route<Ctx>(async (req, ctx) => {
  const { id, staffId } = await ctx.params;
  await requireOrgRole(id, ["org-admin"]);
  const body = (await readJson(req)) as Partial<StaffUser>;
  const staff = await updateOrgUser(id, staffId, {
    ...(body.name !== undefined ? { name: String(body.name) } : {}),
    ...(body.email !== undefined ? { email: String(body.email) } : {}),
    ...(body.role !== undefined ? { role: String(body.role) } : {}),
    ...(body.scope !== undefined ? { scope: String(body.scope) } : {}),
    ...(body.status !== undefined
      ? { status: body.status as StaffUser["status"] }
      : {}),
    ...(body.statusNote !== undefined
      ? { statusNote: String(body.statusNote) }
      : {}),
  });
  return ok({ staff });
});

export const DELETE = route<Ctx>(async (_req, ctx) => {
  const { id, staffId } = await ctx.params;
  await requireOrgRole(id, ["org-admin"]);
  await removeOrgUser(id, staffId);
  return ok({ ok: true });
});
