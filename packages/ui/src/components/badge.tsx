import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type BadgeTone = "overdue" | "today" | "blocked" | "open" | "neutral";

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("tag", tone !== "neutral" && tone, className)}>
      {children}
    </span>
  );
}
