import "server-only";
import { backendMode, getSupabaseConfig } from "./config";
import { hashPassword, newId, newToken, verifyPassword } from "./crypto";
import { findUserByEmail, getCredential, setCredential } from "./repo";

export type ProviderUser = { id: string; email: string; name: string };

export type VerifiedUser = ProviderUser & { refreshToken?: string };

/**
 * Identity provider seam. `local` uses hashed passwords in the file store;
 * `supabase` uses Supabase Auth (GoTrue) over its REST API (no SDK needed).
 * The provider only handles credentials/identity; org membership and the app
 * user mirror live in the repository.
 */
export interface AuthProvider {
  /**
   * Create an identity for a brand-new user. The mirror row is written by the
   * caller using the returned id. Do not call for existing users.
   */
  createAuthUser(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<ProviderUser>;
  /**
   * Create an invited identity with no usable password. The user activates it
   * later by setting their own password on first sign-in. No email is sent.
   */
  createInvitedUser(input: { email: string; name: string }): Promise<ProviderUser>;
  /** Set (or reset) a user's password by identity id. */
  setPassword(userId: string, password: string): Promise<void>;
  /** Verify email + password. Returns the identity or null when invalid. */
  verifyPassword(email: string, password: string): Promise<VerifiedUser | null>;
  /** Best-effort revoke of a provider-side session. */
  revoke(refreshToken?: string): Promise<void>;
}

// ---- Local -----------------------------------------------------------------

const localProvider: AuthProvider = {
  async createAuthUser({ email, password, name }) {
    const id = newId("usr");
    await setCredential(id, hashPassword(password));
    return { id, email: email.trim().toLowerCase(), name: name.trim() };
  },
  async createInvitedUser({ email, name }) {
    // No credential row yet; the user sets one when they activate.
    const id = newId("usr");
    return { id, email: email.trim().toLowerCase(), name: name.trim() };
  },
  async setPassword(userId, password) {
    await setCredential(userId, hashPassword(password));
  },
  async verifyPassword(email, password) {
    const user = await findUserByEmail(email);
    if (!user) return null;
    const hash = await getCredential(user.id);
    if (!hash || !verifyPassword(password, hash)) return null;
    return { id: user.id, email: user.email, name: user.name };
  },
  async revoke() {
    /* no-op for local sessions */
  },
};

// ---- Supabase (GoTrue over REST) -------------------------------------------

const supabaseProvider: AuthProvider = {
  async createAuthUser({ email, password, name }) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    const res = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { name: name.trim() },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Supabase createUser failed (${res.status}): ${detail}`);
    }
    const body = (await res.json()) as {
      id: string;
      email: string;
      user_metadata?: { name?: string };
    };
    return {
      id: body.id,
      email: body.email,
      name: body.user_metadata?.name ?? name.trim(),
    };
  },
  async createInvitedUser({ email, name }) {
    // Create the GoTrue user with a random password nobody knows. The user
    // replaces it via setPassword when they activate. Email is auto-confirmed.
    return supabaseProvider.createAuthUser({
      email,
      password: `Ez-${newToken()}`,
      name,
    });
  },
  async setPassword(userId, password) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      throw new Error(
        `Supabase setPassword failed (${res.status}): ${await res.text()}`,
      );
    }
  },
  async verifyPassword(email, password) {
    const { url, anonKey } = getSupabaseConfig();
    const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      refresh_token?: string;
      user?: { id: string; email: string; user_metadata?: { name?: string } };
    };
    if (!body.user) return null;
    return {
      id: body.user.id,
      email: body.user.email,
      name: body.user.user_metadata?.name ?? body.user.email,
      ...(body.refresh_token ? { refreshToken: body.refresh_token } : {}),
    };
  },
  async revoke(refreshToken) {
    if (!refreshToken) return;
    const { url, anonKey } = getSupabaseConfig();
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${refreshToken}`,
      },
    }).catch(() => undefined);
  },
};

export function getAuthProvider(): AuthProvider {
  return backendMode === "supabase" ? supabaseProvider : localProvider;
}
