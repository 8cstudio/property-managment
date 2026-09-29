import "server-only";
import { NextResponse } from "next/server";
import { resolveViewer } from "./session";
import { type OrgRole, type Viewer } from "./types";

/** Error carrying an HTTP status, mapped to an RFC 9457 problem document. */
export class HttpError extends Error {
  status: number;
  title: string;
  constructor(status: number, title: string, detail?: string) {
    super(detail ?? title);
    this.status = status;
    this.title = title;
  }
}

export const badRequest = (detail?: string) =>
  new HttpError(400, "Bad Request", detail);
export const unauthorized = (detail?: string) =>
  new HttpError(401, "Unauthorized", detail);
export const forbidden = (detail?: string) =>
  new HttpError(403, "Forbidden", detail);
export const notFound = (detail?: string) =>
  new HttpError(404, "Not Found", detail);
export const conflict = (detail?: string) =>
  new HttpError(409, "Conflict", detail);

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

function problem(error: HttpError): NextResponse {
  return NextResponse.json(
    { type: "about:blank", title: error.title, status: error.status, detail: error.message },
    { status: error.status, headers: { "content-type": "application/problem+json" } },
  );
}

/** Wrap a route handler so thrown HttpErrors become problem responses. */
export function route<C = unknown>(
  handler: (req: Request, ctx: C) => Promise<NextResponse>,
): (req: Request, ctx: C) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof HttpError) return problem(error);
      console.error("[api] unhandled error", error);
      return problem(new HttpError(500, "Internal Server Error"));
    }
  };
}

/** Context for dynamic routes with an `id` param. */
export type IdCtx = { params: Promise<{ id: string }> };

/** Parse a JSON body, throwing 400 on invalid JSON. */
export async function readJson<T = Record<string, unknown>>(
  req: Request,
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
}

export function requireString(
  value: unknown,
  field: string,
  { min = 1, max = 5000 }: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string" || value.trim().length < min) {
    throw badRequest(`"${field}" is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw badRequest(`"${field}" is too long.`);
  return trimmed;
}

export function requireEmail(value: unknown, field = "email"): string {
  const email = requireString(value, field).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw badRequest(`"${field}" must be a valid email address.`);
  }
  return email;
}

// ---- Authorisation guards --------------------------------------------------

export async function requireViewer(): Promise<Viewer> {
  const viewer = await resolveViewer();
  if (!viewer) throw unauthorized("Sign in to continue.");
  return viewer;
}

export async function requireSuperAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.isSuperAdmin) throw forbidden("Platform admins only.");
  return viewer;
}

/** Require the caller to hold one of the given roles in the organisation. */
export async function requireOrgRole(
  orgId: string,
  roles: readonly OrgRole[],
): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.isSuperAdmin) return viewer;
  const membership = viewer.memberships.find(
    (m) => m.orgId === orgId && m.status === "active",
  );
  if (!membership || !roles.includes(membership.role)) {
    throw forbidden("You do not have access to this organisation.");
  }
  return viewer;
}
