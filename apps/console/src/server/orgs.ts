import "server-only";
import {
  defaultOrgSettings,
  seedOffice,
} from "@/features/workspace/data";
import { getAuthProvider } from "./auth-provider";
import { newId } from "./crypto";
import { badRequest, conflict, notFound } from "./http";
import {
  findStaffByEmailAndOrg,
  findUserByEmail,
  getOrg,
  getStaff,
  insertOrg,
  insertStaff,
  insertUser,
  listAllOrgs,
  removeStaff,
  updateStaff,
} from "./repo";
import {
  type Org,
  type StaffUser,
  isAssignableOrgRole,
} from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultModules = (): Record<string, boolean> => ({
  Properties: true,
  Lettings: true,
  Compliance: true,
  Maintenance: true,
  Finance: false,
  Migration: false,
});

/**
 * Create an organisation and its first org-admin.
 *
 * - If the admin email already belongs to an EZZI user, that user is reused
 *   (no new identity, no password change) and given an org-admin membership.
 * - Otherwise an invited identity is created with no password. The admin
 *   activates it by entering their email on the sign-in form (no email sent).
 */
export async function createOrganisation(input: {
  name: string;
  branch: string;
  adminEmail: string;
  adminName?: string;
  modules?: Record<string, boolean>;
}): Promise<{ org: Org; staff: StaffUser; adminCreated: boolean }> {
  const name = input.name.trim();
  if (!name) throw badRequest("Organisation name is required.");

  const orgs = await listAllOrgs();
  if (orgs.some((o) => o.name.trim().toLowerCase() === name.toLowerCase())) {
    throw conflict("An organisation with this name already exists.");
  }

  const email = input.adminEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw badRequest("A valid organisation admin email is required.");
  }

  let user = await findUserByEmail(email);
  let adminCreated = false;
  if (!user) {
    const identity = await getAuthProvider().createInvitedUser({
      email,
      name: input.adminName?.trim() || email,
    });
    user = await insertUser({
      id: identity.id,
      email: identity.email,
      name: identity.name,
      activated: false,
    });
    adminCreated = true;
  }

  const orgId = newId("org");
  const branch = input.branch.trim();
  const org: Org = {
    id: orgId,
    name,
    status: "Setup",
    offices: branch ? [seedOffice(orgId, branch, { manager: user.name })] : [],
    modules: input.modules ?? defaultModules(),
    reason: "",
    legalName: name,
    companyNumber: "",
    billingEmail: email,
    settings: defaultOrgSettings(),
  };
  await insertOrg(org);

  const staff: StaffUser = {
    id: newId("mem"),
    name: user.name,
    email: user.email,
    role: "Organisation Admin",
    scope: branch || "All branches",
    // Existing activated users are active immediately; invited/pending users
    // stay "Invited" until they set a password on first sign-in.
    status: user.activated ? "Active" : "Invited",
    orgId,
    statusNote: "",
  };
  await insertStaff(staff);

  return { org, staff, adminCreated };
}

/**
 * Add (invite) a user to an organisation with an org-level role.
 *
 * - Existing EZZI user: reused (no password change), added as a member. If they
 *   have already activated, the membership is Active immediately.
 * - New email: an invited identity is created with no password. The person
 *   activates by entering their email on the sign-in form (no email sent).
 */
export async function addOrgUser(
  orgId: string,
  input: {
    name: string;
    email: string;
    role: string;
    scope?: string;
  },
): Promise<StaffUser> {
  const org = await getOrg(orgId);
  if (!org) throw notFound("Organisation not found.");

  if (!isAssignableOrgRole(input.role, org)) {
    throw badRequest("That role cannot be assigned within an organisation.");
  }

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw badRequest("A valid email is required.");

  if (await findStaffByEmailAndOrg(email, orgId)) {
    throw conflict("This email already has access to this organisation.");
  }

  let user = await findUserByEmail(email);
  if (!user) {
    const identity = await getAuthProvider().createInvitedUser({
      email,
      name: input.name.trim() || email,
    });
    user = await insertUser({
      id: identity.id,
      email: identity.email,
      name: identity.name,
      activated: false,
    });
  }

  const staff: StaffUser = {
    id: newId("mem"),
    name: (input.name.trim() || user.name || email).trim(),
    email,
    role: input.role,
    scope: input.scope?.trim() || "All branches",
    status: user.activated ? "Active" : "Invited",
    orgId,
    statusNote: "",
  };
  await insertStaff(staff);
  return staff;
}

export async function updateOrgUser(
  orgId: string,
  staffId: string,
  patch: {
    name?: string;
    email?: string;
    role?: string;
    scope?: string;
    status?: StaffUser["status"];
    statusNote?: string;
  },
): Promise<StaffUser> {
  const row = await getStaff(staffId);
  if (!row || row.orgId !== orgId) throw notFound("Member not found.");

  const next: Partial<StaffUser> = {};
  if (patch.name !== undefined) next.name = patch.name.trim();
  if (patch.email !== undefined) {
    const email = patch.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw badRequest("A valid email is required.");
    if (email !== row.email) {
      const clash = await findStaffByEmailAndOrg(email, orgId);
      if (clash && clash.id !== staffId) {
        throw conflict("Another member already uses this email.");
      }
    }
    next.email = email;
  }
  if (patch.role !== undefined) {
    const org = await getOrg(orgId);
    if (!org || !isAssignableOrgRole(patch.role, org)) {
      throw badRequest("That role cannot be assigned within an organisation.");
    }
    next.role = patch.role;
  }
  if (patch.scope !== undefined) next.scope = patch.scope.trim();
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.statusNote !== undefined) next.statusNote = patch.statusNote.trim();

  const updated = await updateStaff(staffId, next);
  if (!updated) throw notFound("Member not found.");
  return updated;
}

export async function removeOrgUser(
  orgId: string,
  staffId: string,
): Promise<void> {
  const row = await getStaff(staffId);
  if (!row || row.orgId !== orgId) throw notFound("Member not found.");
  await removeStaff(staffId);
}
