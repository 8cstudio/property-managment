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

export const queue: readonly QueueItem[] = [
  {
    id: "q1",
    kind: "compliance",
    due: "Today",
    title: "Gas safety expired",
    place: "14 Rye Lane, Flat 2",
    org: "Northbridge Lettings",
    branch: "Peckham",
    owner: "Unassigned",
    state: "overdue",
  },
  {
    id: "q2",
    kind: "maintenance",
    due: "Today",
    title: "No heating reported",
    place: "8 Deptford High Street",
    org: "Northbridge Lettings",
    branch: "Deptford",
    owner: "A. Okonkwo",
    state: "today",
  },
  {
    id: "q3",
    kind: "onboarding",
    due: "Today",
    title: "Referencing stopped: ID unreadable",
    place: "22 Queen's Road",
    org: "Northbridge Lettings",
    branch: "Peckham",
    owner: "L. Shah",
    state: "blocked",
  },
  {
    id: "q4",
    kind: "payments",
    due: "Yesterday",
    title: "Unmatched payment, £1,250",
    place: "Reference NB-4419",
    org: "Northbridge Lettings",
    branch: "Greenwich",
    owner: "Finance queue",
    state: "overdue",
  },
  {
    id: "q5",
    kind: "arrears",
    due: "18 days",
    title: "Rent short by £640",
    place: "4 Ash Grove",
    org: "Harbour Housing",
    branch: "Deptford",
    owner: "A. Okonkwo",
    state: "overdue",
  },
  {
    id: "q6",
    kind: "compliance",
    due: "3 days",
    title: "EICR due",
    place: "41 Larkhall Lane",
    org: "Harbour Housing",
    branch: "Greenwich",
    owner: "L. Shah",
    state: "open",
  },
  {
    id: "q7",
    kind: "onboarding",
    due: "Tomorrow",
    title: "Agreement waiting on signature",
    place: "9 Brookmill Road",
    org: "Northbridge Lettings",
    branch: "Deptford",
    owner: "L. Shah",
    state: "open",
  },
  {
    id: "q8",
    kind: "maintenance",
    due: "Today",
    title: "Contractor declined the visit",
    place: "16 Clifton Rise",
    org: "Harbour Housing",
    branch: "Peckham",
    owner: "Unassigned",
    state: "blocked",
  },
];

export const organisations = [
  "Northbridge Lettings",
  "Harbour Housing",
] as const;
export const branches = ["Peckham", "Deptford", "Greenwich"] as const;

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
