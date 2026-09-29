import {
  displayRoleToSlug,
  type OrgRole,
  PORTAL_ACCESS_SLUGS,
} from "./staff-roles";

function membershipRoleToSlug(role: string): OrgRole | null {
  if ((PORTAL_ACCESS_SLUGS as readonly string[]).includes(role)) {
    return role as OrgRole;
  }
  return displayRoleToSlug(role);
}

/** Portal routes a user may open without an org membership row. */
export const SELF_SERVE_PORTAL_ROLES = new Set<string>([
  "tenant",
  "landlord",
  "contractor",
]);

export type ViewerMembership = {
  orgId: string;
  role: string;
  status: string;
};

export type ViewerAccess = {
  isSuperAdmin: boolean;
  memberships: ViewerMembership[];
  roles?: string[];
};

/** Distinct portal slugs (super-admin + every org membership access role). */
export function computePortalRoles(input: {
  isSuperAdmin: boolean;
  memberships: ViewerMembership[];
}): string[] {
  const slugs = new Set<string>();
  if (input.isSuperAdmin) slugs.add("super-admin");
  for (const row of input.memberships) {
    if (row.status !== "active") continue;
    const slug = membershipRoleToSlug(row.role);
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

export function attachPortalRoles<T extends ViewerAccess>(
  viewer: T,
): T & { roles: string[] } {
  const roles = viewer.roles?.length
    ? [...new Set(viewer.roles)]
    : computePortalRoles(viewer);
  return { ...viewer, roles };
}

/** Whether this signed-in identity may use a role-scoped area of the console. */
export function portalRoleAllowed(viewer: ViewerAccess, portalRole: string): boolean {
  if (portalRole === "super-admin") return viewer.isSuperAdmin;
  if (viewer.isSuperAdmin) return true;

  const roles = viewer.roles?.length ? viewer.roles : computePortalRoles(viewer);
  if (roles.includes(portalRole)) return true;

  const active = viewer.memberships.filter((m) => m.status === "active");
  if (active.some((m) => membershipRoleToSlug(m.role) === portalRole)) {
    return true;
  }

  return SELF_SERVE_PORTAL_ROLES.has(portalRole);
}
