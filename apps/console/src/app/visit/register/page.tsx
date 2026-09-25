"use client";

import { Button, FieldError, Hint, Notice, PageMain } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isEmail } from "@/features/workspace/auth";
import { useDesk } from "@/features/workspace/store";

export default function RegisterOrganisationPage() {
  const { state, api } = useDesk();
  const t = useTranslations("visit");
  const tf = useTranslations("forms");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState("");
  const [errors, setErrors] = useState<{
    company?: string;
    contact?: string;
    email?: string;
    branch?: string;
  }>({});
  const [sent, setSent] = useState(false);

  return (
    <PageMain>
      <p className="kicker">{t("registerKicker")}</p>
      <h1>{t("registerTitle")}</h1>
      <Hint>{t("registerHint")}</Hint>
      {sent ? (
        <Notice>{t("registerSent")}</Notice>
      ) : (
        <form
          className="form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const next: typeof errors = {};
            const name = company.trim();
            const person = contact.trim();
            const mail = email.trim();
            const office = branch.trim();
            if (!name) next.company = tf("errors.companyRequired");
            else if (
              state.orgs.some(
                (org) => org.name.trim().toLowerCase() === name.toLowerCase(),
              ) ||
              state.requests.some(
                (item) =>
                  item.status === "Requested" &&
                  item.company.trim().toLowerCase() === name.toLowerCase(),
              )
            ) {
              next.company = tf("errors.companyKnown");
            }
            if (!person) next.contact = tf("errors.contactRequired");
            if (!isEmail(mail)) next.email = tf("errors.validEmail");
            if (!office) next.branch = tf("errors.branchRequired");
            setErrors(next);
            if (Object.values(next).some(Boolean)) return;
            api.requestOrg({
              company: name,
              contact: person,
              email: mail,
              branch: office,
            });
            setSent(true);
          }}
        >
          <label>
            {tf("company")}
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              aria-invalid={errors.company ? true : undefined}
              required
            />
          </label>
          {errors.company ? (
            <FieldError>{errors.company}</FieldError>
          ) : null}
          <label>
            {tf("yourName")}
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              aria-invalid={errors.contact ? true : undefined}
              required
            />
          </label>
          {errors.contact ? (
            <FieldError>{errors.contact}</FieldError>
          ) : null}
          <label>
            {tf("email")}
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              required
            />
          </label>
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
          <label>
            {tf("firstOffice")}
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              aria-invalid={errors.branch ? true : undefined}
              required
            />
          </label>
          {errors.branch ? (
            <FieldError>{errors.branch}</FieldError>
          ) : null}
          <Button type="submit">{tf("sendRequest")}</Button>
        </form>
      )}
      <Link className="text-link" href="/visit">
        {t("registerBack")}
      </Link>
    </PageMain>
  );
}
