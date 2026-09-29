import { ok, readJson, requireSuperAdmin, route } from "@/server/http";
import {
  listOrgRequestsForAdmin,
  submitOrgRequest,
} from "@/server/org-requests";

export const runtime = "nodejs";

/** Public: visitor registration form (no sign-in required). */
export const POST = route(async (req) => {
  const body = await readJson(req);
  const request = await submitOrgRequest({
    company: String(body.company ?? ""),
    contact: String(body.contact ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    country: String(body.country ?? ""),
    branch: String(body.branch ?? body.address ?? ""),
    about: String(body.about ?? ""),
    memberYears: Number(body.memberYears ?? 0),
    memberCount: Number(body.memberCount ?? 0),
    minProperties: Number(body.minProperties ?? 0),
  });
  return ok({ request }, 201);
});

/** Super-admin: list all organisation requests. */
export const GET = route(async () => {
  await requireSuperAdmin();
  const requests = await listOrgRequestsForAdmin();
  return ok({ requests });
});
