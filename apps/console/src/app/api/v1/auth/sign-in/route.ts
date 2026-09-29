import { getAuthProvider } from "@/server/auth-provider";
import { bootstrapSuperAdmin } from "@/server/config";
import {
  forbidden,
  ok,
  readJson,
  requireEmail,
  requireString,
  route,
  unauthorized,
} from "@/server/http";
import {
  portalRoleAllowed,
  readPortalRole,
} from "@/server/viewer-access";
import {
  buildViewer,
  ensureSuperAdminByEmail,
  findUserByEmail,
  insertUser,
} from "@/server/repo";
import { createSession, setSessionCookie } from "@/server/session";

export const runtime = "nodejs";

export const POST = route(async (req) => {
  const body = await readJson(req);
  const email = requireEmail(body.email);
  const password = requireString(body.password, "password");
  const portalRole = readPortalRole(body);

  const verified = await getAuthProvider().verifyPassword(email, password);
  if (!verified) throw unauthorized("Incorrect email or password.");

  // Mirror must match GoTrue identity (stale rows used wrong ids after repair).
  let user = await findUserByEmail(email);
  if (!user || user.id !== verified.id) {
    user = await insertUser({
      id: verified.id,
      email: verified.email,
      name: verified.name,
      activated: true,
    });
  }

  // Promote the designated platform admin (idempotent; covers supabase mode
  // where the local bootstrap seed does not run).
  if (email.toLowerCase() === bootstrapSuperAdmin.email.toLowerCase()) {
    await ensureSuperAdminByEmail(email);
  }

  const token = await createSession(user.id, verified.refreshToken);
  await setSessionCookie(token);

  let viewer = await buildViewer(user.id);
  if (
    email.toLowerCase() === bootstrapSuperAdmin.email.toLowerCase() &&
    viewer &&
    !viewer.isSuperAdmin
  ) {
    await ensureSuperAdminByEmail(email);
    viewer = await buildViewer(user.id);
  }
  if (!viewer) throw unauthorized("Incorrect email or password.");
  if (portalRole && !portalRoleAllowed(viewer, portalRole)) {
    throw forbidden(
      "This account does not have access to that area. Use the portal that matches your role, or ask an admin to assign one.",
    );
  }
  return ok({ viewer });
});
