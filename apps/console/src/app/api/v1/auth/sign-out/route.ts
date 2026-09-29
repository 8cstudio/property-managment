import { getAuthProvider } from "@/server/auth-provider";
import { ok, route } from "@/server/http";
import {
  clearSessionCookie,
  destroySession,
  readSessionToken,
} from "@/server/session";

export const runtime = "nodejs";

export const POST = route(async () => {
  const token = await readSessionToken();
  if (token) {
    const session = await destroySession(token);
    if (session?.refreshToken) {
      await getAuthProvider().revoke(session.refreshToken);
    }
  }
  await clearSessionCookie();
  return ok({ ok: true });
});
