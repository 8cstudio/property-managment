import { getAccountPortalRoles, getAccountState } from "@/server/accounts";
import { ok, route } from "@/server/http";

export const runtime = "nodejs";

/** Public: lets the sign-in form choose password entry vs. first-time setup. */
export const GET = route(async (req) => {
  const params = new URL(req.url).searchParams;
  const email = params.get("email") ?? "";
  const portalRole = params.get("portalRole")?.trim() ?? "";
  const state = await getAccountState(email);
  const roles = await getAccountPortalRoles(email);
  const portalAllowed =
    !portalRole || roles.includes(portalRole) || roles.includes("super-admin");
  return ok({ state, roles, portalAllowed });
});
