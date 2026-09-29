import { ok, readJson, requireSuperAdmin, requireViewer, route } from "@/server/http";
import { createOrganisation } from "@/server/orgs";
import { listAllOrgs, listAllStaff } from "@/server/repo";

export const runtime = "nodejs";

/** List organisations + memberships, scoped to the caller. */
export const GET = route(async () => {
  const viewer = await requireViewer();
  const [orgs, staff] = await Promise.all([listAllOrgs(), listAllStaff()]);
  if (viewer.isSuperAdmin) {
    return ok({ orgs, staff });
  }
  const orgIds = new Set(viewer.memberships.map((m) => m.orgId));
  return ok({
    orgs: orgs.filter((o) => orgIds.has(o.id)),
    staff: staff.filter((s) => orgIds.has(s.orgId)),
  });
});

/** Create an organisation and its first org-admin (super-admin only). */
export const POST = route(async (req) => {
  await requireSuperAdmin();
  const body = await readJson(req);
  const result = await createOrganisation({
    name: String(body.name ?? ""),
    branch: String(body.branch ?? ""),
    adminEmail: String(body.adminEmail ?? body.admin ?? ""),
    ...(body.adminName ? { adminName: String(body.adminName) } : {}),
    ...(body.modules && typeof body.modules === "object"
      ? { modules: body.modules as Record<string, boolean> }
      : {}),
  });
  return ok({ org: result.org, staff: result.staff, adminCreated: result.adminCreated }, 201);
});
