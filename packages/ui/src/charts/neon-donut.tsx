"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { DonutSegment } from "./donut-chart";

const PALETTE = [
  "var(--accent, #0f766e)",
  "var(--accent-bright, #14b8a6)",
  "#2dd4bf",
  "#5eead4",
  "#94a3b8",
  "#64748b",
];

type NeonDonutProps = {
  data: DonutSegment[];
  height?: number;
  centerValue?: string;
  centerLabel?: string;
  animate?: boolean;
};

export function NeonDonut({
  data,
  height = 240,
  centerValue,
  centerLabel = "Total",
  animate = false,
}: NeonDonutProps) {
  if (!data.length) return null;
  const total = data.reduce((sum, row) => sum + row.value, 0);
  const center = centerValue ?? String(total);

  return (
    <div
      className={`neon-donut${animate ? " neon-donut--animate" : ""}`}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {PALETTE.map((color, index) => (
              <linearGradient
                key={color}
                id={`donut-grad-${index}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.55} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={3}
            stroke="var(--panel, #fbf8f3)"
            strokeWidth={3}
            isAnimationActive={animate}
            animationDuration={900}
            animationBegin={0}
          >
            {data.map((segment, index) => (
              <Cell
                key={segment.name}
                fill={
                  segment.color ??
                  `url(#donut-grad-${index % PALETTE.length})`
                }
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0];
              return (
                <div className="chart-tooltip">
                  <strong>{row?.name}</strong>
                  <span>{row?.value}</span>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="neon-donut__core">
        <strong>{center}</strong>
        <span>{centerLabel}</span>
      </div>
    </div>
  );
}
