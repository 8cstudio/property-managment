import "server-only";
import { attachPortalRoles, portalRoleAllowed } from "@/features/workspace/viewer-access";
import type { Viewer } from "./types";

export { attachPortalRoles, portalRoleAllowed };

export function finalizeViewer(
  partial: Omit<Viewer, "roles"> & { roles?: Viewer["roles"] },
): Viewer {
  return attachPortalRoles(partial) as Viewer;
}

export function readPortalRole(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const raw = (body as { portalRole?: unknown }).portalRole;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed || undefined;
}
