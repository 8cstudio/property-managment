"use client";

import { useState } from "react";
import { AppBar } from "@/shell/app-bar";
import type { RoleFlow } from "./catalog";

export function FlowView({ flow }: { flow: RoleFlow }) {
  const [index, setIndex] = useState(0);
  const step = flow.steps[index];

  if (!step) {
    return null;
  }

  return (
    <>
      <AppBar section={flow.group === "portal" ? "PORTAL" : "CONSOLE"} />
      <main className="page">
        <p className="kicker">
          {flow.role} · step {index + 1} of {flow.steps.length}
        </p>
        <h1>{step.title}</h1>
        <p
          className="place"
          style={{ margin: "0.35rem 0 0.9rem", color: "var(--ink-soft)" }}
        >
          {flow.summary}
        </p>

        <ol className="step-row">
          {flow.steps.map((item, itemIndex) => (
            <li key={item.title}>
              <button
                type="button"
                aria-current={itemIndex === index ? "step" : undefined}
                onClick={() => setIndex(itemIndex)}
              >
                {itemIndex + 1}. {item.title}
              </button>
            </li>
          ))}
        </ol>

        <section className="panel">
          <p className="kicker" style={{ padding: "0.8rem 0.85rem 0" }}>
            {step.screen}
          </p>
          <ul className="field-list">
            {step.shows.map((row) => (
              <li key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
        </section>

        <div className="flow-actions">
          <button
            type="button"
            className="refresh"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
          >
            Back
          </button>
          {index < flow.steps.length - 1 ? (
            <button
              type="button"
              className="refresh"
              onClick={() => setIndex((current) => current + 1)}
            >
              {step.action}
            </button>
          ) : (
            <a className="refresh" href="/">
              Done, back home
            </a>
          )}
          {flow.id === "operations" && index === 0 ? (
            <a className="refresh" href="/console/today">
              Open today's queue
            </a>
          ) : null}
        </div>
      </main>
    </>
  );
}
