"use client";

import type { OrgRequest } from "./data";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; title?: string };
    return body.detail || body.title || "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function submitOrgRequestApi(input: {
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
  const res = await fetch("/api/v1/org-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { request: OrgRequest };
  return body.request;
}

export async function fetchOrgRequestsApi(
  signal?: AbortSignal,
): Promise<OrgRequest[]> {
  const res = await fetch("/api/v1/org-requests", { cache: "no-store", signal });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { requests: OrgRequest[] };
  return body.requests;
}

export async function decideOrgRequestApi(
  id: string,
  status: "Approved" | "Declined",
): Promise<{ request: OrgRequest; orgCreated?: boolean }> {
  const res = await fetch(`/api/v1/org-requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as { request: OrgRequest; orgCreated?: boolean };
}
