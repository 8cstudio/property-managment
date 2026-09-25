"use client";

import type { ReactNode } from "react";
import { NeonDonut } from "../charts/neon-donut";
import { PulseBars, type PulseBarRow } from "../charts/pulse-bars";
import type { DonutSegment } from "../charts/donut-chart";
import { RadialGauge } from "../charts/radial-gauge";
import { Card } from "./card";
import { SectionLabel } from "./page-frame";
import { useReplayWhenInView } from "../hooks/use-replay-when-in-view";
import { KpiStatGrid, type KpiStatItem } from "./kpi-stat-grid";
import { MetricsRiver, type RiverMetric } from "./metrics-river";

type DonutBlock = {
  title: string;
  segments: DonutSegment[];
  centerValue?: string;
  centerLabel?: string;
};

type GaugeBlock = {
  title: string;
  value: number;
  max?: number;
  label?: string;
};

function DonutPanel({ donut }: { donut: DonutBlock }) {
  const { ref, replayToken, shouldAnimate } = useReplayWhenInView();

  return (
    <>
      <div ref={ref} className="chart-in-view">
        <NeonDonut
          key={`donut-${replayToken}`}
          data={donut.segments}
          height={240}
          animate={shouldAnimate}
          {...(donut.centerValue ? { centerValue: donut.centerValue } : {})}
          {...(donut.centerLabel ? { centerLabel: donut.centerLabel } : {})}
        />
      </div>
      <ul className="donut-legend" aria-label="Segments">
        {donut.segments.map((segment, index) => (
          <li key={segment.name}>
            <span
              className="donut-legend__swatch"
              data-index={index % 6}
              aria-hidden
            />
            <span>{segment.name}</span>
            <strong>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}

function GaugePanel({ gauge }: { gauge: GaugeBlock }) {
  const { ref, replayToken, shouldAnimate } = useReplayWhenInView();
  const max = gauge.max ?? 100;
  const pct = Math.round((gauge.value / Math.max(max, 1)) * 100);

  return (
    <>
      <div ref={ref} className="radial-gauge-wrap chart-in-view">
        <RadialGauge
          key={`gauge-${replayToken}`}
          value={gauge.value}
          max={max}
          height={200}
          animate={shouldAnimate}
          {...(gauge.label ? { label: gauge.label } : {})}
        />
        <div
          className={`radial-gauge-wrap__core${shouldAnimate ? " radial-gauge-wrap__core--animate" : ""}`}
        >
          <strong key={`gauge-pct-${replayToken}`}>{pct}%</strong>
          <span>{gauge.label ?? "Progress"}</span>
        </div>
      </div>
      <p className="chart-caption">
        {gauge.value} / {gauge.max ?? 100}
      </p>
    </>
  );
}

export function UnifiedAnalyticsDeck({
  title,
  caption,
  metrics,
  kpis = [],
  donuts = [],
  gauges = [],
  bars,
}: {
  title?: string;
  caption?: string;
  metrics: readonly RiverMetric[];
  kpis?: readonly KpiStatItem[];
  donuts?: readonly DonutBlock[];
  gauges?: readonly GaugeBlock[];
  bars?: { title: string; rows: readonly PulseBarRow[] };
}) {
  const hasSecondary =
    donuts.length > 0 || gauges.length > 0 || Boolean(bars);

  return (
    <div className="analytics-deck analytics-deck--unified">
      {kpis.length > 0 ? (
        <div className="analytics-deck__kpis">
          <KpiStatGrid items={kpis} variant="plate" />
        </div>
      ) : null}

      <Card as="section" className="chart-panel chart-panel--neon metrics-river-card">
        <MetricsRiver
          metrics={metrics}
          {...(title ? { title } : {})}
          {...(caption ? { caption } : {})}
        />
      </Card>

      {hasSecondary ? (
        <div className="analytics-deck__charts">
          {donuts.map((donut) => (
            <Card
              key={donut.title}
              as="section"
              className="chart-panel chart-panel--neon"
            >
              <SectionLabel>{donut.title}</SectionLabel>
              <DonutPanel donut={donut} />
            </Card>
          ))}
          {gauges.map((gauge) => (
            <Card
              key={gauge.title}
              as="section"
              className="chart-panel chart-panel--neon"
            >
              <SectionLabel>{gauge.title}</SectionLabel>
              <GaugePanel gauge={gauge} />
            </Card>
          ))}
          {bars ? (
            <Card
              as="section"
              className="chart-panel chart-panel--neon chart-panel--wide"
            >
              <SectionLabel>{bars.title}</SectionLabel>
              <PulseBars data={bars.rows} height={240} />
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function KpiPlateDeck({ items }: { items: readonly KpiStatItem[] }) {
  return (
    <div className="analytics-deck">
      <div className="analytics-deck__kpis">
        <KpiStatGrid items={items} variant="plate" />
      </div>
    </div>
  );
}

export function AnalyticsDeck({
  kpis,
  donuts = [],
  gauges = [],
  bars,
  footer,
}: {
  kpis: readonly KpiStatItem[];
  donuts?: readonly DonutBlock[];
  gauges?: readonly GaugeBlock[];
  bars?: { title: string; rows: readonly PulseBarRow[] };
  footer?: ReactNode;
}) {
  const hasCharts = donuts.length > 0 || gauges.length > 0 || Boolean(bars);

  return (
    <div className="analytics-deck">
      <div className="analytics-deck__kpis">
        <KpiStatGrid items={kpis} variant="plate" />
      </div>
      {hasCharts ? (
        <div className="analytics-deck__charts">
          {donuts.map((donut) => (
            <Card
              key={donut.title}
              as="section"
              className="chart-panel chart-panel--neon"
            >
              <SectionLabel>{donut.title}</SectionLabel>
              <DonutPanel donut={donut} />
            </Card>
          ))}
          {gauges.map((gauge) => (
            <Card
              key={gauge.title}
              as="section"
              className="chart-panel chart-panel--neon"
            >
              <SectionLabel>{gauge.title}</SectionLabel>
              <GaugePanel gauge={gauge} />
            </Card>
          ))}
          {bars ? (
            <Card
              as="section"
              className="chart-panel chart-panel--neon chart-panel--wide"
            >
              <SectionLabel>{bars.title}</SectionLabel>
              <PulseBars data={bars.rows} height={240} />
            </Card>
          ) : null}
        </div>
      ) : null}
      {footer}
    </div>
  );
}
