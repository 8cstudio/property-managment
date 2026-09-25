import { cn } from "../lib/cn";
import { Card } from "./card";

export function FieldList({
  rows,
  className,
}: {
  rows: readonly { label: string; value: string }[];
  className?: string;
}) {
  return (
    <Card as="section" className={cn("field-list-card", "panel--neon", className)}>
      <ul className="field-list field-list--rich">
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
