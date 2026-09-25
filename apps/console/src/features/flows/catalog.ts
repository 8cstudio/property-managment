export type FlowStep = {
  title: string;
  screen: string;
  shows: readonly { label: string; value: string }[];
  action: string;
};

export type RoleFlow = {
  id: string;
  group: "console" | "portal";
  role: string;
  summary: string;
  steps: readonly FlowStep[];
};

export type ModuleDoor = {
  id: string;
  name: string;
  summary: string;
  rows: readonly { label: string; value: string }[];
};

const step = (
  title: string,
  screen: string,
  action: string,
  shows: readonly { label: string; value: string }[],
): FlowStep => ({ title, screen, action, shows });

export const roleFlows: readonly RoleFlow[] = [
  {
    id: "super-admin",
    group: "console",
    role: "Super Admin",
    summary: "Platform setup. Not for day-to-day property work.",
    steps: [
      step("Sign in", "Login and MFA", "Open platform", [
        { label: "Account", value: "platform@ezzi.test" },
        { label: "MFA", value: "Required for this role" },
        { label: "Failed sign-ins", value: "Shown apart from ops alerts" },
      ]),
      step(
        "Platform desk",
        "Cross-organisation dashboard",
        "Open organisations",
        [
          { label: "Organisations", value: "2 active" },
          { label: "Open alerts", value: "Each row names its organisation" },
        ],
      ),
      step("Create organisation", "Company, branch, first admin", "Create", [
        { label: "Company", value: "Harbour Housing" },
        { label: "First branch", value: "Deptford" },
        { label: "First admin", value: "Invite sent" },
        { label: "Status", value: "Setup" },
      ]),
      step(
        "Organisation overview",
        "One organisation, all of its parts",
        "Open users",
        [
          { label: "Branches", value: "2" },
          { label: "Users", value: "6" },
          { label: "Integrations", value: "1 failing" },
        ],
      ),
      step("Admins", "Invite, resend, deactivate, change role", "Send invite", [
        { label: "Person", value: "Priya Nair" },
        { label: "Role", value: "Organisation Admin" },
        { label: "Audit", value: "Role change is recorded" },
      ]),
      step("Modules", "Turn a module on or off", "Confirm", [
        { label: "Finance", value: "On" },
        { label: "Migration", value: "Off" },
        { label: "History", value: "Turning off does not delete records" },
      ]),
      step(
        "Integrations",
        "Credentials, test, then enable",
        "Test connection",
        [
          { label: "Provider", value: "Rightmove" },
          { label: "Secret", value: "Hidden after save" },
          { label: "Last sync", value: "Failed 2 hours ago" },
        ],
      ),
      step("Audit", "Filter platform events", "Open event", [
        { label: "Filter", value: "Organisation, user, action, date" },
        { label: "Event", value: "Integration credentials changed" },
      ]),
      step("Suspend", "Block access, keep the records", "Confirm suspend", [
        { label: "Organisation", value: "Northbridge Lettings" },
        { label: "Reason", value: "Required" },
        { label: "Records", value: "Kept" },
      ]),
    ],
  },
  {
    id: "org-admin",
    group: "console",
    role: "Organisation Admin",
    summary: "Setup and access inside one organisation only.",
    steps: [
      step("Invitation", "Set a password and turn on MFA", "Continue setup", [
        { label: "Organisation", value: "Northbridge Lettings" },
        { label: "Checklist", value: "3 items left" },
      ]),
      step("Branches", "Add a branch and assign staff", "Save branch", [
        { label: "Branch", value: "Greenwich" },
        { label: "Used as", value: "Filter on users, properties, and queues" },
      ]),
      step("Staff", "Invite a user into a role and a scope", "Send invite", [
        { label: "Role", value: "Lettings" },
        { label: "Scope", value: "Peckham" },
        { label: "Blocked", value: "Cannot grant Super Admin" },
      ]),
      step("Settings", "Reminders, templates, compliance defaults", "Save", [
        { label: "Certificate reminder", value: "30 days" },
        { label: "Platform settings", value: "Read only" },
      ]),
      step("Own audit", "This organisation only", "Export", [
        { label: "Scope", value: "Northbridge Lettings" },
        { label: "Other organisations", value: "Not visible" },
      ]),
    ],
  },
  {
    id: "operations",
    group: "console",
    role: "Operations Manager",
    summary: "Today's queue, team load, and blocked work.",
    steps: [
      step(
        "Work queue",
        "Exceptions that need a person",
        "Open today's queue",
        [
          { label: "Live screen", value: "Today's queue is a real page" },
          { label: "Each item", value: "Owner, age, next action" },
        ],
      ),
      step("Team load", "Who is holding open work", "Reassign", [
        { label: "A. Okonkwo", value: "3 open" },
        { label: "Unassigned", value: "2 open" },
        { label: "Reassign", value: "Audited, new owner is told" },
      ]),
      step("Exception", "See why it is blocked, then act", "Resolve", [
        { label: "Item", value: "Onboarding ID unreadable" },
        { label: "Source", value: "Shown on this screen" },
        { label: "Next", value: "Ask again, or override with a reason" },
      ]),
    ],
  },
  {
    id: "property",
    group: "console",
    role: "Property Manager",
    summary: "Property record, status, renewal, and move-out.",
    steps: [
      step("Add property", "Address, ownership, units, documents", "Save", [
        { label: "Address", value: "14 Rye Lane" },
        { label: "Duplicate check", value: "Warn before creating" },
        { label: "Status", value: "Onboarding" },
      ]),
      step(
        "Property",
        "Units, tenancy, compliance, maintenance, documents",
        "Open tenancy",
        [
          { label: "Unit", value: "Flat 2" },
          { label: "Tenancy", value: "Active" },
          { label: "Finance", value: "Summary only" },
        ],
      ),
      step("Status", "Change state with a reason", "Confirm", [
        { label: "From", value: "Occupied" },
        { label: "To", value: "Void" },
        {
          label: "States",
          value:
            "Onboarding, available, reserved, occupied, void, on hold, archived",
        },
      ]),
      step("Renewal", "Keep the old agreement", "Renew", [
        { label: "End date", value: "12 Nov" },
        { label: "History", value: "Previous agreement stays" },
      ]),
      step(
        "Move-out",
        "Checklist before the property is free",
        "Close tenancy",
        [
          { label: "Notice", value: "Received" },
          { label: "Inspection", value: "Open" },
          {
            label: "Availability",
            value: "Changes only when the list is done",
          },
        ],
      ),
    ],
  },
  {
    id: "lettings",
    group: "console",
    role: "Lettings Agent",
    summary: "Listing, applicant, viewing, offer, then onboarding.",
    steps: [
      step("Listing", "Publish an available unit", "Publish", [
        { label: "Unit", value: "41 Larkhall Lane" },
        { label: "Portal", value: "Rightmove" },
        { label: "Channel status", value: "Stored per portal" },
      ]),
      step(
        "Applicant",
        "Match a lead without a second person record",
        "Save applicant",
        [
          { label: "From", value: "Portal lead" },
          { label: "Match", value: "Existing person found" },
        ],
      ),
      step("Viewing", "Book, complete, record the outcome", "Save feedback", [
        { label: "When", value: "Today 16:30" },
        { label: "Outcome", value: "Interested" },
      ]),
      step(
        "Offer",
        "A person accepts. Matching can only suggest.",
        "Accept applicant",
        [
          { label: "Suggestion", value: "Shown with the reasons" },
          { label: "Decision", value: "Staff" },
        ],
      ),
      step("Handover", "Start onboarding without retyping", "Open checklist", [
        { label: "Applicant", value: "Copied across" },
        { label: "Property", value: "Copied across" },
        { label: "Owner", value: "L. Shah" },
      ]),
    ],
  },
  {
    id: "compliance",
    group: "console",
    role: "Compliance",
    summary: "Requirements, evidence, expiry, and overdue work.",
    steps: [
      step("Requirement", "What applies, and when it expires", "Save rule", [
        { label: "Item", value: "Gas safety" },
        { label: "Applies to", value: "Every let unit" },
        { label: "Reminder", value: "30 days" },
      ]),
      step("Evidence", "Upload, check, then mark compliant", "Validate", [
        { label: "File", value: "gas-2026.pdf" },
        { label: "Extracted date", value: "Staff can correct it" },
        { label: "Status", value: "Compliant" },
      ]),
      step("Renewal", "New certificate, old one stays", "Save new expiry", [
        { label: "Previous", value: "Still in history" },
        { label: "New expiry", value: "18 Sep 2027" },
      ]),
      step("Overdue", "Missed expiry goes to the queue", "Resolve", [
        { label: "Property", value: "14 Rye Lane, Flat 2" },
        { label: "Status", value: "From the rule, not from a suggestion" },
      ]),
    ],
  },
  {
    id: "finance",
    group: "console",
    role: "Finance",
    summary: "Rent expected, payments matched, arrears, statements.",
    steps: [
      step("Rent schedule", "Expected charges on the tenancy", "Activate", [
        { label: "Tenancy", value: "4 Ash Grove" },
        { label: "Amount", value: "£1,250 monthly" },
        { label: "Rule", value: "Calculated, not guessed" },
      ]),
      step(
        "Match payment",
        "A confident match posts. Anything else waits.",
        "Post",
        [
          { label: "Payment", value: "£1,250" },
          { label: "Reference", value: "NB-4419" },
          { label: "Result", value: "Matched" },
        ],
      ),
      step("Unmatched", "Do not guess", "Match or escalate", [
        { label: "Queue", value: "Unmatched payments" },
        { label: "Correction", value: "Needs a reason and an audit row" },
      ]),
      step(
        "Arrears",
        "Follow up. Do not make a legal promise automatically.",
        "Save plan",
        [
          { label: "Short", value: "£640, 18 days" },
          { label: "Plan", value: "Staff writes it" },
        ],
      ),
      step("Statement", "What a landlord is allowed to see", "Publish", [
        { label: "Period", value: "September" },
        { label: "Landlord view", value: "Approved lines only" },
      ]),
    ],
  },
  {
    id: "migration",
    group: "console",
    role: "Migration Admin",
    summary: "Bring an agency in. Staging first. Live only after sign-off.",
    steps: [
      step("Project", "Agency, source system, owners", "Create project", [
        { label: "Agency", value: "Northbridge Lettings" },
        { label: "Source", value: "Reapit" },
      ]),
      step("Import", "Load into staging. Live records stay still.", "Preview", [
        { label: "File", value: "properties.csv" },
        { label: "Live data", value: "Unchanged" },
      ]),
      step("Map fields", "Source column to Ezzi field", "Validate", [
        { label: "Source", value: "PropRef" },
        { label: "Ezzi", value: "source_id" },
        { label: "Mapping", value: "Reusable next time" },
      ]),
      step("Duplicates", "Error, warning, or merge", "Revalidate", [
        { label: "Row", value: "148" },
        { label: "Issue", value: "Same address, two source ids" },
      ]),
      step("Dry run", "Counts and totals. Nothing written live.", "Sign off", [
        { label: "Properties", value: "420 source / 420 staged" },
        { label: "Rent total", value: "Checked" },
        { label: "Production", value: "Not written" },
      ]),
      step("Cutover", "Final import, then check again", "Go live", [
        { label: "Batch", value: "Kept on every row" },
        { label: "Source id", value: "Kept beside the Ezzi id" },
      ]),
    ],
  },
  {
    id: "landlord",
    group: "portal",
    role: "Landlord",
    summary: "Own portfolio only. Approvals and statements.",
    steps: [
      step("Sign in", "Invitation, then the landlord desk", "Open portfolio", [
        { label: "Sees", value: "Linked properties only" },
      ]),
      step(
        "Portfolio",
        "Property, tenancy, maintenance, compliance, documents",
        "Open property",
        [
          { label: "Properties", value: "3" },
          { label: "Other landlords", value: "Hidden" },
        ],
      ),
      step("Approval", "Only when the rule asks the landlord", "Approve", [
        { label: "Job", value: "Boiler quote £480" },
        { label: "Choice", value: "Approve or reject" },
      ]),
      step("Statement", "Published finance and documents", "Download", [
        { label: "Period", value: "September" },
        { label: "Internal notes", value: "Hidden" },
      ]),
      step("Profile", "Change allowed contact details", "Save", [
        { label: "Phone", value: "Updated on the shared contact" },
        { label: "Audit", value: "Change is recorded" },
      ]),
    ],
  },
  {
    id: "tenant",
    group: "portal",
    role: "Tenant",
    summary: "Onboarding, tenancy, rent, and repairs.",
    steps: [
      step(
        "First login",
        "Account, then the next thing to do",
        "Open checklist",
        [
          { label: "Waiting on you", value: "Upload ID" },
          { label: "Waiting on Ezzi", value: "Referencing" },
        ],
      ),
      step(
        "Onboarding",
        "Same status the office sees, less internal detail",
        "Submit",
        [
          { label: "Step", value: "Identity" },
          { label: "State", value: "Blocked" },
          {
            label: "Provider failure",
            value: "Shown as something you can retry",
          },
        ],
      ),
      step("Tenancy", "Agreement and key documents", "Open agreement", [
        { label: "Address", value: "22 Queen's Road" },
        { label: "Other tenants", value: "Hidden" },
      ]),
      step("Rent", "Your balance and history", "View", [
        { label: "This month", value: "£1,150 due" },
        { label: "Internal notes", value: "Hidden" },
      ]),
      step("Repair", "Report an issue and follow it", "Submit", [
        { label: "Category", value: "Heating" },
        { label: "Urgency questions", value: "Fixed questions, not a guess" },
        { label: "Status", value: "Submitted" },
      ]),
    ],
  },
  {
    id: "contractor",
    group: "portal",
    role: "Contractor",
    summary: "Only the jobs assigned to you.",
    steps: [
      step("Jobs", "Assigned work, nothing else", "Open job", [
        { label: "Open jobs", value: "2" },
        { label: "Other jobs", value: "Hidden" },
      ]),
      step("Accept", "Take the visit or say why not", "Accept", [
        { label: "Address", value: "8 Deptford High Street" },
        { label: "Decline", value: "Needs a reason so it can be reassigned" },
      ]),
      step(
        "Complete",
        "Notes, photos, cost, then office review",
        "Mark complete",
        [
          { label: "Evidence", value: "2 photos" },
          { label: "Next", value: "Operations review" },
        ],
      ),
      step("Extra work", "Ask before doing more", "Submit quote", [
        { label: "Quote", value: "£180" },
        { label: "Status", value: "Waiting approval" },
      ]),
    ],
  },
];

