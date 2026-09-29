import type { Org, OrgRoleDefinition } from "./data";

/** Organisation-level role slugs (match role-card ids used by routing). */
export type OrgRole =
  | "org-admin"
  | "operations"
  | "property"
  | "lettings"
  | "compliance"
  | "finance"
  | "migration"
  | "landlord"
  | "tenant"
  | "contractor";

/** UI display label persisted on StaffUser.role. */
export const DISPLAY_TO_SLUG: Record<string, OrgRole> = {
  "Organisation Admin": "org-admin",
  Operations: "operations",
  "Property Manager": "property",
  Lettings: "lettings",
  Compliance: "compliance",
  Finance: "finance",
  "Migration Admin": "migration",
  Landlord: "landlord",
  Tenant: "tenant",
  Contractor: "contractor",
};

export const SLUG_TO_DISPLAY: Record<OrgRole, string> = Object.fromEntries(
  Object.entries(DISPLAY_TO_SLUG).map(([label, slug]) => [slug, label]),
) as Record<OrgRole, string>;

export const BUILTIN_STAFF_ROLE_LABELS = Object.keys(
  DISPLAY_TO_SLUG,
) as (keyof typeof DISPLAY_TO_SLUG)[];

export const PORTAL_ACCESS_SLUGS: OrgRole[] = [
  "org-admin",
  "operations",
  "property",
  "lettings",
  "compliance",
  "finance",
  "migration",
  "landlord",
  "tenant",
  "contractor",
];

export function displayRoleToSlug(display: string): OrgRole | null {
  return DISPLAY_TO_SLUG[display] ?? null;
}

export function resolveStaffAccessRole(
  roleLabel: string,
  org?: Org | null,
): OrgRole | null {
  const builtIn = displayRoleToSlug(roleLabel);
  if (builtIn) return builtIn;
  const custom = org?.settings.roleCatalog?.find(
    (row) => row.label === roleLabel,
  );
  const access = custom?.access;
  return access && access in SLUG_TO_DISPLAY ? (access as OrgRole) : null;
}

/** Roles an org admin may assign (built-in minus disabled, plus custom catalog). */
export function assignableRoleLabels(org?: Org | null): string[] {
  const disabled = new Set(org?.settings.disabledRoleLabels ?? []);
  const builtIn = BUILTIN_STAFF_ROLE_LABELS.filter(
    (label) => !disabled.has(label),
  );
  const custom =
    org?.settings.roleCatalog?.map((row) => row.label.trim()).filter(Boolean) ??
    [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of [...builtIn, ...custom]) {
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

export function isAssignableOrgRole(
  display: string,
  org?: Org | null,
): boolean {
  const label = display.trim();
  if (!label) return false;
  if (org?.settings.disabledRoleLabels?.includes(label)) return false;
  if (label in DISPLAY_TO_SLUG) return true;
  return (
    org?.settings.roleCatalog?.some((row) => row.label === label) ?? false
  );
}

export function normalizeRoleCatalog(
  rows: OrgRoleDefinition[] | undefined,
): OrgRoleDefinition[] {
  if (!rows?.length) return [];
  const seen = new Set<string>();
  const out: OrgRoleDefinition[] = [];
  for (const row of rows) {
    const label = row.label.trim();
    if (!label || seen.has(label)) continue;
    if (!(row.access in SLUG_TO_DISPLAY)) continue;
    seen.add(label);
    out.push({ label, access: row.access as OrgRole });
  }
  return out;
}
