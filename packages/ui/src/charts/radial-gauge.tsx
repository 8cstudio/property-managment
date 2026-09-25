"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

type RadialGaugeProps = {
  value: number;
  max?: number;
  label?: string;
  height?: number;
  fill?: string;
  animate?: boolean;
};

/** Circular progress-style gauge (compliance %, matched rent, etc.). */
export function RadialGauge({
  value,
  max = 100,
  label = "Progress",
  height = 168,
  fill = "var(--accent-bright, #14b8a6)",
  animate = false,
}: RadialGaugeProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const data = [{ name: label, value: clamped, fill }];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadialBarChart
        data={data}
        innerRadius="72%"
        outerRadius="100%"
        startAngle={90}
        endAngle={-270}
        barSize={14}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, max]}
          angleAxisId={0}
          tick={false}
        />
        <RadialBar
          background={{ fill: "var(--line, #e8e2d8)" }}
          dataKey="value"
          cornerRadius={6}
          isAnimationActive={animate}
          animationDuration={950}
          animationEasing="ease-out"
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}
