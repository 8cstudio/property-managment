"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DeskState } from "../data";

export function SetupChecklist({
  base,
  org,
  state,
}: {
  base: string;
  org: DeskState["orgs"][number];
  state: DeskState;
}) {
  const t = useTranslations("panel.setup");
  if (org.status !== "Setup") return null;

  const team = state.users.filter((user) => user.orgId === org.id);
  const hasBranch = org.offices.length >= 1;
  const hasActiveUser = team.some((user) => user.status === "Active");
  const hasSettings = Boolean(org.settings?.reminderDays?.trim());
  const hasIntegration = state.integrations.some(
    (row) => row.orgId === org.id && row.status === "Connected",
  );

  const steps = [
    {
      id: "company",
      label: t("companyOffice"),
      done: hasBranch,
      href: `${base}/branches`,
    },
    {
      id: "invite",
      label: t("inviteUser"),
      done: hasActiveUser,
      href: `${base}/users`,
    },
    {
      id: "settings",
      label: t("settings"),
      done: hasSettings,
      href: `${base}/organisation`,
    },
    {
      id: "integration",
      label: t("integration"),
      done: hasIntegration,
      href: `${base}/integrations`,
    },
  ];

  const complete = steps.every((step) => step.done);

  return (
    <section className="setup-checklist panel">
      <p className="setup-checklist__kicker">{t("kicker")}</p>
      <h2 className="setup-checklist__title">
        {complete ? t("complete") : t("incomplete")}
      </h2>
      <ol className="setup-checklist__list">
        {steps.map((step) => (
          <li
            key={step.id}
            className={step.done ? "setup-checklist__item--done" : undefined}
          >
            <span className="setup-checklist__mark" aria-hidden="true">
              {step.done ? "✓" : "○"}
            </span>
            <Link className="setup-checklist__link" href={step.href}>
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
