"use client";

import { Button, FieldError, Hint, Notice, PageMain } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { aboutPlainText, sanitizeAboutHtml } from "@/features/visit/about-html";
import { CompanyAboutField } from "@/features/visit/company-about-field";
import { isEmail } from "@/features/workspace/auth";
import { flashDeskError } from "@/features/workspace/desk-feedback";
import { submitOrgRequestApi } from "@/features/workspace/org-requests-client";

export default function RegisterOrganisationPage() {
  const t = useTranslations("visit");
  const tf = useTranslations("forms");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [about, setAbout] = useState("");
  const [errors, setErrors] = useState<{
    company?: string;
    contact?: string;
    email?: string;
    phone?: string;
    country?: string;
    address?: string;
    about?: string;
  }>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <PageMain>
      <p className="kicker">{t("registerKicker")}</p>
      <h1>{t("registerTitle")}</h1>
      <Hint>{t("registerHint")}</Hint>
      {sent ? (
        <Notice>{t("registerSent")}</Notice>
      ) : (
        <form
          className="form form--write"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              const next: typeof errors = {};
              const name = company.trim();
              const person = contact.trim();
              const mail = email.trim();
              const number = phone.trim();
              const nation = country.trim();
              const place = address.trim();
              if (!name) next.company = tf("errors.companyRequired");
              if (!person) next.contact = tf("errors.contactRequired");
              if (!isEmail(mail)) next.email = tf("errors.validEmail");
              if (!isPhone(number)) next.phone = tf("errors.phoneRequired");
              if (!nation) next.country = tf("errors.countryRequired");
              if (!place) next.address = tf("errors.addressRequired");
              const description = sanitizeAboutHtml(about);
              if (aboutPlainText(description).length < 20) {
                next.about = tf("errors.aboutRequired");
              }
              setErrors(next);
              if (Object.values(next).some(Boolean)) return;
              setSubmitting(true);
              try {
                await submitOrgRequestApi({
                  company: name,
                  contact: person,
                  email: mail,
                  phone: number,
                  country: nation,
                  branch: place,
                  about: description,
                  memberYears: 0,
                  memberCount: 0,
                  minProperties: 0,
                });
                setSent(true);
              } catch (error) {
                flashDeskError(
                  error instanceof Error ? error.message : "Request failed.",
                );
              } finally {
                setSubmitting(false);
              }
            })();
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
            {tf("contactNumber")}
            <input
              type="tel"
              value={phone}
              autoComplete="tel"
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={errors.phone ? true : undefined}
              required
            />
          </label>
          {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
          <label>
            {tf("country")}
            <input
              value={country}
              autoComplete="country-name"
              onChange={(event) => setCountry(event.target.value)}
              aria-invalid={errors.country ? true : undefined}
              required
            />
          </label>
          {errors.country ? <FieldError>{errors.country}</FieldError> : null}
          <label>
            {tf("address")}
            <input
              value={address}
              autoComplete="street-address"
              onChange={(event) => setAddress(event.target.value)}
              aria-invalid={errors.address ? true : undefined}
              required
            />
          </label>
          {errors.address ? <FieldError>{errors.address}</FieldError> : null}
          <CompanyAboutField
            invalid={Boolean(errors.about)}
            onChange={setAbout}
          />
          {errors.about ? <FieldError>{errors.about}</FieldError> : null}
          <Button type="submit">{tf("sendRequest")}</Button>
        </form>
      )}
      <Link className="text-link" href="/visit">
        {t("registerBack")}
      </Link>
    </PageMain>
  );
}

function isPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
