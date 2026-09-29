import type { DeskState, Org } from "@/features/workspace/data";
import type { QueueItem, QueueKind, QueueState } from "./queue";

function mapWorkKind(kind: string): QueueKind {
  const key = kind.trim().toLowerCase();
  if (key.includes("compliance")) return "compliance";
  if (key.includes("maintenance")) return "maintenance";
  if (key.includes("onboarding")) return "onboarding";
  if (key.includes("payment") || key.includes("finance")) return "payments";
  if (key.includes("arrear")) return "arrears";
  return "maintenance";
}

function mapWorkState(state: string): QueueState {
  const key = state.trim().toLowerCase();
  if (key === "overdue") return "overdue";
  if (key === "today") return "today";
  if (key === "blocked") return "blocked";
  return "open";
}

function orgName(orgs: Org[], orgId: string): string {
  return orgs.find((o) => o.id === orgId)?.name ?? "";
}

function defaultBranch(orgs: Org[], orgId: string): string {
  return orgs.find((o) => o.id === orgId)?.offices[0]?.name ?? "—";
}

/** Build the operations queue from persisted desk data (no static fixtures). */
export function deriveQueueFromDesk(state: DeskState): QueueItem[] {
  const orgs = state.orgs;
  const items: QueueItem[] = [];

  for (const row of state.work) {
    if (row.state === "Resolved") continue;
    const org = orgName(orgs, row.orgId);
    if (!org) continue;
    items.push({
      id: row.id,
      kind: mapWorkKind(row.kind),
      due: row.state,
      title: row.title,
      place: row.place,
      org,
      branch: defaultBranch(orgs, row.orgId),
      owner: row.owner,
      state: mapWorkState(row.state),
    });
  }

  for (const row of state.payments) {
    if (row.status !== "Unmatched") continue;
    items.push({
      id: `pay-${row.id}`,
      kind: "payments",
      due: row.status,
      title: `Unmatched payment ${row.amount}`,
      place: row.reference,
      org: orgs[0]?.name ?? "—",
      branch: "—",
      owner: "Finance",
      state: "open",
    });
  }

  for (const row of state.arrears) {
    items.push({
      id: `ar-${row.id}`,
      kind: "arrears",
      due: row.age,
      title: `Rent short by ${row.amount}`,
      place: row.place,
      org: orgs[0]?.name ?? "—",
      branch: "—",
      owner: "Finance",
      state: "overdue",
    });
  }

  for (const row of state.certificates) {
    if (row.status !== "Overdue" && row.status !== "Due") continue;
    items.push({
      id: `cert-${row.id}`,
      kind: "compliance",
      due: row.expiry,
      title: `${row.type} — ${row.status.toLowerCase()}`,
      place: row.property,
      org: orgs[0]?.name ?? "—",
      branch: "—",
      owner: "Compliance",
      state: row.status === "Overdue" ? "overdue" : "open",
    });
  }

  return items;
}

export function deriveOrganisations(state: DeskState): string[] {
  return state.orgs.map((o) => o.name).sort((a, b) => a.localeCompare(b));
}

export function deriveBranches(state: DeskState): string[] {
  const names = new Set<string>();
  for (const org of state.orgs) {
    for (const office of org.offices) {
      if (office.name.trim()) names.add(office.name.trim());
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}
