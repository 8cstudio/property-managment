import type { KpiStatItem } from "./kpi-stat-grid";
import { KpiStatGrid } from "./kpi-stat-grid";

export type StatItem = KpiStatItem;

/** KPI cards with spark lines and motion. */
export function StatGrid({
  items,
  size = "plate",
}: {
  items: readonly StatItem[];
  size?: "compact" | "plate";
}) {
  if (size === "plate") {
    return (
      <div className="analytics-deck__kpis">
        <KpiStatGrid items={items} variant="plate" />
      </div>
    );
  }
  return <KpiStatGrid items={items} variant="compact" />;
}
