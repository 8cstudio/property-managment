"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

export function RolePickGrid({ children }: { children: ReactNode }) {
  return <ul className="pick-grid pick-grid--portal">{children}</ul>;
}

export function RolePickCard({
  href,
  title,
  description,
  icon: Icon,
  index = 0,
  featured = false,
}: {
  href: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  index?: number;
  featured?: boolean;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        className={`pick pick--portal${featured ? " pick--featured" : ""}`}
        href={href}
      >
        {Icon ? (
          <span className="pick__icon" aria-hidden="true">
            <Icon strokeWidth={1.65} />
          </span>
        ) : null}
        <strong>{title}</strong>
        <span>{description}</span>
        <em className="pick__cta">Open</em>
      </Link>
    </motion.li>
  );
}
