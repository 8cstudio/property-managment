"use client";

import { Shimmer, Work } from "@ezzi/ui";
import { useMemo, useState } from "react";
import { ThemeSwitcher } from "@/shell/app-bar";
import { usePlatformBrand } from "@/features/platform-brand/brand-provider";
import { useDesk } from "@/features/workspace/store";
import {
  deriveBranches,
  deriveOrganisations,
  deriveQueueFromDesk,
} from "./desk-queue";
import { kindLabel, queueKinds, type QueueKind } from "./queue";

export function Dashboard({ today }: { today: string }) {
  const brand = usePlatformBrand();
  const { state } = useDesk();
  const [org, setOrg] = useState("all");
  const [branch, setBranch] = useState("all");
  const [kind, setKind] = useState<QueueKind | "all">("all");

  const queue = useMemo(
    () => (state ? deriveQueueFromDesk(state) : []),
    [state],
  );
  const organisations = useMemo(
    () => (state ? deriveOrganisations(state) : []),
    [state],
  );
  const branches = useMemo(
    () => (state ? deriveBranches(state) : []),
    [state],
  );

  const rows = useMemo(
    () =>
      queue.filter((item) => {
        if (org !== "all" && item.org !== org) return false;
        if (branch !== "all" && item.branch !== branch) return false;
        if (kind !== "all" && item.kind !== kind) return false;
        return true;
      }),
    [queue, org, branch, kind],
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

  if (!state) {
    return (
      <Work aria-busy="true">
        <Shimmer size="lg" />
      </Work>
    );
  }

  return (
    <>
      <header className="topbar">
        <p className="brand">
          <span className="brand__mark">
            {brand.logoUrl ? (
              <img className="brand__logo" src={brand.logoUrl} alt="" />
            ) : null}
            {brand.name}
          </span>
          <span>STAFF</span>
        </p>
        <nav aria-label="Primary">
          {[
            "Today",
            "Properties",
            "Lettings",
            "Compliance",
            "Maintenance",
            "Finance",
          ].map((item) => (
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
          <ThemeSwitcher />
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <div>
            <p className="kicker">{today}</p>
            <h1>Needs a person today</h1>
          </div>
        </div>

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

        {rows.length === 0 ? (
          <p className="panel empty">
            Nothing in the queue yet. Work, payments, and compliance items you
            add in the desk will appear here.
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
                      <span className={`tag ${item.state}`}>{item.state}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
