import type { DeskState } from "./data";

/** The organisation the current org-admin/staff user manages (first in scope). */
export function managedOrgId(state: DeskState): string {
  return state.orgs[0]?.id ?? "";
}

export function managedOrg(state: DeskState) {
  const id = managedOrgId(state);
  return state.orgs.find((item) => item.id === id);
}
