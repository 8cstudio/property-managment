import { getAuthProvider } from "@/server/auth-provider";
import {
  badRequest,
  ok,
  readJson,
  requireString,
  requireViewer,
  route,
  unauthorized,
} from "@/server/http";

export const runtime = "nodejs";

/** Signed-in user replaces their own password after the current one checks out. */
export const POST = route(async (req) => {
  const viewer = await requireViewer();
  const body = await readJson(req);
  const currentPassword = requireString(body.currentPassword, "currentPassword");
  const newPassword = requireString(body.newPassword, "newPassword", { min: 8 });
  if (currentPassword === newPassword) {
    throw badRequest("Choose a different password.");
  }

  const auth = getAuthProvider();
  const verified = await auth.verifyPassword(viewer.user.email, currentPassword);
  if (!verified || verified.id !== viewer.user.id) {
    throw unauthorized("Current password is incorrect.");
  }
  if (verified.refreshToken) {
    await auth.revoke(verified.refreshToken);
  }
  await auth.setPassword(viewer.user.id, newPassword);
  return ok({ ok: true });
});
