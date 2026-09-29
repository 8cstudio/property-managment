import {
  badRequest,
  type IdCtx,
  ok,
  readJson,
  requireSuperAdmin,
  route,
} from "@/server/http";
import { decideOrgRequest } from "@/server/org-requests";

export const runtime = "nodejs";

/** Super-admin: approve (creates org + invited admin) or decline. */
export const PATCH = route<IdCtx>(async (req, ctx) => {
  await requireSuperAdmin();
  const { id } = await ctx.params;
  const body = await readJson(req);
  const status = String(body.status ?? "");
  if (status !== "Approved" && status !== "Declined") {
    throw badRequest('status must be "Approved" or "Declined".');
  }
  const result = await decideOrgRequest(id, status);
  return ok(result);
});
