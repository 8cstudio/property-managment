import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Card } from "./card";

/** Forms, invites, and create actions sit above the table. */
export function DeskToolbar({
  title,
  description,
  className,
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Card className={cn("desk-toolbar", "panel--neon", className)}>
      {title ? <p className="desk-toolbar__title">{title}</p> : null}
      {description ? <p className="desk-toolbar__desc">{description}</p> : null}
      {children ? <div className="desk-toolbar__body">{children}</div> : null}
    </Card>
  );
}

export function DeskStack({ children }: { children: ReactNode }) {
  return <div className="desk-stack">{children}</div>;
}
