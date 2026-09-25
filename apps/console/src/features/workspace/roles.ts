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
  readonly { href: string; label: string; key: string }[]
> = {
  "super-admin": [
    { href: "", label: "Dashboard", key: "dashboard" },
    { href: "organisations", label: "Organisations", key: "organisations" },
    { href: "requests", label: "Requests", key: "requests" },
    { href: "users", label: "Users", key: "users" },
    { href: "integrations", label: "Integrations", key: "integrations" },
    { href: "modules", label: "Modules", key: "modules" },
    { href: "audit", label: "Audit", key: "audit" },
    { href: "reports", label: "Reports", key: "reports" },
  ],
  "org-admin": [
    { href: "", label: "Dashboard", key: "dashboard" },
    { href: "organisation", label: "Organisation", key: "organisation" },
    { href: "branches", label: "Offices", key: "offices" },
    { href: "users", label: "Users", key: "users" },
    { href: "integrations", label: "Integrations", key: "integrations" },
    { href: "audit", label: "Audit", key: "audit" },
  ],
  operations: [
    { href: "", label: "Queue", key: "queue" },
    { href: "properties", label: "Properties", key: "properties" },
    { href: "maintenance", label: "Maintenance", key: "maintenance" },
    { href: "team", label: "Team", key: "team" },
    { href: "exceptions", label: "Exceptions", key: "exceptions" },
    { href: "documents", label: "Documents", key: "documents" },
  ],
  property: [
    { href: "", label: "Properties", key: "properties" },
    { href: "tenancies", label: "Tenancies", key: "tenancies" },
    { href: "documents", label: "Documents", key: "documents" },
  ],
  lettings: [
    { href: "", label: "Listings", key: "listings" },
    { href: "applicants", label: "Applicants", key: "applicants" },
    { href: "viewings", label: "Viewings", key: "viewings" },
  ],
  compliance: [
    { href: "", label: "Queue", key: "queue" },
    { href: "certificates", label: "Certificates", key: "certificates" },
    { href: "requirements", label: "Requirements", key: "requirements" },
    { href: "documents", label: "Documents", key: "documents" },
  ],
  finance: [
    { href: "", label: "Desk", key: "desk" },
    { href: "schedules", label: "Rent schedules", key: "rentSchedules" },
    { href: "payments", label: "Payments", key: "payments" },
    { href: "arrears", label: "Arrears", key: "arrears" },
    { href: "statements", label: "Statements", key: "statements" },
    { href: "documents", label: "Documents", key: "documents" },
  ],
  migration: [
    { href: "", label: "Projects", key: "projects" },
    { href: "documents", label: "Source files", key: "sourceFiles" },
  ],
  landlord: [
    { href: "", label: "Portfolio", key: "portfolio" },
    { href: "approvals", label: "Approvals", key: "approvals" },
    { href: "statements", label: "Statements", key: "statements" },
    { href: "documents", label: "Documents", key: "documents" },
    { href: "profile", label: "Profile", key: "profile" },
  ],
  tenant: [
    { href: "", label: "Home", key: "home" },
    { href: "onboarding", label: "Onboarding", key: "onboarding" },
    { href: "tenancy", label: "Tenancy", key: "tenancy" },
    { href: "payments", label: "Rent", key: "rent" },
    { href: "maintenance", label: "Repairs", key: "repairs" },
    { href: "documents", label: "Documents", key: "documents" },
  ],
  contractor: [{ href: "", label: "Jobs", key: "jobs" }],
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

/** Staff sign-in requires a second factor in the mock console. */
export function requiresMfa(role: string): boolean {
  return role !== "tenant" && role !== "landlord" && role !== "contractor";
}
