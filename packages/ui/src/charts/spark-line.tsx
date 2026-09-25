"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

export function SparkLine({
  data,
  color = "var(--accent-bright, #14b8a6)",
  height = 48,
}: {
  data: readonly number[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const rows = data.map((value, index) => ({ index, value }));
  const id = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className="spark-line" aria-hidden="true">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={rows} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
