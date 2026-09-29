import type { DeskState } from "@/features/workspace/data";

export type MetricSnapshot = {
  /** YYYY-MM-DD in Europe/London */
  date: string;
  values: Record<string, number>;
};

const MAX_SNAPSHOT_DAYS = 90;

export function todayMetricDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());
}

/** Snapshot every dashboard metric key from current desk state. */
export function collectMetricValues(state: DeskState): Record<string, number> {
  const failedIntegrations = state.integrations.filter(
    (item) => item.status === "Failed",
  ).length;
  return {
    orgs: state.orgs.length,
    suspended: state.orgs.filter((item) => item.status === "Suspended").length,
    failed: failedIntegrations,
    audit: state.audit.length,
    requests: state.requests.filter((item) => item.status === "Requested")
      .length,
    offices: state.orgs.reduce((n, org) => n + org.offices.length, 0),
    users: state.users.length,
    invited: state.users.filter((item) => item.status === "Invited").length,
    work: state.work.length,
    overdue: state.work.filter((item) => item.state === "Overdue").length,
    certOverdue: state.certificates.filter((item) => item.status === "Overdue")
      .length,
    blocked: state.work.filter((item) => item.state === "Blocked").length,
    open: state.work.filter((item) => item.state === "Open").length,
    resolved: state.work.filter((item) => item.state === "Resolved").length,
    occupied: state.properties.filter((item) => item.status === "Occupied")
      .length,
    available: state.properties.filter((item) => item.status === "Available")
      .length,
    void: state.properties.filter((item) => item.status === "Void").length,
    onboarding: state.properties.filter((item) => item.status === "Onboarding")
      .length,
    listings: state.listings.length,
    published: state.listings.filter((item) => item.status === "Published")
      .length,
    applicants: state.applicants.length,
    viewings: state.viewings.length,
    compliant: state.certificates.filter((item) => item.status === "Compliant")
      .length,
    soon: state.certificates.filter((item) => item.status === "Due soon")
      .length,
    unmatched: state.payments.filter((item) => item.status === "Unmatched")
      .length,
    matched: state.payments.filter((item) => item.status === "Matched").length,
    arrears: state.arrears.length,
    drafts: state.statements.filter((item) => item.status === "Draft").length,
    mapped: state.migrations.filter((item) => item.stage === "Mapped").length,
    dry: state.migrations.filter((item) => item.stage === "Dry run").length,
    live: state.migrations.filter((item) => item.stage === "Live").length,
    total: state.migrations.length,
    homes: state.properties.length,
    approvals: state.jobs.filter((item) => item.status === "Waiting approval")
      .length,
    statements: state.statements.length,
    steps: state.onboarding.filter((item) => item.state !== "Complete").length,
    repairs: state.jobs.filter((item) =>
      ["Submitted", "Assigned", "Scheduled", "In progress"].includes(
        item.status,
      ),
    ).length,
    scheduled: state.jobs.filter((item) => item.status === "Scheduled").length,
    assigned: state.jobs.filter((item) => item.status === "Assigned").length,
    active: state.jobs.filter((item) =>
      ["Assigned", "Scheduled", "In progress"].includes(item.status),
    ).length,
  };
}

export function upsertMetricSnapshots(
  snapshots: MetricSnapshot[],
  values: Record<string, number>,
): MetricSnapshot[] {
  const date = todayMetricDate();
  const idx = snapshots.findIndex((row) => row.date === date);
  let next: MetricSnapshot[];
  if (idx >= 0) {
    next = snapshots.map((row, i) =>
      i === idx ? { date, values: { ...row.values, ...values } } : row,
    );
  } else {
    next = [{ date, values }, ...snapshots];
  }
  return next
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_SNAPSHOT_DAYS);
}

/** Oldest-first daily values for a metric key (for chart series). */
export function seriesForMetricKey(
  snapshots: MetricSnapshot[],
  metricKey: string,
  points: number,
): number[] | undefined {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const slice = sorted.slice(-points);
  if (slice.length < 2) return undefined;
  return slice.map((row) => Math.max(0, row.values[metricKey] ?? 0));
}

export type RiverMetricInput = {
  key: string;
  label: string;
  value: number;
  href?: string;
  tone?: "accent" | "warn" | "calm";
  series?: readonly number[];
  badge?: string;
};

export function attachMetricSeries(
  snapshots: MetricSnapshot[] | undefined,
  metrics: readonly RiverMetricInput[],
  historyPoints = 90,
): RiverMetricInput[] {
  const rows = snapshots ?? [];
  return metrics.map((metric) => {
    const series = seriesForMetricKey(rows, metric.key, historyPoints);
    return series ? { ...metric, series } : metric;
  });
}
