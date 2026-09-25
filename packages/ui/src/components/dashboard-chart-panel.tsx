"use client";

import { DonutChart, type DonutSegment } from "../charts/donut-chart";
import { RadialGauge } from "../charts/radial-gauge";
import { Card } from "./card";
import { SectionLabel } from "./page-frame";

export function DashboardDonutPanel({
  title,
  segments,
  height = 200,
}: {
  title: string;
  segments: DonutSegment[];
  height?: number;
}) {
  if (!segments.length) return null;
  return (
    <Card as="section" className="chart-panel">
      <SectionLabel>{title}</SectionLabel>
      <DonutChart data={segments} height={height} />
    </Card>
  );
}

export function DashboardGaugePanel({
  title,
  value,
  max = 100,
  label,
}: {
  title: string;
  value: number;
  max?: number;
  label?: string;
}) {
  return (
    <Card as="section" className="chart-panel">
      <SectionLabel>{title}</SectionLabel>
      <RadialGauge
        value={value}
        max={max}
        {...(label ? { label } : {})}
      />
      <p className="chart-caption">
        {value} / {max}
      </p>
    </Card>
  );
}
