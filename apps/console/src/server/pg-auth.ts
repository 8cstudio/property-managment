import "server-only";
import { getSupabaseConfig } from "./config";
import { getPg } from "./postgres-client";
import {
  type AppUser,
  type LocalSession,
  type Org,
  type Viewer,
  resolveStaffAccessRole,
  toPublicUser,
} from "./types";
import { finalizeViewer } from "./viewer-access";

function mapUser(row: {
  id: string;
  email: string;
  name: string;
  activated: boolean;
  created_at: Date;
}): AppUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    activated: row.activated,
    createdAt: row.created_at.toISOString(),
  };
}

export async function pgFindUserByEmail(email: string): Promise<AppUser | null> {
  const db = getPg();
  const rows = await db<
    {
      id: string;
      email: string;
      name: string;
      activated: boolean;
      created_at: Date;
    }[]
  >`
    select id, email, name, activated, created_at
    from app_users
    where lower(email) = lower(${email.trim()})
    limit 1
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function pgFindUserById(id: string): Promise<AppUser | null> {
  const db = getPg();
  const rows = await db<
    {
      id: string;
      email: string;
      name: string;
      activated: boolean;
      created_at: Date;
    }[]
  >`
    select id, email, name, activated, created_at
    from app_users
    where id = ${id}
    limit 1
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

/** Restore app_users row when GoTrue + org membership exist but mirror was wiped. */
export async function pgRepairUserMirror(email: string): Promise<AppUser | null> {
  const normalised = email.trim().toLowerCase();
  const db = getPg();
  const memberships = await db<{ name: string; status: string }[]>`
    select name, status from org_memberships
    where lower(email) = lower(${normalised})
  `;
  if (memberships.length === 0) return null;

  const { url, serviceRoleKey } = getSupabaseConfig();
  const listRes = await fetch(
    `${url}/auth/v1/admin/users?email=${encodeURIComponent(normalised)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!listRes.ok) return null;
  const body = (await listRes.json()) as {
    users?: { id: string; user_metadata?: { name?: string } }[];
    id?: string;
    user_metadata?: { name?: string };
  };
  const authUsers = Array.isArray(body.users)
    ? body.users
    : body.id
      ? [body]
      : [];
  const authUser = authUsers.find(
    (u) =>
      String((u as { email?: string }).email ?? "")
        .trim()
        .toLowerCase() === normalised,
  ) as { id: string; user_metadata?: { name?: string } } | undefined;
  if (!authUser?.id) return null;

  const existing = await pgFindUserById(authUser.id);
  /* Recreated mirror rows must use activation again — Active in staff ≠ password set. */
  const activated = existing?.activated ?? false;
  const name =
    existing?.name ||
    authUser.user_metadata?.name?.trim() ||
    memberships[0]?.name?.trim() ||
    normalised;

  return pgUpsertAppUser({
    id: authUser.id,
    email: normalised,
    name,
    activated,
  });
}

export async function pgSetUserActivated(userId: string): Promise<void> {
  const db = getPg();
  await db`
    update app_users set activated = true where id = ${userId}
  `;
}

export async function pgUpsertAppUser(input: {
  id: string;
  email: string;
  name: string;
  activated?: boolean;
}): Promise<AppUser> {
  const db = getPg();
  const createdAt = new Date().toISOString();
  const rows = await db<
    {
      id: string;
      email: string;
      name: string;
      activated: boolean;
      created_at: Date;
    }[]
  >`
    insert into app_users (id, email, name, activated, created_at)
    values (
      ${input.id},
      ${input.email.trim().toLowerCase()},
      ${input.name.trim()},
      ${input.activated ?? true},
      ${createdAt}::timestamptz
    )
    on conflict (id) do update set
      email = excluded.email,
      name = excluded.name,
      activated = excluded.activated
    returning id, email, name, activated, created_at
  `;
  return mapUser(rows[0]!);
}

export async function pgFindSessionByToken(
  token: string,
): Promise<LocalSession | null> {
  const db = getPg();
  const rows = await db<
    {
      token: string;
      user_id: string;
      created_at: Date;
      expires_at: Date;
      refresh_token: string | null;
    }[]
  >`
    select token, user_id, created_at, expires_at, refresh_token
    from app_sessions
    where token = ${token}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.expires_at.getTime() <= Date.now()) return null;
  return {
    token: row.token,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    ...(row.refresh_token ? { refreshToken: row.refresh_token } : {}),
  };
}

export async function pgInsertSession(session: LocalSession): Promise<void> {
  const db = getPg();
  const now = Date.now();
  await db`
    delete from app_sessions where expires_at <= ${new Date(now).toISOString()}::timestamptz
  `;
  await db`
    insert into app_sessions (
      token, user_id, created_at, expires_at, refresh_token
    )
    values (
      ${session.token},
      ${session.userId},
      ${session.createdAt}::timestamptz,
      ${session.expiresAt}::timestamptz,
      ${session.refreshToken ?? null}
    )
  `;
}

export async function pgDeleteSession(token: string): Promise<void> {
  const db = getPg();
  await db`delete from app_sessions where token = ${token}`;
}

export async function pgIsSuperAdmin(userId: string): Promise<boolean> {
  const db = getPg();
  const rows = await db<{ ok: boolean }[]>`
    select exists(
      select 1 from platform_super_admins where user_id = ${userId}
    ) as ok
  `;
  return Boolean(rows[0]?.ok);
}

export async function pgBuildViewer(userId: string): Promise<Viewer | null> {
  const user = await pgFindUserById(userId);
  if (!user) return null;

  const db = getPg();
  const staffRows = await db<
    {
      org_id: string;
      role: string;
      status: string;
      email: string;
    }[]
  >`
    select org_id, role, status, email
    from org_memberships
    where lower(email) = lower(${user.email})
      and status = 'Active'
  `;

  let orgById = new Map<string, Org>();
  if (staffRows.length > 0) {
    const orgIds = [...new Set(staffRows.map((s) => s.org_id))];
    const orgRows = await db<{ id: string; data: Org }[]>`
      select id, data from organisations where id in ${db(orgIds)}
    `;
    orgById = new Map(orgRows.map((r) => [r.id, r.data]));
  }

  const memberships = staffRows
    .map((s) => {
      const role = resolveStaffAccessRole(s.role, orgById.get(s.org_id));
      return role ? { orgId: s.org_id, role, status: "active" as const } : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  return finalizeViewer({
    user: toPublicUser(user),
    isSuperAdmin: await pgIsSuperAdmin(userId),
    memberships,
  });
}
