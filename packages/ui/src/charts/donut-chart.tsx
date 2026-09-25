"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type DonutSegment = {
  name: string;
  value: number;
  color?: string;
};

const FALLBACK_COLORS = [
  "var(--accent, #c45c26)",
  "var(--ink-soft, #5c564c)",
  "#8a8276",
  "#a89f92",
  "#6b6560",
];

type DonutChartProps = {
  data: DonutSegment[];
  /** Fixed pixel height keeps layout stable and avoids resize thrash. */
  height?: number;
  innerRadius?: string | number;
  outerRadius?: string | number;
  showTooltip?: boolean;
};

/** Donut / pie chart. Import from `@ezzi/ui/charts`; use `next/dynamic` on heavy pages. */
export function DonutChart({
  data,
  height = 220,
  innerRadius = "58%",
  outerRadius = "86%",
  showTooltip = true,
}: DonutChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          stroke="var(--panel, #fff)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {data.map((segment, index) => {
            const fill: string =
              segment.color ??
              FALLBACK_COLORS[index % FALLBACK_COLORS.length] ??
              "#c45c26";
            return <Cell key={segment.name} fill={fill} />;
          })}
        </Pie>
        {showTooltip ? (
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0];
              return (
                <div
                  style={{
                    padding: "0.35rem 0.5rem",
                    border: "1px solid var(--line, #ddd)",
                    borderRadius: 2,
                    background: "var(--panel, #fff)",
                    color: "var(--ink, #1c1915)",
                    fontSize: "0.78rem",
                  }}
                >
                  <strong>{row?.name}</strong>: {row?.value}
                </div>
              );
            }}
          />
        ) : null}
      </PieChart>
    </ResponsiveContainer>
  );
}
