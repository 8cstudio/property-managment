import type { MetricSnapshot } from "@/features/dashboard/metric-snapshots";

export type Office = {
  id: string;
  name: string;
  line1: string;
  line2: string;
  town: string;
  postcode: string;
  phone: string;
  email: string;
  status: "Active" | "Closed";
  manager: string;
  notes: string;
};

/** Custom staff role label mapped to a portal the member may sign into. */
export type OrgRoleDefinition = {
  label: string;
  access: string;
};

export type OrgSettings = {
  reminderDays: string;
  timezone: string;
  defaultCurrency: string;
  /** Tenant default UI locale (BCP 47). User cookie overrides in mock console. */
  defaultLocale: string;
  /** Extra assignable roles beyond the built-in catalogue. */
  roleCatalog?: OrgRoleDefinition[];
  /** Built-in role labels hidden from invite/access pickers. */
  disabledRoleLabels?: string[];
};

export type Org = {
  id: string;
  name: string;
  status: "Setup" | "Active" | "Suspended" | "Archived";
  offices: Office[];
  modules: Record<string, boolean>;
  reason: string;
  legalName: string;
  companyNumber: string;
  billingEmail: string;
  settings: OrgSettings;
};

export const defaultOrgSettings = (): OrgSettings => ({
  reminderDays: "30",
  timezone: "Europe/London",
  defaultCurrency: "GBP",
  defaultLocale: "en-GB",
});

export function orgOfficeNames(org: Org): string[] {
  return org.offices.map((office) => office.name);
}

export function seedOffice(
  orgId: string,
  name: string,
  partial?: Partial<Office>,
): Office {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return {
    id: `${orgId}-${slug}`,
    name,
    line1: "",
    line2: "",
    town: "London",
    postcode: "",
    phone: "",
    email: "",
    status: "Active",
    manager: "",
    notes: "",
    ...partial,
  };
}

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  status: "Active" | "Invited" | "Deactivated";
  orgId: string;
  /** Set when access is suspended (mock). */
  statusNote: string;
};

export type Property = {
  id: string;
  address: string;
  orgId: string;
  branch: string;
  status: string;
  tenancy: string;
  checks: Record<string, boolean>;
};

export type WorkItem = {
  id: string;
  kind: string;
  title: string;
  place: string;
  owner: string;
  state: string;
  orgId: string;
  detail: string;
};

export type Listing = {
  id: string;
  address: string;
  portal: string;
  status: string;
  rent: string;
  bedrooms: string;
  description: string;
  publishedAt?: string;
};

export type Applicant = {
  id: string;
  name: string;
  stage: string;
  property: string;
};

export type Viewing = {
  id: string;
  when: string;
  property: string;
  applicant: string;
  outcome: string;
};

export type Certificate = {
  id: string;
  property: string;
  type: string;
  status: string;
  expiry: string;
  history: string[];
};

export type Job = {
  id: string;
  title: string;
  address: string;
  status: string;
  quote: string;
  assignee: string;
  notes: string;
  declineReason: string;
};

export type Payment = {
  id: string;
  amount: string;
  reference: string;
  tenancy: string;
  status: string;
};

export type ArrearsCase = {
  id: string;
  place: string;
  amount: string;
  age: string;
  plan: string;
};

export type Statement = {
  id: string;
  landlord: string;
  period: string;
  status: string;
};

export type MigrationProject = {
  id: string;
  agency: string;
  source: string;
  stage: string;
  note: string;
  importedRows: number;
  errorCount: number;
  warningCount: number;
  duplicateCount: number;
  sourceBatch: string;
  lastImportAt?: string;
  dryRunCounts?: { properties: number; tenancies: number; contacts: number };
  reconciliationOk: boolean;
};

export type MigrationIssue = {
  id: string;
  projectId: string;
  severity: "Error" | "Warning" | "Duplicate";
  record: string;
  message: string;
};

export type MigrationMapping = {
  id: string;
  projectId: string;
  sourceField: string;
  targetField: string;
  rule: string;
};

export type DocumentRecord = {
  id: string;
  name: string;
  type: string;
  linkedTo: string;
  uploaded: string;
  orgId: string;
};

export type ComplianceRequirement = {
  id: string;
  name: string;
  appliesTo: string;
  frequency: string;
  status: string;
  evidence: string;
  owner: string;
};

export type RentSchedule = {
  id: string;
  tenancy: string;
  amount: string;
  frequency: string;
  status: string;
  nextDue: string;
  method: string;
};

export type Integration = {
  id: string;
  name: string;
  orgId: string;
  status: string;
  kind: string;
  endpoint: string;
  apiKeyHint: string;
  webhookUrl: string;
  syncCadence: string;
  lastSyncAt: string;
  lastError: string;
};

export type IntegrationLog = {
  id: string;
  integrationId: string;
  when: string;
  level: "info" | "warn" | "error";
  message: string;
};

export type AuditEvent = {
  id: string;
  when: string;
  actor: string;
  action: string;
  org: string;
};

export type OnboardingStep = {
  id: string;
  title: string;
  state: string;
  summary: string;
  blocker?: string;
};

export type OrgRequest = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  country: string;
  branch: string;
  about: string;
  memberYears: number;
  memberCount: number;
  minProperties: number;
  status: "Requested" | "Approved" | "Declined";
};

export type DeskState = {
  orgs: Org[];
  requests: OrgRequest[];
  users: StaffUser[];
  properties: Property[];
  work: WorkItem[];
  listings: Listing[];
  applicants: Applicant[];
  viewings: Viewing[];
  certificates: Certificate[];
  jobs: Job[];
  payments: Payment[];
  arrears: ArrearsCase[];
  statements: Statement[];
  migrations: MigrationProject[];
  migrationIssues: MigrationIssue[];
  migrationMappings: MigrationMapping[];
  documents: DocumentRecord[];
  requirements: ComplianceRequirement[];
  rentSchedules: RentSchedule[];
  integrations: Integration[];
  integrationLogs: IntegrationLog[];
  audit: AuditEvent[];
  onboarding: OnboardingStep[];
  /** Daily KPI values for dashboard charts (Europe/London dates). */
  metricSnapshots: MetricSnapshot[];
  reminderDays: string;
  notice: string;
  security: { who: string; when: string }[];
};

export function createSeed(): DeskState {
  return {
    reminderDays: "30",
    notice: "",
    requests: [],
    security: [],
    // Organisations and users are loaded from the API, not seeded.
    orgs: [],
    users: [],
    properties: [],
    work: [],
    listings: [],
    applicants: [],
    viewings: [],
    certificates: [],
    jobs: [],
    payments: [],
    arrears: [],
    statements: [],
    migrations: [],
    migrationIssues: [],
    migrationMappings: [],
    documents: [],
    requirements: [],
    rentSchedules: [],
    integrations: [],
    integrationLogs: [],
    audit: [],
    onboarding: [],
    metricSnapshots: [],
  };
}
