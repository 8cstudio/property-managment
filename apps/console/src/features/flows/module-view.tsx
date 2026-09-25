import type { ModuleDoor } from "@/features/flows/catalog";
import { AppBar } from "@/shell/app-bar";

export function ModuleView({ module }: { module: ModuleDoor }) {
  return (
    <>
      <AppBar section="MODULE" />
      <main className="page">
        <p className="kicker">Module</p>
        <h1>{module.name}</h1>
        <p style={{ color: "var(--ink-soft)" }}>{module.summary}</p>
        <section className="panel">
          <ul className="field-list">
            {module.rows.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
