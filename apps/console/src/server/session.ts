import "server-only";
import { cookies } from "next/headers";
import {
  sessionCookieName,
  sessionSecret,
  sessionTtlSeconds,
} from "./config";
import { newToken, sign, unsign } from "./crypto";
import { bootstrapSuperAdmin } from "./config";
import { backendMode } from "./config";
import {
  pgBuildViewer,
  pgDeleteSession,
  pgFindSessionByToken,
  pgInsertSession,
} from "./pg-auth";
import { buildViewer, ensureSuperAdminByEmail } from "./repo";
import { mutate } from "./store";
import type { LocalSession, Viewer } from "./types";

/** Create a server session for a user and return the opaque cookie token. */
export async function createSession(
  userId: string,
  refreshToken?: string,
): Promise<string> {
  const token = newToken();
  const now = Date.now();
  const record: LocalSession = {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + sessionTtlSeconds * 1000).toISOString(),
    ...(refreshToken ? { refreshToken } : {}),
  };
  if (backendMode === "supabase") {
    await pgInsertSession(record);
    return token;
  }
  await mutate((db) => {
    db.localSessions = db.localSessions.filter(
      (s) => new Date(s.expiresAt).getTime() > now,
    );
    db.localSessions.push(record);
  });
  return token;
}

async function findSession(token: string): Promise<LocalSession | null> {
  if (backendMode === "supabase") {
    return pgFindSessionByToken(token);
  }
  const { loadDb } = await import("./store");
  const db = await loadDb();
  const session = db.localSessions.find((s) => s.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
  return session;
}

export async function destroySession(
  token: string,
): Promise<LocalSession | null> {
  if (backendMode === "supabase") {
    const session = await pgFindSessionByToken(token);
    if (session) await pgDeleteSession(token);
    return session;
  }
  return mutate((db) => {
    const session = db.localSessions.find((s) => s.token === token) ?? null;
    db.localSessions = db.localSessions.filter((s) => s.token !== token);
    return session;
  });
}

/** Write the signed session cookie on the response. */
export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(sessionCookieName, sign(token, sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(sessionCookieName);
}

/** Read and verify the session token from the request cookie. */
export async function readSessionToken(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(sessionCookieName)?.value;
  if (!raw) return null;
  return unsign(raw, sessionSecret);
}

/** Resolve the current authenticated caller, or null when signed out. */
export async function resolveViewer(): Promise<Viewer | null> {
  const token = await readSessionToken();
  if (!token) return null;
  const session = await findSession(token);
  if (!session) return null;
  if (backendMode === "supabase") {
    let viewer = await pgBuildViewer(session.userId);
    if (
      viewer?.user.email.toLowerCase() ===
      bootstrapSuperAdmin.email.toLowerCase()
    ) {
      await ensureSuperAdminByEmail(viewer.user.email);
      viewer = await pgBuildViewer(session.userId);
    }
    return viewer;
  }
  const { getUserById } = await import("./repo");
  const user = await getUserById(session.userId);
  if (
    user &&
    user.email.toLowerCase() === bootstrapSuperAdmin.email.toLowerCase()
  ) {
    await ensureSuperAdminByEmail(user.email);
  }
  return buildViewer(session.userId);
}
