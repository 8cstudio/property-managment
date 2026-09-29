export const queueKinds = [
  "compliance",
  "maintenance",
  "onboarding",
  "payments",
  "arrears",
] as const;

export type QueueKind = (typeof queueKinds)[number];

export type QueueState = "overdue" | "today" | "blocked" | "open";

export type QueueItem = {
  id: string;
  kind: QueueKind;
  due: string;
  title: string;
  place: string;
  org: string;
  branch: string;
  owner: string;
  state: QueueState;
};

const labels: Record<QueueKind, string> = {
  compliance: "Compliance",
  maintenance: "Maintenance",
  onboarding: "Onboarding",
  payments: "Payments",
  arrears: "Arrears",
};

export function kindLabel(kind: QueueKind): string {
  return labels[kind];
}
