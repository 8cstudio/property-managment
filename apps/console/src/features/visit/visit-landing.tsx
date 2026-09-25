"use client";

import { Button } from "@ezzi/ui";
import { Building2, KeyRound, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { APP_DISPLAY_NAME } from "@/i18n/brand";

const boardData = [
  {
    tag: "overdue",
    title: "Gas safety ended",
    place: "14 Rye Lane, Flat 2",
  },
  {
    tag: "today",
    title: "Viewing at 4:30",
    place: "41 Larkhall Lane",
  },
  {
    tag: "open",
    title: "£1,250 unmatched",
    place: "Reference NB-4419",
  },
] as const;

export function VisitLanding() {
  const t = useTranslations("visit");

  const board = boardData.map((item) => ({
    ...item,
    label:
      item.tag === "overdue"
        ? t("tagOverdue")
        : item.tag === "today"
          ? t("tagToday")
          : t("tagOpen"),
  }));

  const pillars = [
    {
      title: t("pillarBranchTitle"),
      copy: t("pillarBranchCopy"),
      tone: "a",
    },
    {
      title: t("pillarScopeTitle"),
      copy: t("pillarScopeCopy"),
      tone: "b",
    },
    {
      title: t("pillarHumanTitle"),
      copy: t("pillarHumanCopy"),
      tone: "c",
    },
  ];

  const records = [
    { name: t("recordProperty"), copy: t("recordPropertyCopy") },
    { name: t("recordLettings"), copy: t("recordLettingsCopy") },
    { name: t("recordCompliance"), copy: t("recordComplianceCopy") },
    { name: t("recordRepairs"), copy: t("recordRepairsCopy") },
    { name: t("recordRent"), copy: t("recordRentCopy") },
    { name: t("recordOffices"), copy: t("recordOfficesCopy") },
  ];

  const steps = [
    { title: t("stepYouAskTitle"), copy: t("stepYouAskCopy") },
    { title: t("stepEzziTitle"), copy: t("stepEzziCopy") },
    { title: t("stepYouAddTitle"), copy: t("stepYouAddCopy") },
    { title: t("stepDeskTitle"), copy: t("stepDeskCopy") },
  ];

  return (
    <main className="visit-shell">
      <section className="visit-hero-band" aria-labelledby="visit-hero-title">
        <div className="visit-hero-band__texture" aria-hidden="true" />
        <div className="visit-hero-band__mark" aria-hidden="true">
          E
        </div>
        <div className="visit-hero-band__inner">
          <p className="visit-kicker">{t("kicker")}</p>
          <h1 id="visit-hero-title">
            {t("heroTitle")}
            <span className="visit-highlight">
              <span>{t("heroHighlight")}</span>
            </span>
          </h1>
          <p className="visit-hero-lead">{t("heroLead")}</p>
          <div className="visit-hero-actions">
            <Button variant="primary" asChild>
              <Link className="visit-cta visit-cta--hero" href="/visit/register">
                {t("registerOrg")}
              </Link>
            </Button>
            <Link className="visit-hero-link" href="/">
              {t("alreadyInvited")}
            </Link>
          </div>
        </div>
      </section>

      <section className="visit-overlap-wrap" aria-labelledby="visit-intro-title">
        <div className="visit-overlap">
          <div className="visit-intro">
            <h2 id="visit-intro-title">{APP_DISPLAY_NAME}</h2>
            <p>{t("introBody")}</p>
            <ul className="visit-intro-stats">
              <li>
                <Building2 strokeWidth={1.6} aria-hidden="true" />
                <strong>1</strong>
                <span>{t("statProperty")}</span>
              </li>
              <li>
                <KeyRound strokeWidth={1.6} aria-hidden="true" />
                <strong>6</strong>
                <span>{t("statStatuses")}</span>
              </li>
              <li>
                <Users strokeWidth={1.6} aria-hidden="true" />
                <strong>12</strong>
                <span>{t("statRoles")}</span>
              </li>
              <li>
                <ShieldCheck strokeWidth={1.6} aria-hidden="true" />
                <strong>24/7</strong>
                <span>{t("statAudit")}</span>
              </li>
            </ul>
          </div>

          <aside
            className="visit-float-card"
            aria-label={t("floatAria")}
          >
            <p className="visit-float-card__kicker">{t("floatKicker")}</p>
            <h3>{t("floatTitle")}</h3>
            <div className="visit-float-card__rule" aria-hidden="true" />
            <p className="visit-float-card__lead">{t("floatLead")}</p>
            <ul className="visit-float-card__list">
              {board.map((item) => (
                <li key={item.title}>
                  <span className={`tag ${item.tag}`}>{item.label}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <span className="place">{item.place}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="visit-float-card__note">{t("floatNote")}</p>
          </aside>
        </div>
      </section>

      <section className="visit-pillars" aria-labelledby="visit-pillars-title">
        <h2 id="visit-pillars-title" className="visit-section-title">
          {t("pillarsTitle")}
        </h2>
        <ul className="visit-pillars__grid">
          {pillars.map((item) => (
            <li key={item.title} className="visit-pillar">
              <div
                className={`visit-pillar__media visit-pillar__media--${item.tone}`}
                aria-hidden="true"
              />
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="visit-production"
        aria-labelledby="visit-production-title"
      >
        <div className="visit-production__blueprint" aria-hidden="true" />
        <h2 id="visit-production-title">{t("productionTitle")}</h2>
        <p>{t("productionLead")}</p>
        <ol className="visit-steps">
          {steps.map((item) => (
            <li key={item.title} className="visit-step">
              <strong>{item.title}</strong>
              <p>{item.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="visit-records-block" aria-labelledby="visit-records-title">
        <h2 id="visit-records-title" className="visit-section-title">
          {t("recordsTitle")}
        </h2>
        <ul className="visit-records-grid">
          {records.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="visit-close-band">
        <div>
          <h2>{t("closeTitle")}</h2>
          <p>{t("closeBody")}</p>
        </div>
        <Button variant="primary" asChild>
          <Link className="visit-cta visit-cta--band" href="/visit/register">
            {t("registerOrg")}
          </Link>
        </Button>
      </section>
    </main>
  );
}
