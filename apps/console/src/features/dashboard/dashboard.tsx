"use client";

import { Card, Shimmer } from "@ezzi/ui";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/shell/app-bar";
import {
  branches,
  kindLabel,
  organisations,
  type QueueKind,
  queue,
  queueKinds,
} from "./queue";

const nav = [
  "Today",
  "Properties",
  "Lettings",
  "Compliance",
  "Maintenance",
  "Finance",
] as const;

function ShimmerRows() {
  return (
    <Card aria-hidden="true">
      {["a", "b", "c", "d", "e", "f"].map((row) => (
        <div className="skeleton-row" key={row}>
          <Shimmer />
          <Shimmer />
          <Shimmer />
          <Shimmer />
        </div>
      ))}
    </Card>
  );
}

export function Dashboard({ today }: { today: string }) {
  const [ready, setReady] = useState(false);
  const [org, setOrg] = useState("all");
  const [branch, setBranch] = useState("all");
  const [kind, setKind] = useState<QueueKind | "all">("all");

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 420);
    return () => window.clearTimeout(timer);
  }, []);

  function reload() {
    setReady(false);
    window.setTimeout(() => setReady(true), 420);
  }

  const rows = useMemo(
    () =>
      queue.filter((item) => {
        if (org !== "all" && item.org !== org) return false;
        if (branch !== "all" && item.branch !== branch) return false;
        if (kind !== "all" && item.kind !== kind) return false;
        return true;
      }),
    [org, branch, kind],
  );

  const counts = queueKinds.map((itemKind) => ({
    kind: itemKind,
    total: queue.filter((item) => {
      if (item.kind !== itemKind) return false;
      if (org !== "all" && item.org !== org) return false;
      if (branch !== "all" && item.branch !== branch) return false;
      return true;
    }).length,
  }));

  return (
    <>
      <header className="topbar">
        <p className="brand">
          EZZI
          <span>STAFF</span>
        </p>
        <nav aria-label="Primary">
          {nav.map((item) => (
            <button
              key={item}
              type="button"
              className="nav-link"
              aria-current={item === "Today" ? "page" : undefined}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <a className="ghost" href="/">
            Home
          </a>
          <ThemeToggle />
          <span className="who">A. Khan</span>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <div>
            <p className="kicker">{today}</p>
            <h1>Needs a person today</h1>
          </div>
          <button type="button" className="refresh" onClick={reload}>
            Reload queue
          </button>
        </div>

        {ready ? (
          <ul className="counts">
            {counts.map((item) => (
              <li key={item.kind}>
                <button
                  type="button"
                  className="count"
                  aria-pressed={kind === item.kind}
                  onClick={() =>
                    setKind(kind === item.kind ? "all" : item.kind)
                  }
                >
                  <strong>{item.total}</strong>
                  <span>{kindLabel(item.kind)}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="counts" aria-hidden="true">
            {queueKinds.map((itemKind) => (
              <li key={itemKind} className="count">
                <div className="shimmer num" />
                <div className="shimmer" />
              </li>
            ))}
          </ul>
        )}

        <div className="filters">
          <label>
            Organisation
            <select
              value={org}
              onChange={(event) => setOrg(event.target.value)}
            >
              <option value="all">All organisations</option>
              {organisations.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Branch
            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
            >
              <option value="all">All branches</option>
              {branches.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {ready ? (
          rows.length === 0 ? (
            <p className="panel empty">
              Nothing in this filter. Clear organisation or branch to see the
              rest of the queue.
            </p>
          ) : (
            <div className="panel">
              <table>
                <thead>
                  <tr>
                    <th>Due</th>
                    <th>What</th>
                    <th>Owner</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td>{item.due}</td>
                      <td>
                        {item.title}
                        <span className="place">
                          {item.place} · {item.branch}
                        </span>
                      </td>
                      <td>{item.owner}</td>
                      <td>
                        <span className={`tag ${item.state}`}>
                          {item.state}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <ShimmerRows />
        )}
      </main>
    </>
  );
}
