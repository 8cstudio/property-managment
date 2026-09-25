"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addDays,
  CHART_HISTORY_DAYS,
  eachDayInRange,
  formatChartDayLabel,
  historyIndexForDate,
  resolveChartRange,
  toDateInputValue,
  todayStart,
  type ChartRangePreset,
} from "../lib/chart-date-range";
import { buildMetricDailyHistory } from "../lib/metric-daily-history";
import { Button } from "./button";
import { SectionLabel } from "./page-frame";

export type RiverMetric = {
  key: string;
  label: string;
  value: number;
  href?: string;
  tone?: "accent" | "warn" | "calm";
  series?: readonly number[];
  badge?: string;
};

const ALL_METRICS = "__all__";
const INTRO_LINE_MS = 1400;
const INTRO_LINE_STAGGER_MS = 100;

const toneColor: Record<"accent" | "warn" | "calm", string> = {
  accent: "var(--accent-bright, #14b8a6)",
  warn: "var(--overdue-ink, #991b1b)",
  calm: "var(--open-ink, #115e59)",
};

function defaultCustomRange(): { start: string; end: string } {
  const end = todayStart();
  const start = addDays(end, -6);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

export function MetricsRiver({
  title = "Platform pulse",
  caption,
  metrics,
}: {
  title?: string;
  caption?: string;
  metrics: readonly RiverMetric[];
}) {
  const [activeTab, setActiveTab] = useState<string>(ALL_METRICS);
  const [rangePreset, setRangePreset] = useState<ChartRangePreset>("7");
  const initialCustom = defaultCustomRange();
  const [draftCustomStart, setDraftCustomStart] = useState(initialCustom.start);
  const [draftCustomEnd, setDraftCustomEnd] = useState(initialCustom.end);
  const [appliedCustomStart, setAppliedCustomStart] = useState(
    initialCustom.start,
  );
  const [appliedCustomEnd, setAppliedCustomEnd] = useState(initialCustom.end);
  const [introLineAnimation, setIntroLineAnimation] = useState(true);

  const chartRange = useMemo(
    () =>
      resolveChartRange(
        rangePreset,
        rangePreset === "custom" ? appliedCustomStart : draftCustomStart,
        rangePreset === "custom" ? appliedCustomEnd : draftCustomEnd,
      ),
    [
      appliedCustomEnd,
      appliedCustomStart,
      draftCustomEnd,
      draftCustomStart,
      rangePreset,
    ],
  );

  const enriched = useMemo(
    () =>
      metrics.map((metric) => ({
        ...metric,
        tone: metric.tone ?? "accent",
        color: toneColor[metric.tone ?? "accent"],
        history: buildMetricDailyHistory(metric, CHART_HISTORY_DAYS),
      })),
    [metrics],
  );

  const chartDays = useMemo(
    () => eachDayInRange(chartRange.start, chartRange.end),
    [chartRange.end, chartRange.start],
  );

  const chartData = useMemo(() => {
    const anchor = chartRange.end;
    return chartDays.map((day) => {
      const label =
        day.getTime() === todayStart().getTime()
          ? "Today"
          : formatChartDayLabel(day);
      const row: Record<string, string | number> = { label };
      for (const metric of enriched) {
        const index = historyIndexForDate(metric.history.length, day, anchor);
        row[metric.key] = metric.history[index] ?? 0;
      }
      return row;
    });
  }, [chartDays, chartRange.end, enriched]);

  function applyCustomRange() {
    setAppliedCustomStart(draftCustomStart);
    setAppliedCustomEnd(draftCustomEnd);
  }

  function onRangePresetChange(next: ChartRangePreset) {
    setRangePreset(next);
    if (next === "custom") {
      const defaults = defaultCustomRange();
      setDraftCustomStart(defaults.start);
      setDraftCustomEnd(defaults.end);
      setAppliedCustomStart(defaults.start);
      setAppliedCustomEnd(defaults.end);
    }
  }

  const visible =
    activeTab === ALL_METRICS
      ? enriched
      : enriched.filter((metric) => metric.key === activeTab);

  const activeMetric =
    activeTab === ALL_METRICS
      ? null
      : enriched.find((metric) => metric.key === activeTab);

  useEffect(() => {
    if (!introLineAnimation) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setIntroLineAnimation(false);
      return;
    }
    const timer = window.setTimeout(
      () => setIntroLineAnimation(false),
      INTRO_LINE_MS + metrics.length * INTRO_LINE_STAGGER_MS + 80,
    );
    return () => window.clearTimeout(timer);
  }, [introLineAnimation, metrics.length]);

  return (
    <div className="metrics-river">
      <div className="metrics-river__head">
        <div>
          <SectionLabel>{title}</SectionLabel>
          {caption ? <p className="metrics-river__caption">{caption}</p> : null}
        </div>
        <p className="metrics-river__hint">
          Hover for values · tabs focus one line · period filters the trend
        </p>
      </div>

      <div className="metrics-river__range" role="group" aria-label="Chart period">
        <label className="metrics-river__range-field">
          <span className="metrics-river__range-label">Period</span>
          <select
            value={rangePreset}
            onChange={(event) =>
              onRangePresetChange(event.target.value as ChartRangePreset)
            }
          >
            <option value="3">Last 3 days</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>
        </label>
        {rangePreset === "custom" ? (
          <>
            <label className="metrics-river__range-field">
              <span className="metrics-river__range-label">From</span>
              <input
                type="date"
                value={draftCustomStart}
                max={draftCustomEnd || undefined}
                onChange={(event) => setDraftCustomStart(event.target.value)}
              />
            </label>
            <label className="metrics-river__range-field">
              <span className="metrics-river__range-label">To</span>
              <input
                type="date"
                value={draftCustomEnd}
                min={draftCustomStart || undefined}
                max={toDateInputValue(todayStart())}
                onChange={(event) => setDraftCustomEnd(event.target.value)}
              />
            </label>
            <div className="metrics-river__range-actions">
              <span
                className="metrics-river__range-label metrics-river__range-label--spacer"
                aria-hidden="true"
              >
                Actions
              </span>
              <div className="metrics-river__range-buttons">
                <Button type="button" onClick={applyCustomRange}>
                  Apply
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div
        className="metrics-river__tabs"
        role="tablist"
        aria-label="Metric views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === ALL_METRICS}
          className={`metrics-river__tab${activeTab === ALL_METRICS ? " metrics-river__tab--on" : ""}`}
          onClick={() => setActiveTab(ALL_METRICS)}
        >
          All lines
        </button>
        {enriched.map((metric, index) => {
          const on = activeTab === metric.key;
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.25 }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={on}
                className={`metrics-river__tab${on ? " metrics-river__tab--on" : ""}`}
                onClick={() => setActiveTab(metric.key)}
                style={{ "--river-tone": metric.color } as CSSProperties}
              >
                <span className="metrics-river__tab-dot" aria-hidden />
                <span className="metrics-river__tab-label">{metric.label}</span>
                <strong className="metrics-river__tab-value">{metric.value}</strong>
                {metric.badge ? (
                  <span className="metrics-river__tab-badge">{metric.badge}</span>
                ) : null}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="metrics-river__chart">
        {activeMetric?.href ? (
          <Link
            className="metrics-river__chart-open"
            href={activeMetric.href}
            aria-label={`Open ${activeMetric.label}`}
            title={`Open ${activeMetric.label}`}
          >
            <ExternalLink strokeWidth={2} aria-hidden />
          </Link>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 16, right: 16, left: -4, bottom: 4 }}
          >
            <defs>
              {visible.map((metric) => (
                <linearGradient
                  key={metric.key}
                  id={`river-fill-${metric.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0.03} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              stroke="color-mix(in srgb, var(--line) 85%, transparent)"
              strokeDasharray="4 8"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              shared
              trigger="hover"
              allowEscapeViewBox={{ x: true, y: true }}
              cursor={{
                stroke: "var(--accent)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const pointIndex = chartData.findIndex(
                  (row) => row.label === label,
                );
                return (
                  <div className="chart-tooltip metrics-river__tooltip">
                    <span className="metrics-river__tooltip-week">
                      {String(label)}
                    </span>
                    <ul>
                      {payload.map((entry) => {
                        const metric = enriched.find(
                          (m) => m.key === entry.dataKey,
                        );
                        if (!metric) return null;
                        const value = Number(entry.value ?? 0);
                        const prev =
                          pointIndex > 0
                            ? Number(
                                chartData[pointIndex - 1]?.[metric.key] ?? value,
                              )
                            : value;
                        const delta = value - prev;
                        return (
                          <li key={String(entry.dataKey)}>
                            <span
                              className="metrics-river__tooltip-dot"
                              style={{ background: metric.color }}
                            />
                            <span className="metrics-river__tooltip-copy">
                              <span>{metric.label}</span>
                              {label === "Today" ? (
                                <span className="metrics-river__tooltip-live">
                                  Live · {metric.value}
                                </span>
                              ) : null}
                            </span>
                            <strong>{value}</strong>
                            {pointIndex > 0 && delta !== 0 ? (
                              <span
                                className={`metrics-river__tooltip-delta${delta > 0 ? " metrics-river__tooltip-delta--up" : " metrics-river__tooltip-delta--down"}`}
                              >
                                {delta > 0 ? "+" : ""}
                                {delta}
                              </span>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              }}
            />
            {visible.map((metric, index) => (
              <Area
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={activeTab === ALL_METRICS ? 2 : 2.75}
                fill={`url(#river-fill-${metric.key})`}
                isAnimationActive={introLineAnimation}
                animationDuration={INTRO_LINE_MS}
                animationEasing="ease-out"
                animationBegin={index * INTRO_LINE_STAGGER_MS}
                dot={{
                  r: 2.5,
                  strokeWidth: 0,
                  fill: metric.color,
                  opacity: introLineAnimation ? 0 : 0.35,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "var(--panel)",
                  fill: metric.color,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
