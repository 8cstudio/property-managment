import { activateAccount } from "@/server/accounts";
import { forbidden, ok, readJson, requireEmail, requireString, route } from "@/server/http";
import { buildViewer } from "@/server/repo";
import { createSession, setSessionCookie } from "@/server/session";
import { portalRoleAllowed, readPortalRole } from "@/server/viewer-access";

export const runtime = "nodejs";

/**
 * First-time activation for invited users: they set their own password, which
 * signs them in. Only pending (invited) emails are accepted.
 */
export const POST = route(async (req) => {
  const body = await readJson(req);
  const email = requireEmail(body.email);
  const password = requireString(body.password, "password", { min: 8 });
  const portalRole = readPortalRole(body);

  const user = await activateAccount(email, password);

  const token = await createSession(user.id);
  await setSessionCookie(token);

  const viewer = await buildViewer(user.id);
  if (!viewer) throw forbidden("Could not complete activation.");
  if (portalRole && !portalRoleAllowed(viewer, portalRole)) {
    throw forbidden(
      "This account does not have access to that area. Sign in from the portal that matches your assigned role.",
    );
  }
  return ok({ viewer }, 201);
});
