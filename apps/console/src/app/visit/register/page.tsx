"use client";

import Link from "next/link";
import { useState } from "react";
import { isEmail } from "@/features/workspace/auth";
import { useDesk } from "@/features/workspace/store";

export default function RegisterOrganisationPage() {
  const { state, api } = useDesk();
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
    <main className="page">
      <p className="kicker">Visitor</p>
      <h1>Register organisation</h1>
      <p className="hint">
        This sends a request. Approving it creates the organisation, names the
        first office, and invites you as organisation admin.
      </p>
      {sent ? (
        <p className="note">{state.notice}</p>
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
            if (!name) next.company = "Enter the company name.";
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
              next.company = "This organisation is already known.";
            }
            if (!person) next.contact = "Enter your name.";
            if (!isEmail(mail)) next.email = "Enter a valid email address.";
            if (!office) next.branch = "Enter the first office.";
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
            Company
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              aria-invalid={errors.company ? true : undefined}
              required
            />
          </label>
          {errors.company ? (
            <p className="field-error">{errors.company}</p>
          ) : null}
          <label>
            Your name
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              aria-invalid={errors.contact ? true : undefined}
              required
            />
          </label>
          {errors.contact ? (
            <p className="field-error">{errors.contact}</p>
          ) : null}
          <label>
            Email
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              required
            />
          </label>
          {errors.email ? <p className="field-error">{errors.email}</p> : null}
          <label>
            First office
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              aria-invalid={errors.branch ? true : undefined}
              required
            />
          </label>
          {errors.branch ? (
            <p className="field-error">{errors.branch}</p>
          ) : null}
          <button type="submit" className="refresh">
            Send request
          </button>
        </form>
      )}
      <Link className="text-link" href="/visit">
        Back
      </Link>
    </main>
  );
}
