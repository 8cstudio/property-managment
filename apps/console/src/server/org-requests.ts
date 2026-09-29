import "server-only";
import { newId } from "./crypto";
import { badRequest, conflict, notFound } from "./http";
import { createOrganisation } from "./orgs";
import {
  getOrgRequest,
  hasPendingOrgRequestForCompany,
  insertOrgRequest,
  listAllOrgs,
  listOrgRequests,
  updateOrgRequest,
} from "./repo";
import type { OrgRequest } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function companyTaken(company: string): Promise<boolean> {
  const key = company.trim().toLowerCase();
  const orgs = await listAllOrgs();
  if (orgs.some((o) => o.name.trim().toLowerCase() === key)) return true;
  return hasPendingOrgRequestForCompany(company);
}

/** Public: submit a new organisation registration request. */
export async function submitOrgRequest(input: {
  company: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  about: string;
  memberYears?: number;
  memberCount?: number;
  minProperties?: number;
}): Promise<OrgRequest> {
  const company = input.company.trim();
  if (!company) throw badRequest("Company name is required.");
  if (await companyTaken(company)) {
    throw conflict("This organisation name is already registered or pending.");
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw badRequest("A valid email is required.");
  const contact = input.contact.trim();
  if (!contact) throw badRequest("Contact name is required.");

  const row: OrgRequest = {
    id: newId("req"),
    company,
    contact,
    email,
    phone: input.phone.trim(),
    country: input.country.trim(),
    branch: input.branch.trim(),
    about: input.about.trim(),
    memberYears: input.memberYears ?? 0,
    memberCount: input.memberCount ?? 0,
    minProperties: input.minProperties ?? 0,
    status: "Requested",
  };
  return insertOrgRequest(row);
}

export async function listOrgRequestsForAdmin(): Promise<OrgRequest[]> {
  return listOrgRequests();
}

/** Super-admin: decline or approve (creates a real org + invited admin). */
export async function decideOrgRequest(
  id: string,
  status: "Approved" | "Declined",
): Promise<{ request: OrgRequest; orgCreated?: boolean }> {
  const existing = await getOrgRequest(id);
  if (!existing) throw notFound("Request not found.");
  if (existing.status !== "Requested") {
    throw badRequest("This request has already been decided.");
  }

  if (status === "Declined") {
    const request = await updateOrgRequest(id, { status: "Declined" });
    if (!request) throw notFound("Request not found.");
    return { request };
  }

  const orgs = await listAllOrgs();
  if (
    orgs.some(
      (o) =>
        o.name.trim().toLowerCase() === existing.company.trim().toLowerCase(),
    )
  ) {
    throw conflict(
      "An organisation with this name already exists. Decline the request or rename the company.",
    );
  }

  await createOrganisation({
    name: existing.company,
    branch: existing.branch || "Head office",
    adminEmail: existing.email,
    adminName: existing.contact,
  });

  const request = await updateOrgRequest(id, { status: "Approved" });
  if (!request) throw notFound("Request not found.");
  return { request, orgCreated: true };
}
