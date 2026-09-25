"use client";

import type { ReactNode } from "react";
import { Card } from "./card";

export function AuthShell({
  roleLabel,
  title,
  children,
}: {
  roleLabel: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <Card as="section" className="auth-shell__card panel--neon">
        <p className="auth-shell__kicker">{roleLabel}</p>
        <h1 className="auth-shell__title">{title}</h1>
        {children}
      </Card>
    </div>
  );
}
