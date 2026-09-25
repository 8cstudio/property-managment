"use client";

import { cn } from "@ezzi/ui";

export function RecordTabs({
  tabs,
  active,
  onChange,
  ariaLabel = "Sections",
}: {
  tabs: readonly { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="record-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            className={cn("record-tabs__tab", on && "record-tabs__tab--on")}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
