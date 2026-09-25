import { FieldList, PageMain } from "@ezzi/ui";
import type { ModuleDoor } from "@/features/flows/catalog";
import { AppBar } from "@/shell/app-bar";

export function ModuleView({ module }: { module: ModuleDoor }) {
  return (
    <>
      <AppBar section="MODULE" />
      <PageMain>
        <p className="kicker">Module</p>
        <h1>{module.name}</h1>
        <p style={{ color: "var(--ink-soft)" }}>{module.summary}</p>
        <FieldList rows={module.rows} />
      </PageMain>
    </>
  );
}
