export const roleCards = [
  {
    id: "super-admin",
    name: "Super Admin",
    line: "Organisations, access, integrations, audit",
  },
  {
    id: "org-admin",
    name: "Organisation Admin",
    line: "Offices, staff, and settings for one organisation",
  },
  {
    id: "operations",
    name: "Operations Manager",
    line: "Today's queue, workload, and blocked items",
  },
  {
    id: "property",
    name: "Property Manager",
    line: "Properties, tenancies, status, and move-out",
  },
  {
    id: "lettings",
    name: "Lettings Agent",
    line: "Listings, applicants, viewings, and offers",
  },
  {
    id: "compliance",
    name: "Compliance",
    line: "Certificates, expiry, and overdue evidence",
  },
  {
    id: "finance",
    name: "Finance",
    line: "Rent, unmatched payments, arrears, statements",
  },
  {
    id: "migration",
    name: "Migration Admin",
    line: "Import, dry run, and cutover",
  },
  {
    id: "landlord",
    name: "Landlord",
    line: "Own portfolio, approvals, and statements",
  },
  {
    id: "tenant",
    name: "Tenant",
    line: "Onboarding, tenancy, rent, and repairs",
  },
  { id: "contractor", name: "Contractor", line: "Assigned jobs only" },
] as const;

export const roleNav: Record<
  string,
  readonly { href: string; label: string }[]
> = {
  "super-admin": [
    { href: "", label: "Dashboard" },
    { href: "organisations", label: "Organisations" },
    { href: "requests", label: "Requests" },
    { href: "users", label: "Users" },
    { href: "integrations", label: "Integrations" },
    { href: "modules", label: "Modules" },
    { href: "audit", label: "Audit" },
    { href: "reports", label: "Reports" },
  ],
  "org-admin": [
    { href: "", label: "Dashboard" },
    { href: "branches", label: "Offices" },
    { href: "users", label: "Users" },
    { href: "settings", label: "Settings" },
    { href: "integrations", label: "Integrations" },
    { href: "audit", label: "Audit" },
  ],
  operations: [
    { href: "", label: "Queue" },
    { href: "team", label: "Team" },
    { href: "exceptions", label: "Exceptions" },
  ],
  property: [
    { href: "", label: "Properties" },
    { href: "tenancies", label: "Tenancies" },
  ],
  lettings: [
    { href: "", label: "Listings" },
    { href: "applicants", label: "Applicants" },
    { href: "viewings", label: "Viewings" },
  ],
  compliance: [
    { href: "", label: "Queue" },
    { href: "certificates", label: "Certificates" },
  ],
  finance: [
    { href: "", label: "Desk" },
    { href: "payments", label: "Payments" },
    { href: "arrears", label: "Arrears" },
    { href: "statements", label: "Statements" },
  ],
  migration: [{ href: "", label: "Projects" }],
  landlord: [
    { href: "", label: "Portfolio" },
    { href: "approvals", label: "Approvals" },
    { href: "statements", label: "Statements" },
    { href: "profile", label: "Profile" },
  ],
  tenant: [
    { href: "", label: "Home" },
    { href: "onboarding", label: "Onboarding" },
    { href: "tenancy", label: "Tenancy" },
    { href: "payments", label: "Rent" },
    { href: "maintenance", label: "Repairs" },
  ],
  contractor: [{ href: "", label: "Jobs" }],
};

export function roleName(id: string): string {
  return roleCards.find((role) => role.id === id)?.name ?? "Unknown role";
}

/** Invitation creates the account. These roles have no public registration. */
const signInOnly = new Set([
  "super-admin",
  "operations",
  "property",
  "lettings",
  "compliance",
  "finance",
  "migration",
]);

export function canRegister(role: string): boolean {
  return !signInOnly.has(role);
}

export function needsVerify(role: string): boolean {
  return role === "tenant";
}
