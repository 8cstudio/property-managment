import type { DeskState } from "./data";

/** Mock tenant org for org-admin and staff roles. */
export function managedOrgId(state: DeskState): string {
  return state.orgs.find((item) => item.id === "northbridge")?.id ?? state.orgs[0]?.id ?? "northbridge";
}

export function managedOrg(state: DeskState) {
  const id = managedOrgId(state);
  return state.orgs.find((item) => item.id === id);
}
