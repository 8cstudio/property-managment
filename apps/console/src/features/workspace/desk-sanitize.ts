import type { DeskState } from "./data";

/** Drop desk rows that belong to org ids which no longer exist (legacy demo data). */
export function stripOrphanDeskData(state: DeskState): DeskState {
  const orgIds = new Set(state.orgs.map((o) => o.id));
  if (orgIds.size === 0) {
    return {
      ...state,
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
      onboarding: [],
      security: [],
    };
  }

  const inOrg = (orgId: string) => orgIds.has(orgId);

  return {
    ...state,
    properties: state.properties.filter((p) => inOrg(p.orgId)),
    work: state.work.filter((w) => inOrg(w.orgId)),
    documents: state.documents.filter((d) => inOrg(d.orgId)),
    integrations: state.integrations.filter((i) => inOrg(i.orgId)),
  };
}
