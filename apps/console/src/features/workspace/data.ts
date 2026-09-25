export type Org = {
  id: string;
  name: string;
  status: "Setup" | "Active" | "Suspended" | "Archived";
  branches: string[];
  modules: Record<string, boolean>;
  reason: string;
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  status: "Active" | "Invited" | "Deactivated";
  orgId: string;
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
};

export type Integration = {
  id: string;
  name: string;
  orgId: string;
  status: string;
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
  integrations: Integration[];
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
        branches: ["Peckham", "Deptford", "Greenwich"],
        modules: { ...modulesOn },
        reason: "",
      },
      {
        id: "harbour",
        name: "Harbour Housing",
        status: "Setup",
        branches: ["Deptford"],
        modules: { ...modulesOn, Migration: false, Finance: false },
        reason: "",
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
      },
      {
        id: "u2",
        name: "A. Okonkwo",
        email: "a.okonkwo@northbridge.example",
        role: "Operations",
        scope: "Deptford",
        status: "Active",
        orgId: "northbridge",
      },
      {
        id: "u3",
        name: "L. Shah",
        email: "l.shah@northbridge.example",
        role: "Lettings",
        scope: "Peckham",
        status: "Invited",
        orgId: "northbridge",
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
      },
    ],
    integrations: [
      {
        id: "i1",
        name: "Rightmove",
        orgId: "northbridge",
        status: "Failed",
      },
      {
        id: "i2",
        name: "Email",
        orgId: "northbridge",
        status: "Connected",
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
      { id: "o1", title: "Personal details", state: "Complete" },
      { id: "o2", title: "Identity", state: "Blocked" },
      { id: "o3", title: "Agreement", state: "Not started" },
      { id: "o4", title: "Deposit", state: "Not started" },
    ],
  };
}
