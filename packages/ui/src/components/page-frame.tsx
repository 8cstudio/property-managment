import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../lib/cn";

export function Work({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"main">) {
  return (
    <main className={cn("work", className)} {...props}>
      {children}
    </main>
  );
}

export function PageHeader({
  kicker,
  title,
}: {
  kicker: string;
  title: string;
}) {
  return (
    <header className="page-title">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
    </header>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <p className="note">{children}</p>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="section-label">{children}</h2>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="hint">{children}</p>;
}

export function PageMain({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"main">) {
  return (
    <main className={cn("page", className)} {...props}>
      {children}
    </main>
  );
}
