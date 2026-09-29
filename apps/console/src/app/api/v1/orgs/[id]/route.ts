import {
  forbidden,
  type IdCtx,
  notFound,
  ok,
  readJson,
  requireOrgRole,
  requireSuperAdmin,
  requireViewer,
  route,
} from "@/server/http";
import { getOrg, updateOrg } from "@/server/repo";
import type { Office, Org } from "@/features/workspace/data";

export const runtime = "nodejs";

export const GET = route<IdCtx>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const viewer = await requireViewer();
  if (!viewer.isSuperAdmin && !viewer.memberships.some((m) => m.orgId === id)) {
    throw forbidden("You do not have access to this organisation.");
  }
  const org = await getOrg(id);
  if (!org) throw notFound("Organisation not found.");
  return ok({ org });
});

/**
 * Update an organisation. Lifecycle (status/reason) is super-admin only;
 * profile/settings/modules/offices may be edited by an org admin.
 */
export const PATCH = route<IdCtx>(async (req, ctx) => {
  const { id } = await ctx.params;
  const body = (await readJson(req)) as Partial<Org>;

  const touchesLifecycle = "status" in body || "reason" in body;
  if (touchesLifecycle) await requireSuperAdmin();
  else await requireOrgRole(id, ["org-admin"]);

  const existing = await getOrg(id);
  if (!existing) throw notFound("Organisation not found.");

  const patch: Partial<Org> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.legalName === "string") patch.legalName = body.legalName.trim();
  if (typeof body.companyNumber === "string")
    patch.companyNumber = body.companyNumber.trim();
  if (typeof body.billingEmail === "string")
    patch.billingEmail = body.billingEmail.trim().toLowerCase();
  if (body.settings && typeof body.settings === "object") {
    patch.settings = { ...existing.settings, ...body.settings };
  }
  if (body.modules && typeof body.modules === "object") {
    patch.modules = body.modules as Record<string, boolean>;
  }
  if (Array.isArray(body.offices)) patch.offices = body.offices as Office[];
  if (typeof body.status === "string")
    patch.status = body.status as Org["status"];
  if (typeof body.reason === "string") patch.reason = body.reason.trim();

  const org = await updateOrg(id, patch);
  if (!org) throw notFound("Organisation not found.");
  return ok({ org });
});
