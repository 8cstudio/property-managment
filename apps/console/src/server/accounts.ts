import "server-only";
import { getAuthProvider } from "./auth-provider";
import { badRequest } from "./http";
import {
  activateInvitedMemberships,
  buildViewer,
  findUserByEmail,
  markUserActivated,
} from "./repo";
import type { AppUser } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sign-in form uses this to decide between password entry and activation. */
export type AccountState = "active" | "invited" | "unknown";

export async function getAccountState(email: string): Promise<AccountState> {
  const normalised = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalised)) return "unknown";
  const user = await findUserByEmail(normalised);
  if (!user) return "unknown";
  return user.activated ? "active" : "invited";
}

/** Portal slugs this email may use (from org memberships + super-admin). */
export async function getAccountPortalRoles(email: string): Promise<string[]> {
  const normalised = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalised)) return [];
  const user = await findUserByEmail(normalised);
  if (!user) return [];
  const viewer = await buildViewer(user.id);
  return viewer?.roles ?? [];
}

/**
 * Activate an invited account: the user sets their own password for the first
 * time. Only pending (invited, not yet activated) emails are eligible.
 */
export async function activateAccount(
  email: string,
  password: string,
): Promise<AppUser> {
  const normalised = email.trim().toLowerCase();
  const user = await findUserByEmail(normalised);
  if (!user || user.activated) {
    throw badRequest(
      "This email cannot be activated. Ask an admin to invite you, or sign in normally.",
    );
  }
  if (password.length < 8) {
    throw badRequest("Choose a password of at least 8 characters.");
  }
  await getAuthProvider().setPassword(user.id, password);
  await markUserActivated(user.id);
  await activateInvitedMemberships(user.email);
  return user;
}
