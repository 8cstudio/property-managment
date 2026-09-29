"use client";

import type { LucideIcon } from "lucide-react";
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
    <li>
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
    </li>
  );
}
