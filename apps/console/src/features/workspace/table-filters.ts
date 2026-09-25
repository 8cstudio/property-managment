import type { DataTableFilter } from "@ezzi/ui";

export function enumFilter(
  id: string,
  label: string,
  values: Iterable<string>,
  allLabel: string,
): DataTableFilter {
  const unique = [...new Set(values)].filter(Boolean).sort();
  return {
    id,
    label,
    options: [
      { value: "", label: allLabel },
      ...unique.map((value) => ({ value, label: value })),
    ],
  };
}

export function propertyTableFilters(
  properties: readonly { branch: string; status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      properties.map((item) => item.status),
      "All statuses",
    ),
    enumFilter(
      "branch",
      "Office",
      properties.map((item) => item.branch),
      "All offices",
    ),
  ];
}

export function propertyRowMeta(item: {
  address: string;
  branch: string;
  status: string;
  tenancy: string;
}) {
  return {
    searchText: `${item.address} ${item.branch} ${item.status} ${item.tenancy}`,
    filterValues: { status: item.status, branch: item.branch },
  };
}

export function workTableFilters(
  work: readonly { state: string; owner: string }[],
): DataTableFilter[] {
  return [
    enumFilter("state", "State", work.map((item) => item.state), "All states"),
    enumFilter("owner", "Owner", work.map((item) => item.owner), "All owners"),
  ];
}

export function workRowMeta(item: {
  title: string;
  place: string;
  owner: string;
  state: string;
  detail: string;
}) {
  return {
    searchText: `${item.title} ${item.place} ${item.owner} ${item.state} ${item.detail}`,
    filterValues: { state: item.state, owner: item.owner },
  };
}

export function listingTableFilters(
  listings: readonly { portal: string; status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "portal",
      "Portal",
      listings.map((item) => item.portal),
      "All portals",
    ),
    enumFilter(
      "status",
      "Status",
      listings.map((item) => item.status),
      "All statuses",
    ),
  ];
}

export function certificateTableFilters(
  certificates: readonly { status: string; type: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      certificates.map((item) => item.status),
      "All statuses",
    ),
    enumFilter(
      "type",
      "Type",
      certificates.map((item) => item.type),
      "All types",
    ),
  ];
}

export function paymentTableFilters(
  payments: readonly { status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      payments.map((item) => item.status),
      "All statuses",
    ),
  ];
}

export function migrationTableFilters(
  migrations: readonly { stage: string; source: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "stage",
      "Stage",
      migrations.map((item) => item.stage),
      "All stages",
    ),
    enumFilter(
      "source",
      "Source",
      migrations.map((item) => item.source),
      "All sources",
    ),
  ];
}

export function jobTableFilters(
  jobs: readonly { status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      jobs.map((item) => item.status),
      "All statuses",
    ),
  ];
}

export function integrationTableFilters(
  integrations: readonly { status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      integrations.map((item) => item.status),
      "All statuses",
    ),
  ];
}

export function applicantTableFilters(
  applicants: readonly { stage: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "stage",
      "Stage",
      applicants.map((item) => item.stage),
      "All stages",
    ),
  ];
}

export function viewingTableFilters(
  viewings: readonly { outcome: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "outcome",
      "Outcome",
      viewings.map((item) => item.outcome),
      "All outcomes",
    ),
  ];
}

export function documentTableFilters(
  documents: readonly { type: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "type",
      "Type",
      documents.map((item) => item.type),
      "All types",
    ),
  ];
}

export function scheduleTableFilters(
  schedules: readonly { status: string; frequency: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      schedules.map((item) => item.status),
      "All statuses",
    ),
    enumFilter(
      "frequency",
      "Frequency",
      schedules.map((item) => item.frequency),
      "All frequencies",
    ),
  ];
}

export function requirementTableFilters(
  requirements: readonly { status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      requirements.map((item) => item.status),
      "All statuses",
    ),
  ];
}

export function statementTableFilters(
  statements: readonly { status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      statements.map((item) => item.status),
      "All statuses",
    ),
  ];
}

export function requestTableFilters(
  requests: readonly { status: string }[],
): DataTableFilter[] {
  return [
    enumFilter(
      "status",
      "Status",
      requests.map((item) => item.status),
      "All statuses",
    ),
  ];
}
