"use client";

import type { DeskState, Office, Org, OrgSettings, StaffUser } from "./data";

/** Desk demo data via /api/v1/desk (org requests use /api/v1/org-requests). */
export type DeskCollections = Omit<DeskState, "orgs" | "users" | "requests">;

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    return body.detail || body.title || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as T;
}

/** Load organisations + memberships, scoped to the signed-in user. */
export async function fetchIdentity(signal?: AbortSignal): Promise<{
  orgs: Org[];
  staff: StaffUser[];
}> {
  const res = await fetch("/api/v1/orgs", { cache: "no-store", signal });
  return jsonOrThrow(res);
}

export async function createOrgApi(input: {
  name: string;
  branch: string;
  adminEmail: string;
  adminName?: string;
  modules?: Record<string, boolean>;
}): Promise<{ org: Org; staff: StaffUser }> {
  const res = await fetch("/api/v1/orgs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return jsonOrThrow(res);
}

export async function patchOrgApi(
  id: string,
  patch: Partial<
    Pick<
      Org,
      | "name"
      | "legalName"
      | "companyNumber"
      | "billingEmail"
      | "status"
      | "reason"
      | "modules"
      | "offices"
    > & { settings: Partial<OrgSettings> }
  >,
): Promise<Org> {
  const res = await fetch(`/api/v1/orgs/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const body = await jsonOrThrow<{ org: Org }>(res);
  return body.org;
}

export async function addOrgUserApi(
  orgId: string,
  input: {
    name: string;
    email: string;
    role: string;
    scope?: string;
  },
): Promise<StaffUser> {
  const res = await fetch(`/api/v1/orgs/${orgId}/users`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await jsonOrThrow<{ staff: StaffUser }>(res);
  return body.staff;
}

export async function patchOrgUserApi(
  orgId: string,
  staffId: string,
  patch: Partial<Pick<StaffUser, "name" | "email" | "role" | "scope" | "status" | "statusNote">>,
): Promise<StaffUser> {
  const res = await fetch(`/api/v1/orgs/${orgId}/users/${staffId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const body = await jsonOrThrow<{ staff: StaffUser }>(res);
  return body.staff;
}

export async function removeOrgUserApi(
  orgId: string,
  staffId: string,
): Promise<void> {
  const res = await fetch(`/api/v1/orgs/${orgId}/users/${staffId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(await readError(res));
}

/** Load the shared desk collections, or null if none have been saved yet. */
export async function fetchDeskCollections(
  signal?: AbortSignal,
): Promise<DeskCollections | null> {
  const res = await fetch("/api/v1/desk", { cache: "no-store", signal });
  const body = await jsonOrThrow<{ collections: DeskCollections | null }>(res);
  return body.collections;
}

/** Persist the shared desk collections. */
export async function saveDeskCollections(
  collections: DeskCollections,
): Promise<void> {
  const res = await fetch("/api/v1/desk", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ collections }),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export type { Office };
