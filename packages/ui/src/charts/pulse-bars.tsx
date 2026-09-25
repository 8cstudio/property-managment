"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type PulseBarRow = {
  name: string;
  value: number;
};

export function PulseBars({
  data,
  height = 220,
}: {
  data: readonly PulseBarRow[];
  height?: number;
}) {
  if (!data.length) return null;

  return (
    <div className="pulse-bars" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data]} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="pulse-bar-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-bright, #14b8a6)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--accent, #0f766e)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--line, #d2cbc0)"
            strokeDasharray="3 6"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as PulseBarRow;
              return (
                <div className="chart-tooltip">
                  <strong>{row.name}</strong>
                  <span>{row.value}</span>
                </div>
              );
            }}
          />
          <Bar
            dataKey="value"
            fill="url(#pulse-bar-fill)"
            radius={[8, 8, 2, 2]}
            maxBarSize={42}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
