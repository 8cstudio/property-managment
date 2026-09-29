"use client";

import { authKey } from "./auth";
import { portalRoleAllowed } from "./viewer-access";

export type ViewerMembership = {
  orgId: string;
  role: string;
  status: string;
};

export type Viewer = {
  user: { id: string; email: string; name: string };
  isSuperAdmin: boolean;
  memberships: ViewerMembership[];
  /** Portal areas allowed for this user (recomputed on every session/sign-in). */
  roles: string[];
};

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    return body.detail || body.title || "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

const SESSION_TIMEOUT_MS = 25_000;

export async function apiGetSession(): Promise<Viewer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
  try {
    const res = await fetch("/api/v1/auth/session", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { viewer: Viewer | null };
    return body.viewer;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiSignIn(
  email: string,
  password: string,
  portalRole?: string,
): Promise<Viewer> {
  const res = await fetch("/api/v1/auth/sign-in", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      ...(portalRole ? { portalRole } : {}),
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { viewer: Viewer };
  return body.viewer;
}

export async function apiRegister(input: {
  name: string;
  email: string;
  password: string;
}): Promise<Viewer> {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { viewer: Viewer };
  return body.viewer;
}

export async function apiChangePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch("/api/v1/auth/change-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function apiSignOut(): Promise<void> {
  await fetch("/api/v1/auth/sign-out", { method: "POST" }).catch(
    () => undefined,
  );
}

export type AccountState = "active" | "invited" | "unknown";

/** Tells the sign-in form whether to ask for a password or first-time setup. */
export type AccountStateResponse = {
  state: AccountState;
  roles: string[];
  portalAllowed: boolean;
};

export async function apiAccountState(
  email: string,
  portalRole?: string,
): Promise<AccountStateResponse> {
  const unknown: AccountStateResponse = {
    state: "unknown",
    roles: [],
    portalAllowed: false,
  };
  try {
    const qs = new URLSearchParams({ email: email.trim() });
    if (portalRole) qs.set("portalRole", portalRole);
    const res = await fetch(`/api/v1/auth/account-state?${qs}`, {
      cache: "no-store",
    });
    if (!res.ok) return unknown;
    const body = (await res.json()) as AccountStateResponse;
    return {
      state: body.state ?? "unknown",
      roles: Array.isArray(body.roles) ? body.roles : [],
      portalAllowed: body.portalAllowed !== false,
    };
  } catch {
    return unknown;
  }
}

/** First-time activation: an invited user sets their own password and is in. */
export async function apiActivate(
  email: string,
  password: string,
  portalRole?: string,
): Promise<Viewer> {
  const res = await fetch("/api/v1/auth/activate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      ...(portalRole ? { portalRole } : {}),
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { viewer: Viewer };
  return body.viewer;
}

/** Whether a viewer may enter a given role area. */
export function roleAllowed(viewer: Viewer, role: string): boolean {
  return portalRoleAllowed(viewer, role);
}

/**
 * Bridge the real session to the legacy sessionStorage identity used by the
 * desk/messages mock layers during the migration to full APIs.
 */
export function bridgeIdentity(role: string, viewer: Viewer): void {
  try {
    sessionStorage.setItem(authKey(role), viewer.user.email);
  } catch {
    /* ignore */
  }
}

export function clearBridgeIdentity(role: string): void {
  try {
    sessionStorage.removeItem(authKey(role));
  } catch {
    /* ignore */
  }
}
