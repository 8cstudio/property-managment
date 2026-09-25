import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Card({
  as: Component = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Component className={cn("panel", className)}>{children}</Component>;
}
