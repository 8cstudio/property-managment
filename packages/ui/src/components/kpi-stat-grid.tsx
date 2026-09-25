"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { SparkLine } from "../charts/spark-line";

export type KpiStatItem = {
  href: string;
  value: number;
  label: string;
  icon?: LucideIcon;
  delta?: string;
  series?: readonly number[];
  tone?: "accent" | "warn" | "calm";
};

function seriesFromValue(value: number): number[] {
  const base = Math.max(value, 1);
  return [
    Math.round(base * 0.45),
    Math.round(base * 0.62),
    Math.round(base * 0.58),
    Math.round(base * 0.81),
    Math.round(base * 0.74),
    value,
  ];
}

export function KpiStatGrid({
  items,
  variant = "compact",
}: {
  items: readonly KpiStatItem[];
  variant?: "compact" | "plate";
}) {
  const plate = variant === "plate";

  return (
    <ul
      className={plate ? "kpi-grid kpi-grid--plate" : "kpi-grid"}
      {...(plate ? { "data-count": String(items.length) } : {})}
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        const series = item.series ?? seriesFromValue(item.value);
        const tone = item.tone ?? "accent";

        return (
          <motion.li
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
          >
            <Link
              className={`kpi-card kpi-card--${tone}${plate ? " kpi-card--plate" : ""}`}
              href={item.href}
            >
              <div className="kpi-card__head">
                {Icon ? (
                  <span className="kpi-card__icon" aria-hidden="true">
                    <Icon strokeWidth={1.75} />
                  </span>
                ) : null}
                {item.delta ? (
                  <span className="kpi-card__delta">{item.delta}</span>
                ) : null}
              </div>
              <strong className="kpi-card__value">{item.value}</strong>
              <span className="kpi-card__label">{item.label}</span>
              <SparkLine data={series} height={plate ? 52 : 44} />
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}
