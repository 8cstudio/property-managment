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

export type OrgSettings = {
  reminderDays: string;
  timezone: string;
  defaultCurrency: string;
  /** Tenant default UI locale (BCP 47). User cookie overrides in mock console. */
  defaultLocale: string;
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
  branch: string;
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
  reminderDays: string;
  notice: string;
  security: { who: string; when: string }[];
};

const modulesOn = {
  Properties: true,
  Lettings: true,
  Compliance: true,
  Maintenance: true,
  Finance: true,
  Migration: true,
};

export function createSeed(): DeskState {
  return {
    reminderDays: "30",
    notice: "",
    requests: [],
    security: [
      { who: "unknown@mail.test", when: "Today 08:14" },
      { who: "platform@ezzi.test", when: "Yesterday 22:03" },
    ],
    orgs: [
      {
        id: "northbridge",
        name: "Northbridge Lettings",
        status: "Active",
        offices: [
          seedOffice("northbridge", "Peckham", {
            line1: "118 Rye Lane",
            town: "London",
            postcode: "SE15 4ST",
            phone: "020 8123 4401",
            email: "peckham@northbridge.example",
            manager: "Priya Nair",
            notes: "Main lettings hub.",
          }),
          seedOffice("northbridge", "Deptford", {
            line1: "9 Deptford High Street",
            postcode: "SE8 3AE",
            phone: "020 8123 4402",
            email: "deptford@northbridge.example",
            manager: "A. Okonkwo",
          }),
          seedOffice("northbridge", "Greenwich", {
            line1: "2 Royal Hill",
            postcode: "SE10 8RT",
            phone: "020 8123 4403",
            email: "greenwich@northbridge.example",
          }),
        ],
        modules: { ...modulesOn },
        reason: "",
        legalName: "Northbridge Lettings Ltd",
        companyNumber: "NI123456",
        billingEmail: "finance@northbridge.example",
        settings: defaultOrgSettings(),
      },
      {
        id: "harbour",
        name: "Harbour Housing",
        status: "Setup",
        offices: [
          seedOffice("harbour", "Deptford", {
            line1: "14 Creek Road",
            postcode: "SE8 3BU",
            email: "deptford@harbour.example",
          }),
        ],
        modules: { ...modulesOn, Migration: false, Finance: false },
        reason: "",
        legalName: "Harbour Housing Association",
        companyNumber: "",
        billingEmail: "",
        settings: defaultOrgSettings(),
      },
    ],
    users: [
      {
        id: "u1",
        name: "Priya Nair",
        email: "priya.nair@northbridge.example",
        role: "Organisation Admin",
        scope: "All branches",
        status: "Active",
        orgId: "northbridge",
        statusNote: "",
      },
      {
        id: "u2",
        name: "A. Okonkwo",
        email: "a.okonkwo@northbridge.example",
        role: "Operations",
        scope: "Deptford",
        status: "Active",
        orgId: "northbridge",
        statusNote: "",
      },
      {
        id: "u3",
        name: "L. Shah",
        email: "l.shah@northbridge.example",
        role: "Lettings",
        scope: "Peckham",
        status: "Invited",
        orgId: "northbridge",
        statusNote: "",
      },
    ],
    properties: [
      {
        id: "rye",
        address: "14 Rye Lane, Flat 2",
        orgId: "northbridge",
        branch: "Peckham",
        status: "Occupied",
        tenancy: "Active · J. Adeyemi",
        checks: { Notice: false, Inspection: false, Keys: false },
      },
      {
        id: "lark",
        address: "41 Larkhall Lane",
        orgId: "harbour",
        branch: "Greenwich",
        status: "Available",
        tenancy: "None",
        checks: { Notice: false, Inspection: false, Keys: false },
      },
      {
        id: "ash",
        address: "4 Ash Grove",
        orgId: "harbour",
        branch: "Deptford",
        status: "Occupied",
        tenancy: "Active · M. Cole",
        checks: { Notice: true, Inspection: false, Keys: false },
      },
    ],
    work: [
      {
        id: "w1",
        kind: "Compliance",
        title: "Gas safety expired",
        place: "14 Rye Lane, Flat 2",
        owner: "Unassigned",
        state: "Overdue",
        orgId: "northbridge",
        detail: "Certificate ended yesterday. Old file is still on the record.",
      },
      {
        id: "w2",
        kind: "Maintenance",
        title: "No heating reported",
        place: "8 Deptford High Street",
        owner: "A. Okonkwo",
        state: "Today",
        orgId: "northbridge",
        detail: "Tenant says the boiler will not start. Access from 9:00.",
      },
      {
        id: "w3",
        kind: "Onboarding",
        title: "ID photo unreadable",
        place: "22 Queen's Road",
        owner: "L. Shah",
        state: "Blocked",
        orgId: "northbridge",
        detail:
          "Referencing stopped. Ask for a new photo or record an override reason.",
      },
    ],
    listings: [
      {
        id: "ls1",
        address: "41 Larkhall Lane",
        portal: "Rightmove",
        status: "Draft",
        rent: "£1,395 pcm",
        bedrooms: "2",
        description:
          "Bright two-bedroom flat near Clapham North. Available mid-October.",
      },
    ],
    applicants: [
      {
        id: "ap1",
        name: "Samira Begum",
        stage: "Viewed",
        property: "41 Larkhall Lane",
      },
    ],
    viewings: [
      {
        id: "vw1",
        when: "Today 16:30",
        property: "41 Larkhall Lane",
        applicant: "Samira Begum",
        outcome: "Booked",
      },
    ],
    certificates: [
      {
        id: "c1",
        property: "14 Rye Lane, Flat 2",
        type: "Gas safety",
        status: "Overdue",
        expiry: "24 Sep 2026",
        history: ["2025 certificate, expired"],
      },
      {
        id: "c2",
        property: "41 Larkhall Lane",
        type: "EICR",
        status: "Due",
        expiry: "28 Sep 2026",
        history: [],
      },
    ],
    jobs: [
      {
        id: "j1",
        title: "No heating",
        address: "8 Deptford High Street",
        status: "New",
        quote: "",
        assignee: "Unassigned",
        notes: "",
        declineReason: "",
      },
      {
        id: "j2",
        title: "Boiler quote",
        address: "4 Ash Grove",
        status: "Waiting approval",
        quote: "£480",
        assignee: "Heatright Ltd",
        notes: "",
        declineReason: "",
      },
      {
        id: "j3",
        title: "Leaking waste",
        address: "16 Clifton Rise",
        status: "Assigned",
        quote: "",
        assignee: "You",
        notes: "",
        declineReason: "",
      },
    ],
    payments: [
      {
        id: "p1",
        amount: "£1,250",
        reference: "NB-4419",
        tenancy: "4 Ash Grove",
        status: "Unmatched",
      },
      {
        id: "p2",
        amount: "£1,150",
        reference: "QR-220",
        tenancy: "22 Queen's Road",
        status: "Matched",
      },
    ],
    arrears: [
      {
        id: "ar1",
        place: "4 Ash Grove",
        amount: "£640",
        age: "18 days",
        plan: "",
      },
    ],
    statements: [
      {
        id: "st1",
        landlord: "Harbour portfolio",
        period: "September 2026",
        status: "Draft",
      },
    ],
    migrations: [
      {
        id: "m1",
        agency: "Northbridge Lettings",
        source: "Reapit",
        stage: "Staging",
        note: "Live records have not been changed.",
        importedRows: 0,
        errorCount: 0,
        warningCount: 0,
        duplicateCount: 0,
        sourceBatch: "NB-IMP-001",
        reconciliationOk: false,
      },
      {
        id: "m2",
        agency: "Harbour Housing",
        source: "Alto",
        stage: "Mapped",
        note: "Mapping saved. Ready for validation.",
        importedRows: 842,
        errorCount: 3,
        warningCount: 11,
        duplicateCount: 2,
        sourceBatch: "HB-IMP-014",
        lastImportAt: "Yesterday 16:40",
        reconciliationOk: false,
      },
    ],
    migrationIssues: [
      {
        id: "mi1",
        projectId: "m2",
        severity: "Error",
        record: "Row 118 · Property",
        message: "Missing mandatory postcode.",
      },
      {
        id: "mi2",
        projectId: "m2",
        severity: "Warning",
        record: "Row 402 · Tenancy",
        message: "End date before start date in source.",
      },
      {
        id: "mi3",
        projectId: "m2",
        severity: "Duplicate",
        record: "Contact · M. Cole",
        message: "Possible duplicate of existing tenant.",
      },
    ],
    migrationMappings: [
      {
        id: "mm1",
        projectId: "m1",
        sourceField: "prop.address.line1",
        targetField: "property.addressLine1",
        rule: "Trim",
      },
      {
        id: "mm2",
        projectId: "m1",
        sourceField: "tenancy.rent",
        targetField: "tenancy.rentAmount",
        rule: "GBP minor units",
      },
      {
        id: "mm3",
        projectId: "m2",
        sourceField: "landlord.ref",
        targetField: "party.legacyId",
        rule: "Keep source id",
      },
    ],
    documents: [
      {
        id: "d1",
        name: "Gas safety 2025.pdf",
        type: "Certificate",
        linkedTo: "14 Rye Lane, Flat 2",
        uploaded: "12 Aug 2026",
        orgId: "northbridge",
      },
      {
        id: "d2",
        name: "Tenancy agreement · J. Adeyemi",
        type: "Agreement",
        linkedTo: "rye",
        uploaded: "3 Jun 2026",
        orgId: "northbridge",
      },
    ],
    requirements: [
      {
        id: "rq1",
        name: "Gas safety",
        appliesTo: "Residential let",
        frequency: "Annual",
        status: "Active",
        evidence: "CP12 certificate linked to property",
        owner: "Compliance team",
      },
      {
        id: "rq2",
        name: "EICR",
        appliesTo: "Residential let",
        frequency: "5 years",
        status: "Active",
        evidence: "Certificate PDF on property record",
        owner: "Compliance team",
      },
    ],
    rentSchedules: [
      {
        id: "rs1",
        tenancy: "4 Ash Grove · M. Cole",
        amount: "£1,250",
        frequency: "Monthly",
        status: "Active",
        nextDue: "1 Oct 2026",
        method: "Standing order",
      },
      {
        id: "rs2",
        tenancy: "22 Queen's Road",
        amount: "£1,150",
        frequency: "Monthly",
        status: "Active",
        nextDue: "1 Oct 2026",
        method: "Open banking",
      },
    ],
    integrations: [
      {
        id: "i1",
        name: "Rightmove",
        orgId: "northbridge",
        status: "Failed",
        kind: "Listing portal",
        endpoint: "https://api.rightmove.co.uk/v1",
        apiKeyHint: "••••7f2a",
        webhookUrl: "https://console.ezzi.test/hooks/rightmove",
        syncCadence: "Every 15 minutes",
        lastSyncAt: "Today 08:02",
        lastError: "401 — API key rejected by provider",
      },
      {
        id: "i2",
        name: "Email",
        orgId: "northbridge",
        status: "Connected",
        kind: "Transactional email",
        endpoint: "smtp.send.ezzi.test",
        apiKeyHint: "••••9b01",
        webhookUrl: "",
        syncCadence: "On send",
        lastSyncAt: "Today 09:41",
        lastError: "",
      },
      {
        id: "i3",
        name: "Xero",
        orgId: "harbour",
        status: "Not configured",
        kind: "Accounting",
        endpoint: "https://api.xero.com",
        apiKeyHint: "",
        webhookUrl: "",
        syncCadence: "Daily at 02:00",
        lastSyncAt: "Never",
        lastError: "",
      },
    ],
    integrationLogs: [
      {
        id: "il1",
        integrationId: "i1",
        when: "Today 08:02",
        level: "error",
        message: "Sync failed — 401 from Rightmove",
      },
      {
        id: "il2",
        integrationId: "i1",
        when: "Today 07:47",
        level: "warn",
        message: "Retry scheduled after transient timeout",
      },
      {
        id: "il3",
        integrationId: "i2",
        when: "Today 09:41",
        level: "info",
        message: "Delivered 12 tenant notifications",
      },
      {
        id: "il4",
        integrationId: "i2",
        when: "Today 07:15",
        level: "info",
        message: "Connection health check passed",
      },
    ],
    audit: [
      {
        id: "a1",
        when: "Today 09:10",
        actor: "Priya Nair",
        action: "Invited L. Shah as Lettings",
        org: "Northbridge Lettings",
      },
    ],
    onboarding: [
      {
        id: "o1",
        title: "Personal details",
        state: "Complete",
        summary: "Name, contact, and emergency contact confirmed.",
      },
      {
        id: "o2",
        title: "Identity",
        state: "Blocked",
        summary: "Upload ID and proof of address for referencing.",
        blocker: "Previous photo was unreadable — upload a clearer image.",
      },
      {
        id: "o3",
        title: "Agreement",
        state: "Not started",
        summary: "Review and sign the tenancy agreement.",
      },
      {
        id: "o4",
        title: "Deposit",
        state: "Not started",
        summary: "Pay the holding deposit to secure the property.",
      },
    ],
  };
}