export const modules: readonly ModuleDoor[] = [
  {
    id: "organisations",
    name: "Organisations",
    summary: "Agencies, branches, and who may see them.",
    rows: [
      { label: "Northbridge Lettings", value: "Active" },
      { label: "Harbour Housing", value: "Setup" },
    ],
  },
  {
    id: "properties",
    name: "Properties",
    summary: "Addresses, units, and whether a home is let, void, or on hold.",
    rows: [
      { label: "14 Rye Lane, Flat 2", value: "Occupied" },
      { label: "41 Larkhall Lane", value: "Available" },
    ],
  },
  {
    id: "lettings",
    name: "Lettings",
    summary: "Listings, applicants, and viewings.",
    rows: [
      { label: "41 Larkhall Lane", value: "Published" },
      { label: "Viewing 16:30", value: "Booked" },
    ],
  },
  {
    id: "onboarding",
    name: "Onboarding",
    summary: "One checklist from selected applicant to active tenancy.",
    rows: [
      { label: "22 Queen's Road", value: "Blocked" },
      { label: "9 Brookmill Road", value: "Waiting on signature" },
    ],
  },
  {
    id: "compliance",
    name: "Compliance",
    summary: "Certificates and expiry. Old evidence stays.",
    rows: [
      { label: "Gas safety, 14 Rye Lane", value: "Overdue" },
      { label: "EICR, 41 Larkhall Lane", value: "Due in 3 days" },
    ],
  },
  {
    id: "maintenance",
    name: "Maintenance",
    summary: "From a reported issue to a finished job.",
    rows: [
      { label: "No heating, Deptford", value: "Today" },
      { label: "Visit declined, Clifton Rise", value: "Blocked" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    summary: "Expected rent, matched payments, and arrears.",
    rows: [
      { label: "Unmatched £1,250", value: "Queue" },
      { label: "4 Ash Grove", value: "£640 short" },
    ],
  },
  {
    id: "documents",
    name: "Documents",
    summary:
      "Files stay attached to one record. Search cannot cross organisations.",
    rows: [
      { label: "gas-2026.pdf", value: "14 Rye Lane" },
      { label: "tenancy-agreement.pdf", value: "22 Queen's Road" },
    ],
  },
  {
    id: "migration",
    name: "Migration",
    summary: "Staging, mapping, dry run, then cutover.",
    rows: [
      { label: "Northbridge / Reapit", value: "Dry run" },
      { label: "Harbour / spreadsheet", value: "Mapping" },
    ],
  },
];

export function findFlow(id: string): RoleFlow | undefined {
  return roleFlows.find((flow) => flow.id === id);
}

export function findModule(id: string): ModuleDoor | undefined {
  return modules.find((item) => item.id === id);
}
