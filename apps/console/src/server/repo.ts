import "server-only";
import { backendMode } from "./config";
import {
  pgBuildViewer,
  pgFindUserByEmail,
  pgFindUserById,
  pgIsSuperAdmin,
  pgRepairUserMirror,
  pgSetUserActivated,
  pgUpsertAppUser,
} from "./pg-auth";
import {
  ensureHeavyDbLoaded,
  loadDb,
  mergeUserIntoCache,
  mutate,
  patchUserInCache,
  promoteSuperAdmin,
  saveDeskCollectionsCached,
} from "./store";
import {
  type AppUser,
  type DeskCollections,
  type Org,
  type OrgRequest,
  type StaffUser,
  type Viewer,
  resolveStaffAccessRole,
  toPublicUser,
} from "./types";
import { finalizeViewer } from "./viewer-access";

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ---- Users -----------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<AppUser | null> {
  if (backendMode === "supabase") {
    const found = await pgFindUserByEmail(email);
    if (found) return found;
    const repaired = await pgRepairUserMirror(email);
    if (repaired) mergeUserIntoCache(repaired);
    return repaired;
  }
  const db = await loadDb();
  const target = normEmail(email);
  return db.users.find((u) => u.email === target) ?? null;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  if (backendMode === "supabase") return pgFindUserById(id);
  const db = await loadDb();
  return db.users.find((u) => u.id === id) ?? null;
}

/** Insert a mirror user row. `id` should match the identity provider's id. */
export async function insertUser(input: {
  id: string;
  email: string;
  name: string;
  /** Invited users start inactive until they set their own password. */
  activated?: boolean;
}): Promise<AppUser> {
  if (backendMode === "supabase") {
    const user = await pgUpsertAppUser(input);
    mergeUserIntoCache(user);
    return user;
  }
  return mutate((db) => {
    const user: AppUser = {
      id: input.id,
      email: normEmail(input.email),
      name: input.name.trim(),
      createdAt: new Date().toISOString(),
      activated: input.activated ?? true,
    };
    db.users.push(user);
    return user;
  });
}

/** Mark a user as activated (they have set their own password). */
export async function markUserActivated(userId: string): Promise<void> {
  if (backendMode === "supabase") {
    await pgSetUserActivated(userId);
    patchUserInCache(userId, { activated: true });
    return;
  }
  await mutate((db) => {
    const user = db.users.find((u) => u.id === userId);
    if (user) user.activated = true;
  });
}

/** Flip a user's pending "Invited" memberships to "Active" on activation. */
export async function activateInvitedMemberships(email: string): Promise<void> {
  const target = normEmail(email);
  await mutate((db) => {
    for (const s of db.staff) {
      if (s.email.toLowerCase() === target && s.status === "Invited") {
        s.status = "Active";
      }
    }
  });
}

export async function setCredential(
  userId: string,
  passwordHash: string,
): Promise<void> {
  await mutate((db) => {
    const existing = db.credentials.find((c) => c.userId === userId);
    if (existing) existing.passwordHash = passwordHash;
    else db.credentials.push({ userId, passwordHash });
  });
}

export async function getCredential(userId: string): Promise<string | null> {
  const db = await loadDb();
  return db.credentials.find((c) => c.userId === userId)?.passwordHash ?? null;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (backendMode === "supabase") return pgIsSuperAdmin(userId);
  const db = await loadDb();
  return db.superAdmins.includes(userId);
}

/** Promote a user to platform super-admin by email (idempotent). */
export async function ensureSuperAdminByEmail(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) return;
  if (backendMode === "supabase") {
    if (await pgIsSuperAdmin(user.id)) return;
  } else {
    const db = await loadDb();
    if (db.superAdmins.includes(user.id)) return;
  }
  await promoteSuperAdmin(user.id);
}

// ---- Desk collections (shared demo data) -----------------------------------

export async function getDeskCollections(): Promise<DeskCollections | null> {
  const db = await ensureHeavyDbLoaded();
  return db.deskCollections;
}

export async function saveDeskCollections(
  data: DeskCollections,
): Promise<DeskCollections> {
  return saveDeskCollectionsCached(data);
}

