import { getAuthProvider } from "@/server/auth-provider";
import {
  conflict,
  ok,
  readJson,
  requireEmail,
  requireString,
  route,
} from "@/server/http";
import { buildViewer, findUserByEmail, insertUser } from "@/server/repo";
import { createSession, setSessionCookie } from "@/server/session";

export const runtime = "nodejs";

/**
 * Public self-registration for unaffiliated users (tenant/landlord/contractor).
 * Creates an identity with no organisation membership; admins grant roles.
 */
export const POST = route(async (req) => {
  const body = await readJson(req);
  const email = requireEmail(body.email);
  const name = requireString(body.name, "name");
  const password = requireString(body.password, "password", { min: 8 });

  if (await findUserByEmail(email)) {
    throw conflict("An account already exists for this email. Sign in instead.");
  }

  const created = await getAuthProvider().createAuthUser({
    email,
    password,
    name,
  });
  const user = await insertUser({
    id: created.id,
    email: created.email,
    name: created.name,
  });

  const token = await createSession(user.id);
  await setSessionCookie(token);

  const viewer = await buildViewer(user.id);
  return ok({ viewer }, 201);
});
