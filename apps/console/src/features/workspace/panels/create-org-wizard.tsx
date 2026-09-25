"use client";

import { Button, usePendingAction } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { isEmail } from "../auth";
import { useDesk } from "../store";

export function CreateOrgWizard({ base }: { base: string }) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const tf = useTranslations("forms");
  const steps = useMemo(
    () =>
      [
        tf("wizard.orgSteps.company"),
        tf("wizard.orgSteps.firstOffice"),
        tf("wizard.orgSteps.orgAdmin"),
        tf("wizard.orgSteps.modules"),
        tf("wizard.orgSteps.review"),
      ] as const,
    [tf],
  );
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [admin, setAdmin] = useState("");
  const [modules, setModules] = useState<Record<string, boolean>>({
    Properties: true,
    Lettings: true,
    Compliance: true,
    Maintenance: true,
    Finance: true,
    Migration: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(current: number): boolean {
    const next: Record<string, string> = {};
    if (current === 0) {
      const company = name.trim();
      if (!company) next.name = tf("errors.companyRequired");
      else if (
        state.orgs.some(
          (org) => org.name.trim().toLowerCase() === company.toLowerCase(),
        )
      ) {
        next.name = tf("errors.orgExists");
      }
    }
    if (current === 1 && !branch.trim()) {
      next.branch = tf("errors.branchNameRequired");
    }
    if (current === 2 && !isEmail(admin.trim())) {
      next.admin = tf("errors.adminEmailRequired");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return (
    <div className="wizard">
      <p className="kicker">
        {tf("stepOf", { current: step + 1, total: steps.length })}
      </p>
      <ol className="wizard__steps" aria-label={tf("progress")}>
        {steps.map((label, index) => (
          <li
            key={label}
            className={
              index === step
                ? "wizard__step wizard__step--on"
                : index < step
                  ? "wizard__step wizard__step--done"
                  : "wizard__step"
            }
          >
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (validate(0)) setStep(1);
          }}
        >
          <label>
            {tf("companyName")}
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
            />
          </label>
          {errors.name ? <p className="field-error">{errors.name}</p> : null}
          <div className="flow-actions">
            <Button type="button" variant="ghost" asChild>
              <Link href={`${base}/organisations`}>{tf("cancel")}</Link>
            </Button>
            <Button type="submit">{tf("continue")}</Button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (validate(1)) setStep(2);
          }}
        >
          <label>
            {tf("firstOffice")}
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              aria-invalid={errors.branch ? true : undefined}
            />
          </label>
          {errors.branch ? (
            <p className="field-error">{errors.branch}</p>
          ) : null}
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              {tf("back")}
            </Button>
            <Button type="submit">{tf("continue")}</Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (validate(2)) setStep(3);
          }}
        >
          <label>
            {tf("organisationAdminEmail")}
            <input
              type="email"
              value={admin}
              autoComplete="email"
              onChange={(event) => setAdmin(event.target.value)}
              aria-invalid={errors.admin ? true : undefined}
            />
          </label>
          {errors.admin ? <p className="field-error">{errors.admin}</p> : null}
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              {tf("back")}
            </Button>
            <Button type="submit">{tf("continue")}</Button>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <div className="form">
          <p className="hint">{tf("wizard.enableModules")}</p>
          <ul className="wizard__modules">
            {Object.entries(modules).map(([key, on]) => (
              <li key={key}>
                <label>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setModules((current) => ({
                        ...current,
                        [key]: !current[key],
                      }))
                    }
                  />
                  {key}
                </label>
              </li>
            ))}
          </ul>
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              {tf("back")}
            </Button>
            <Button type="button" onClick={() => setStep(4)}>
              {tf("continue")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="form">
          <ul className="wizard__review">
            <li>
              <strong>{tf("wizard.reviewCompany")}</strong> {name}
            </li>
            <li>
              <strong>{tf("wizard.reviewFirstOffice")}</strong> {branch}
            </li>
            <li>
              <strong>{tf("wizard.reviewAdmin")}</strong> {admin}
            </li>
            <li>
              <strong>{tf("wizard.reviewModules")}</strong>{" "}
              {Object.entries(modules)
                .filter(([, on]) => on)
                .map(([key]) => key)
                .join(", ")}
            </li>
          </ul>
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(3)}>
              {tf("back")}
            </Button>
            <Button
              type="button"
              loading={pending}
              loadingText={tf("loading.creating")}
              onClick={() =>
                void run(async () => {
                  api.createOrg({
                    name: name.trim(),
                    branch: branch.trim(),
                    admin: admin.trim(),
                    modules,
                  });
                  setStep(0);
                  setName("");
                  setBranch("");
                  setAdmin("");
                })
              }
            >
              {tf("wizard.createOrg")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