// ---- Organisation requests (public submit, super-admin review) --------------

export async function listOrgRequests(): Promise<OrgRequest[]> {
  const db = await loadDb();
  return db.requests;
}

export async function getOrgRequest(id: string): Promise<OrgRequest | null> {
  const db = await loadDb();
  return db.requests.find((r) => r.id === id) ?? null;
}

export async function insertOrgRequest(row: OrgRequest): Promise<OrgRequest> {
  return mutate((db) => {
    db.requests.push(row);
    return row;
  });
}

export async function updateOrgRequest(
  id: string,
  patch: Partial<OrgRequest>,
): Promise<OrgRequest | null> {
  return mutate((db) => {
    const row = db.requests.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch, { id: row.id });
    return row;
  });
}

export async function hasPendingOrgRequestForCompany(
  company: string,
): Promise<boolean> {
  const db = await loadDb();
  const key = company.trim().toLowerCase();
  return db.requests.some(
    (r) =>
      r.status === "Requested" && r.company.trim().toLowerCase() === key,
  );
}

// ---- Organisations ---------------------------------------------------------

export async function listAllOrgs(): Promise<Org[]> {
  const db = await loadDb();
  return db.orgs;
}

export async function getOrg(id: string): Promise<Org | null> {
  const db = await loadDb();
  return db.orgs.find((o) => o.id === id) ?? null;
}

export async function insertOrg(org: Org): Promise<Org> {
  return mutate((db) => {
    db.orgs.push(org);
    return org;
  });
}

export async function updateOrg(
  id: string,
  patch: Partial<Org>,
): Promise<Org | null> {
  return mutate((db) => {
    const org = db.orgs.find((o) => o.id === id);
    if (!org) return null;
    Object.assign(org, patch, { id: org.id });
    return org;
  });
}

// ---- Staff / memberships ---------------------------------------------------

export async function listAllStaff(): Promise<StaffUser[]> {
  const db = await loadDb();
  return db.staff;
}

export async function listStaffForOrg(orgId: string): Promise<StaffUser[]> {
  const db = await loadDb();
  return db.staff.filter((s) => s.orgId === orgId);
}

export async function getStaff(id: string): Promise<StaffUser | null> {
  const db = await loadDb();
  return db.staff.find((s) => s.id === id) ?? null;
}

export async function findStaffByEmailAndOrg(
  email: string,
  orgId: string,
): Promise<StaffUser | null> {
  const db = await loadDb();
  const target = normEmail(email);
  return (
    db.staff.find(
      (s) => s.orgId === orgId && s.email.toLowerCase() === target,
    ) ?? null
  );
}

export async function insertStaff(row: StaffUser): Promise<StaffUser> {
  return mutate((db) => {
    db.staff.push(row);
    return row;
  });
}

export async function updateStaff(
  id: string,
  patch: Partial<StaffUser>,
): Promise<StaffUser | null> {
  return mutate((db) => {
    const row = db.staff.find((s) => s.id === id);
    if (!row) return null;
    Object.assign(row, patch, { id: row.id });
    return row;
  });
}

export async function removeStaff(id: string): Promise<StaffUser | null> {
  return mutate((db) => {
    const row = db.staff.find((s) => s.id === id) ?? null;
    db.staff = db.staff.filter((s) => s.id !== id);
    return row;
  });
}

// ---- Viewer ----------------------------------------------------------------

/** Build the authenticated caller's profile from a user id. */
export async function buildViewer(userId: string): Promise<Viewer | null> {
  if (backendMode === "supabase") return pgBuildViewer(userId);
  const db = await loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  const orgById = new Map(db.orgs.map((org) => [org.id, org]));
  const memberships = db.staff
    .filter((s) => s.email.toLowerCase() === user.email && s.status === "Active")
    .map((s) => {
      const role = resolveStaffAccessRole(s.role, orgById.get(s.orgId));
      return role ? { orgId: s.orgId, role, status: "active" as const } : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
  return finalizeViewer({
    user: toPublicUser(user),
    isSuperAdmin: db.superAdmins.includes(userId),
    memberships,
  });
}
