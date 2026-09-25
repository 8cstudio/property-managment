"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { isEmail } from "./auth";
import { useDesk } from "./store";

function Page({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  const { state } = useDesk();
  return (
    <main className="work">
      <header className="page-title">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
      </header>
      {state.notice ? <p className="note">{state.notice}</p> : null}
      {children}
    </main>
  );
}

function Figures({
  items,
}: {
  items: readonly { href: string; value: number; label: string }[];
}) {
  return (
    <ul className="counts">
      {items.map((item) => (
        <li key={item.label}>
          <Link className="count" href={item.href}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Table({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly { key: string; cells: ReactNode[] }[];
}) {
  return (
    <div className="panel">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, index) => (
                <td key={`${row.key}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Fields({
  rows,
}: {
  rows: readonly { label: string; value: string }[];
}) {
  return (
    <section className="panel">
      <ul className="field-list">
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RoleBody({
  role,
  screen = "",
  id = "",
}: {
  role: string;
  screen?: string;
  id?: string;
}) {
  const base = `/role/${role}`;
  if (id) return <Detail role={role} screen={screen} id={id} base={base} />;
  if (screen) return <List role={role} screen={screen} base={base} />;
  return <Home role={role} base={base} />;
}

function Home({ role, base }: { role: string; base: string }) {
  const { state } = useDesk();
  if (role === "super-admin") {
    const failed = state.integrations.filter(
      (item) => item.status === "Failed",
    ).length;
    return (
      <Page kicker="Platform" title="Across organisations">
        <Figures
          items={[
            {
              href: `${base}/organisations`,
              value: state.orgs.length,
              label: "Organisations",
            },
            {
              href: `${base}/organisations`,
              value: state.orgs.filter((item) => item.status === "Suspended")
                .length,
              label: "Suspended",
            },
            {
              href: `${base}/integrations`,
              value: failed,
              label: "Failed connections",
            },
            {
              href: `${base}/audit`,
              value: state.audit.length,
              label: "Audit events",
            },
            {
              href: `${base}/requests`,
              value: state.requests.filter(
                (item) => item.status === "Requested",
              ).length,
              label: "Organisation requests",
            },
          ]}
        />
        <h2 className="section-label">Needs a look</h2>
        <Table
          columns={["Organisation", "Issue"]}
          rows={state.integrations
            .filter((item) => item.status === "Failed")
            .map((item) => ({
              key: item.id,
              cells: [
                <Link key="n" className="rowlink" href={`${base}/integrations`}>
                  {state.orgs.find((org) => org.id === item.orgId)?.name}
                </Link>,
                item.name,
              ],
            }))}
        />
        <h2 className="section-label">Failed sign-ins</h2>
        <Table
          columns={["Account", "When"]}
          rows={state.security.map((item) => ({
            key: item.when,
            cells: [item.who, item.when],
          }))}
        />
      </Page>
    );
  }

  if (role === "org-admin") {
    const org =
      state.orgs.find((item) => item.id === "northbridge") ?? state.orgs[0];
    return (
      <Page kicker={org?.name ?? "Organisation"} title="This organisation">
        <Figures
          items={[
            {
              href: `${base}/branches`,
              value: org?.branches.length ?? 0,
              label: "Offices",
            },
            {
              href: `${base}/users`,
              value: state.users.filter((user) => user.orgId === org?.id)
                .length,
              label: "Users",
            },
            {
              href: `${base}/audit`,
              value: state.work.filter((item) => item.state !== "Resolved")
                .length,
              label: "Open work",
            },
          ]}
        />
        <p className="hint">
          Offices: {org?.branches.join(", ") || "None yet"}. The count is how
          many offices this organisation has. The first office is named when the
          organisation is created. You add the rest from Offices.
        </p>
        <p className="hint">
          Certificate reminders go out {state.reminderDays} days before expiry.
        </p>
      </Page>
    );
  }

  if (role === "operations" || role === "property") {
    const rows = role === "property" ? state.properties : state.work;
    return (
      <Page
        kicker="Today"
        title={role === "property" ? "Properties" : "Needs a person"}
      >
        {role === "operations" ? (
          <Table
            columns={["Due", "What", "Owner", "State"]}
            rows={state.work.map((item) => ({
              key: item.id,
              cells: [
                item.state,
                <Link
                  key="t"
                  className="rowlink"
                  href={`${base}/queue/${item.id}`}
                >
                  {item.title}
                  <span className="place">{item.place}</span>
                </Link>,
                item.owner,
                <span
                  key="s"
                  className={`tag ${item.state === "Overdue" ? "overdue" : item.state === "Blocked" ? "blocked" : "open"}`}
                >
                  {item.state}
                </span>,
              ],
            }))}
          />
        ) : (
          <Table
            columns={["Address", "Branch", "Status", "Tenancy"]}
            rows={state.properties.map((item) => ({
              key: item.id,
              cells: [
                <Link
                  key="a"
                  className="rowlink"
                  href={`${base}/properties/${item.id}`}
                >
                  {item.address}
                </Link>,
                item.branch,
                item.status,
                item.tenancy,
              ],
            }))}
          />
        )}
        <p className="place" style={{ color: "var(--ink-soft)" }}>
          {rows.length} records in view.
        </p>
      </Page>
    );
  }

  if (role === "lettings") {
    return (
      <Page kicker="Lettings" title="Available homes">
        <Table
          columns={["Address", "Portal", "Status"]}
          rows={state.listings.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="a"
                className="rowlink"
                href={`${base}/listings/${item.id}`}
              >
                {item.address}
              </Link>,
              item.portal,
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (role === "compliance") {
    return (
      <Page kicker="Compliance" title="Evidence and expiry">
        <Table
          columns={["Property", "Type", "Expiry", "Status"]}
          rows={state.certificates.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="a"
                className="rowlink"
                href={`${base}/certificates/${item.id}`}
              >
                {item.property}
              </Link>,
              item.type,
              item.expiry,
              <span
                key="s"
                className={`tag ${item.status === "Overdue" ? "overdue" : item.status === "Compliant" ? "open" : "today"}`}
              >
                {item.status}
              </span>,
            ],
          }))}
        />
      </Page>
    );
  }

  if (role === "finance") {
    return (
      <Page kicker="Finance" title="Money that needs a decision">
        <Figures
          items={[
            {
              href: `${base}/payments`,
              value: state.payments.filter(
                (item) => item.status === "Unmatched",
              ).length,
              label: "Unmatched",
            },
            {
              href: `${base}/arrears`,
              value: state.arrears.length,
              label: "Arrears cases",
            },
            {
              href: `${base}/statements`,
              value: state.statements.filter((item) => item.status === "Draft")
                .length,
              label: "Draft statements",
            },
          ]}
        />
        <Table
          columns={["Amount", "Reference", "Tenancy", "Status"]}
          rows={state.payments.map((item) => ({
            key: item.id,
            cells: [
              item.amount,
              <Link
                key="r"
                className="rowlink"
                href={`${base}/payments/${item.id}`}
              >
                {item.reference}
              </Link>,
              item.tenancy,
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (role === "migration") {
    return (
      <Page kicker="Migration" title="Agency imports">
        <Table
          columns={["Agency", "Source", "Stage"]}
          rows={state.migrations.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="a"
                className="rowlink"
                href={`${base}/projects/${item.id}`}
              >
                {item.agency}
              </Link>,
              item.source,
              item.stage,
            ],
          }))}
        />
      </Page>
    );
  }

  if (role === "landlord") {
    const mine = state.properties.filter((item) => item.orgId === "harbour");
    return (
      <Page kicker="Your portfolio" title="Harbour Housing">
        <Figures
          items={[
            {
              href: `${base}/approvals`,
              value: state.jobs.filter(
                (item) => item.status === "Waiting approval",
              ).length,
              label: "Need your approval",
            },
            {
              href: `${base}/statements`,
              value: state.statements.length,
              label: "Statements",
            },
          ]}
        />
        <Table
          columns={["Property", "Status", "Tenancy"]}
          rows={mine.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="a"
                className="rowlink"
                href={`${base}/properties/${item.id}`}
              >
                {item.address}
              </Link>,
              item.status,
              item.tenancy,
            ],
          }))}
        />
      </Page>
    );
  }

  if (role === "tenant") {
    const next = state.onboarding.find((item) => item.state !== "Complete");
    return (
      <Page kicker="22 Queen's Road" title="What you need to do">
        <section className="panel">
          <ul className="field-list">
            <li>
              <span>Next step</span>
              <strong>{next ? next.title : "Nothing waiting on you"}</strong>
            </li>
            <li>
              <span>Rent this month</span>
              <strong>£1,150</strong>
            </li>
          </ul>
        </section>
        <div className="flow-actions">
          <Link className="refresh" href={`${base}/onboarding`}>
            Open checklist
          </Link>
          <Link className="refresh" href={`${base}/maintenance`}>
            Report a repair
          </Link>
        </div>
      </Page>
    );
  }

  const mine = state.jobs.filter(
    (item) =>
      item.assignee === "You" ||
      item.status === "Assigned" ||
      item.status === "Scheduled",
  );
  return (
    <Page kicker="Assigned to you" title="Jobs">
      <Table
        columns={["Job", "Address", "Status"]}
        rows={mine.map((item) => ({
          key: item.id,
          cells: [
            <Link key="t" className="rowlink" href={`${base}/jobs/${item.id}`}>
              {item.title}
            </Link>,
            item.address,
            item.status,
          ],
        }))}
      />
    </Page>
  );
}

function List({
  role,
  screen,
  base,
}: {
  role: string;
  screen: string;
  base: string;
}) {
  const { state, api } = useDesk();

  if (screen === "organisations") {
    return (
      <Page kicker="Platform" title="Organisations">
        <Link className="refresh" href={`${base}/organisations/new`}>
          Create organisation
        </Link>
        <p className="hint">
          Offices are the names in the last column. The first office is set when
          the organisation is created. The organisation admin adds more.
        </p>
        <Table
          columns={["Name", "Status", "Offices"]}
          rows={state.orgs.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="n"
                className="rowlink"
                href={`${base}/organisations/${item.id}`}
              >
                {item.name}
              </Link>,
              item.status,
              item.branches.join(", ") || "None",
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "users") {
    return <Users base={base} orgWide={role === "super-admin"} />;
  }

  if (screen === "integrations") {
    return (
      <Page kicker="Connections" title="Integrations">
        <Table
          columns={["Provider", "Status", ""]}
          rows={state.integrations.map((item) => ({
            key: item.id,
            cells: [
              item.name,
              item.status,
              <button
                key="b"
                type="button"
                className="refresh"
                onClick={() => api.testIntegration(item.id)}
              >
                Test connection
              </button>,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "modules") {
    const org = state.orgs[0];
    return (
      <Page kicker={org?.name ?? ""} title="Module access">
        <div className="flow-actions" style={{ flexWrap: "wrap" }}>
          {org
            ? Object.entries(org.modules).map(([name, on]) => (
                <button
                  key={name}
                  type="button"
                  className="refresh"
                  onClick={() => api.toggleModule(org.id, name)}
                >
                  {name}: {on ? "On" : "Off"}
                </button>
              ))
            : null}
        </div>
      </Page>
    );
  }

  if (screen === "audit") {
    return (
      <Page kicker="Recorded changes" title="Audit">
        <Table
          columns={["When", "Who", "What"]}
          rows={state.audit.map((item) => ({
            key: item.id,
            cells: [item.when, item.actor, item.action],
          }))}
        />
      </Page>
    );
  }

  if (screen === "reports") {
    return (
      <Page kicker="Platform" title="Reports">
        <Figures
          items={[
            {
              href: `${base}/organisations`,
              value: state.orgs.length,
              label: "Organisations",
            },
            {
              href: `${base}/audit`,
              value: state.audit.length,
              label: "Changes today",
            },
          ]}
        />
      </Page>
    );
  }

  if (screen === "branches") {
    return <Branches />;
  }

  if (screen === "requests") {
    return (
      <Page kicker="Platform" title="Organisation requests">
        <p className="hint">
          A visitor asks to register. Approving creates the organisation and its
          first office, then invites their email as organisation admin.
        </p>
        <Table
          columns={["Company", "Office", "Contact", "Status"]}
          rows={state.requests.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="c"
                className="rowlink"
                href={`${base}/requests/${item.id}`}
              >
                {item.company}
              </Link>,
              item.branch,
              item.email,
              item.status,
            ],
          }))}
        />
        {state.requests.length === 0 ? (
          <p className="hint">No requests yet.</p>
        ) : null}
      </Page>
    );
  }

  if (screen === "settings") {
    return <Settings />;
  }

  if (screen === "team") {
    const owners = ["Unassigned", "A. Okonkwo", "L. Shah"];
    return (
      <Page kicker="Workload" title="Who is holding work">
        <Table
          columns={["Person", "Open items"]}
          rows={owners.map((owner) => ({
            key: owner,
            cells: [
              owner,
              String(
                state.work.filter(
                  (item) => item.owner === owner && item.state !== "Resolved",
                ).length,
              ),
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "exceptions") {
    const blocked = state.work.filter((item) => item.state === "Blocked");
    return (
      <Page kicker="Blocked" title="Exceptions">
        <Table
          columns={["Item", "Where"]}
          rows={blocked.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="t"
                className="rowlink"
                href={`${base}/queue/${item.id}`}
              >
                {item.title}
              </Link>,
              item.place,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "tenancies") {
    return (
      <Page kicker="Tenancies" title="Current tenancies">
        <Table
          columns={["Address", "Tenancy"]}
          rows={state.properties
            .filter((item) => item.tenancy !== "None")
            .map((item) => ({
              key: item.id,
              cells: [
                <Link
                  key="a"
                  className="rowlink"
                  href={`${base}/properties/${item.id}`}
                >
                  {item.address}
                </Link>,
                item.tenancy,
              ],
            }))}
        />
      </Page>
    );
  }

  if (screen === "applicants") {
    return (
      <Page kicker="Lettings" title="Applicants">
        <Table
          columns={["Name", "Property", "Stage"]}
          rows={state.applicants.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="n"
                className="rowlink"
                href={`${base}/applicants/${item.id}`}
              >
                {item.name}
              </Link>,
              item.property,
              item.stage,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "viewings") {
    return (
      <Page kicker="Lettings" title="Viewings">
        <Table
          columns={["When", "Property", "Outcome"]}
          rows={state.viewings.map((item) => ({
            key: item.id,
            cells: [
              item.when,
              <Link
                key="p"
                className="rowlink"
                href={`${base}/viewings/${item.id}`}
              >
                {item.property}
              </Link>,
              item.outcome,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "certificates") {
    return (
      <Page kicker="Compliance" title="Certificates">
        <Table
          columns={["Property", "Type", "Status"]}
          rows={state.certificates.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="p"
                className="rowlink"
                href={`${base}/certificates/${item.id}`}
              >
                {item.property}
              </Link>,
              item.type,
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "payments") {
    return (
      <Page
        kicker="Finance"
        title={role === "tenant" ? "Your rent" : "Payments"}
      >
        <Table
          columns={["Amount", "Reference", "Status"]}
          rows={(role === "tenant"
            ? state.payments.filter((item) => item.tenancy.includes("Queen"))
            : state.payments
          ).map((item) => ({
            key: item.id,
            cells: [
              item.amount,
              role === "tenant" ? (
                item.reference
              ) : (
                <Link
                  key="r"
                  className="rowlink"
                  href={`${base}/payments/${item.id}`}
                >
                  {item.reference}
                </Link>
              ),
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "arrears") {
    return (
      <Page kicker="Finance" title="Arrears">
        <Table
          columns={["Place", "Short", "Age"]}
          rows={state.arrears.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="p"
                className="rowlink"
                href={`${base}/arrears/${item.id}`}
              >
                {item.place}
              </Link>,
              item.amount,
              item.age,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "statements") {
    return (
      <Page kicker="Finance" title="Statements">
        <Table
          columns={["Who", "Period", "Status"]}
          rows={state.statements.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="l"
                className="rowlink"
                href={`${base}/statements/${item.id}`}
              >
                {item.landlord}
              </Link>,
              item.period,
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "approvals") {
    const waiting = state.jobs.filter((item) => item.quote);
    return (
      <Page kicker="Your decision" title="Approvals">
        <Table
          columns={["Job", "Quote", "Status"]}
          rows={waiting.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="t"
                className="rowlink"
                href={`${base}/jobs/${item.id}`}
              >
                {item.title}
              </Link>,
              item.quote,
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "onboarding") {
    return (
      <Page kicker="Checklist" title="Move-in steps">
        <div className="panel">
          <ul className="field-list">
            {state.onboarding.map((item) => (
              <li key={item.id}>
                <span>
                  {item.title}
                  <span className="place">{item.state}</span>
                </span>
                {item.state === "Complete" ? (
                  <strong>Done</strong>
                ) : (
                  <button
                    type="button"
                    className="refresh"
                    onClick={() => api.submitStep(item.id)}
                  >
                    Submit
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Page>
    );
  }

  if (screen === "tenancy") {
    return (
      <Page kicker="Your tenancy" title="22 Queen's Road">
        <Fields
          rows={[
            { label: "Agreement", value: "Waiting on signature" },
            { label: "Rent", value: "£1,150 monthly" },
            { label: "Other tenants", value: "Not shown" },
          ]}
        />
      </Page>
    );
  }

  if (screen === "maintenance") {
    return <RepairForm />;
  }

  if (screen === "profile") {
    return (
      <Page kicker="Contact" title="Your details">
        <Fields
          rows={[
            {
              label: "Name",
              value: role === "landlord" ? "Harbour portfolio" : "J. Adeyemi",
            },
            { label: "Phone", value: "07700 900123" },
            {
              label: "Change",
              value: "Saved on the shared contact and audited",
            },
          ]}
        />
      </Page>
    );
  }

  return (
    <Page kicker="Missing" title="This page is not in this role">
      <Link className="refresh" href={base}>
        Back to the desk
      </Link>
    </Page>
  );
}

function Detail({
  role,
  screen,
  id,
  base,
}: {
  role: string;
  screen: string;
  id: string;
  base: string;
}) {
  const { state } = useDesk();

  if (screen === "organisations" && id === "new") return <NewOrg />;

  if (screen === "organisations") {
    const org = state.orgs.find((item) => item.id === id);
    if (!org) return <Missing base={base} />;
    return <OrgDetail orgId={org.id} />;
  }

  if (screen === "requests") return <RequestDetail id={id} />;

  if (screen === "queue") {
    const item = state.work.find((row) => row.id === id);
    if (!item) return <Missing base={base} />;
    return <WorkDetail id={item.id} />;
  }

  if (screen === "properties") {
    const item = state.properties.find((row) => row.id === id);
    if (!item) return <Missing base={base} />;
    return <PropertyDetail id={item.id} landlord={role === "landlord"} />;
  }

  if (screen === "listings") return <ListingDetail id={id} />;
  if (screen === "applicants") return <ApplicantDetail id={id} />;
  if (screen === "viewings") return <ViewingDetail id={id} />;
  if (screen === "certificates") return <CertDetail id={id} />;
  if (screen === "payments") return <PaymentDetail id={id} />;
  if (screen === "arrears") return <ArrearsDetail id={id} />;
  if (screen === "statements") return <StatementDetail id={id} />;
  if (screen === "projects") return <MigrationDetail id={id} />;
  if (screen === "jobs")
    return (
      <JobDetail
        id={id}
        landlord={role === "landlord"}
        contractor={role === "contractor"}
      />
    );

  return <Missing base={base} />;
}

function Missing({ base }: { base: string }) {
  return (
    <Page kicker="Not found" title="That record is not here">
      <Link className="refresh" href={base}>
        Back
      </Link>
    </Page>
  );
}

function NewOrg() {
  const { state, api } = useDesk();
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [admin, setAdmin] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    branch?: string;
    admin?: string;
  }>({});
  return (
    <Page kicker="Platform" title="Create organisation">
      <p className="hint">
        The first office is created with the organisation. The organisation
        admin adds further offices later.
      </p>
      <form
        className="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const company = name.trim();
          const office = branch.trim();
          const mail = admin.trim();
          const next: { name?: string; branch?: string; admin?: string } = {};
          if (!company) next.name = "Enter the company name.";
          else if (
            state.orgs.some(
              (org) => org.name.trim().toLowerCase() === company.toLowerCase(),
            )
          ) {
            next.name = "An organisation with this name already exists.";
          }
          if (!office) next.branch = "Enter the first office.";
          if (!isEmail(mail)) next.admin = "Enter a valid email address.";
          setErrors(next);
          if (next.name || next.branch || next.admin) return;
          api.createOrg({ name: company, branch: office, admin: mail });
          setName("");
          setBranch("");
          setAdmin("");
        }}
      >
        <label>
          Company
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            required
          />
        </label>
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
        <label>
          First office
          <input
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            aria-invalid={errors.branch ? true : undefined}
            required
          />
        </label>
        {errors.branch ? <p className="field-error">{errors.branch}</p> : null}
        <label>
          Admin email
          <input
            type="email"
            value={admin}
            autoComplete="email"
            onChange={(event) => setAdmin(event.target.value)}
            aria-invalid={errors.admin ? true : undefined}
            required
          />
        </label>
        {errors.admin ? <p className="field-error">{errors.admin}</p> : null}
        <button type="submit" className="refresh">
          Create
        </button>
      </form>
    </Page>
  );
}

function RequestDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.requests.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker="Request" title={item.company}>
      <Fields
        rows={[
          { label: "Status", value: item.status },
          { label: "Contact", value: item.contact },
          { label: "Email", value: item.email },
          { label: "First office", value: item.branch },
        ]}
      />
      {item.status === "Requested" ? (
        <div className="flow-actions">
          <button
            type="button"
            className="refresh"
            onClick={() => api.decideRequest(item.id, "Approved")}
          >
            Approve and create
          </button>
          <button
            type="button"
            className="refresh"
            onClick={() => api.decideRequest(item.id, "Declined")}
          >
            Decline
          </button>
        </div>
      ) : (
        <p className="hint">This request is already {item.status}.</p>
      )}
    </Page>
  );
}

function OrgDetail({ orgId }: { orgId: string }) {
  const { state, api } = useDesk();
  const org = state.orgs.find((item) => item.id === orgId);
  const [reason, setReason] = useState("");
  if (!org) return null;
  return (
    <Page kicker="Organisation" title={org.name}>
      <Fields
        rows={[
          { label: "Status", value: org.status },
          { label: "Offices", value: String(org.branches.length) },
          { label: "Reason", value: org.reason || "None" },
        ]}
      />
      <h2 className="section-label">Offices</h2>
      <p className="hint">
        {org.branches.length} {org.branches.length === 1 ? "office" : "offices"}
        : {org.branches.join(", ")}. The first office is named when this
        organisation is created. The organisation admin adds further offices.
      </p>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!reason.trim()) return;
          api.setOrgStatus(org.id, "Suspended", reason.trim());
        }}
      >
        <label>
          Reason to suspend
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>
        <button type="submit" className="refresh" disabled={!reason.trim()}>
          Suspend access
        </button>
      </form>
    </Page>
  );
}

function Users({ orgWide }: { base: string; orgWide: boolean }) {
  const { state, api } = useDesk();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Lettings");
  const [scope, setScope] = useState("Peckham");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const roles = orgWide
    ? ["Organisation Admin", "Operations", "Lettings", "Compliance", "Finance"]
    : ["Operations", "Lettings", "Compliance", "Finance"];
  return (
    <Page kicker="Access" title="Users">
      <Table
        columns={["Name", "Email", "Role", "Scope", "Status"]}
        rows={state.users.map((item) => ({
          key: item.id,
          cells: [
            item.name,
            item.email || "—",
            item.role,
            item.scope,
            item.status,
          ],
        }))}
      />
      <form
        className="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const person = name.trim();
          const mail = email.trim();
          const next: { name?: string; email?: string } = {};
          if (!person) next.name = "Enter the person's name.";
          if (!isEmail(mail)) next.email = "Enter a valid email address.";
          else if (
            state.users.some(
              (user) => user.email?.toLowerCase() === mail.toLowerCase(),
            )
          ) {
            next.email = "This email already has an active or invited account.";
          }
          setErrors(next);
          if (next.name || next.email) return;
          api.inviteUser({ name: person, email: mail, role, scope });
          setName("");
          setEmail("");
        }}
      >
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={errors.name ? true : undefined}
            required
          />
        </label>
        {errors.name ? <p className="field-error">{errors.name}</p> : null}
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
          Role
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            {roles.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Branch scope
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            {["Peckham", "Deptford", "Greenwich"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="refresh">
          Send invite
        </button>
      </form>
    </Page>
  );
}

function Branches() {
  const { state, api } = useDesk();
  const org =
    state.orgs.find((item) => item.id === "northbridge") ?? state.orgs[0];
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  if (!org) return null;
  return (
    <Page kicker={org.name} title="Offices">
      <p className="hint">
        {org.branches.length} {org.branches.length === 1 ? "office" : "offices"}{" "}
        on {org.name}. You add offices here. The first office was named when the
        organisation was created.
      </p>
      <Fields
        rows={org.branches.map((branch) => ({
          label: branch,
          value: "In use",
        }))}
      />
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          const office = name.trim();
          if (!office) {
            setError("Enter an office name.");
            return;
          }
          if (
            org.branches.some(
              (branch) => branch.toLowerCase() === office.toLowerCase(),
            )
          ) {
            setError("That office already exists.");
            return;
          }
          setError("");
          api.addBranch(org.id, office);
          setName("");
        }}
      >
        <label>
          New office
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </label>
        {error ? <p className="field-error">{error}</p> : null}
        <button type="submit" className="refresh">
          Add office
        </button>
      </form>
    </Page>
  );
}

function Settings() {
  const { state, api } = useDesk();
  const [days, setDays] = useState(state.reminderDays);
  return (
    <Page kicker="Organisation" title="Settings">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          api.saveSettings(days);
        }}
      >
        <label>
          Certificate reminder, days before expiry
          <input
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </label>
        <button type="submit" className="refresh">
          Save
        </button>
      </form>
    </Page>
  );
}

function WorkDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.work.find((row) => row.id === id);
  const [owner, setOwner] = useState(item?.owner ?? "Unassigned");
  if (!item) return null;
  return (
    <Page kicker={item.kind} title={item.title}>
      <Fields
        rows={[
          { label: "Where", value: item.place },
          { label: "Owner", value: item.owner },
          { label: "State", value: item.state },
          { label: "Detail", value: item.detail },
        ]}
      />
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          api.assignWork(item.id, owner);
        }}
      >
        <label>
          Assign
          <select
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          >
            {["Unassigned", "A. Okonkwo", "L. Shah"].map((person) => (
              <option key={person}>{person}</option>
            ))}
          </select>
        </label>
        <div className="flow-actions">
          <button type="submit" className="refresh">
            Assign
          </button>
          <button
            type="button"
            className="refresh"
            onClick={() => api.resolveWork(item.id)}
          >
            Resolve
          </button>
        </div>
      </form>
    </Page>
  );
}

function PropertyDetail({ id, landlord }: { id: string; landlord: boolean }) {
  const { state, api } = useDesk();
  const item = state.properties.find((row) => row.id === id);
  const [status, setStatus] = useState(item?.status ?? "Occupied");
  const [reason, setReason] = useState("");
  if (!item) return null;
  return (
    <Page kicker={item.branch} title={item.address}>
      <Fields
        rows={[
          { label: "Status", value: item.status },
          { label: "Tenancy", value: item.tenancy },
        ]}
      />
      {landlord ? null : (
        <>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!reason.trim()) return;
              api.setPropertyStatus(item.id, status, reason.trim());
            }}
          >
            <label>
              New status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {[
                  "Onboarding",
                  "Available",
                  "Reserved",
                  "Occupied",
                  "Void",
                  "On hold",
                  "Archived",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <button type="submit" className="refresh" disabled={!reason.trim()}>
              Update status
            </button>
          </form>
          <h2 className="section-label">Move-out checks</h2>
          <div className="flow-actions">
            {Object.entries(item.checks).map(([name, done]) => (
              <button
                key={name}
                type="button"
                className="refresh"
                onClick={() => api.toggleCheck(item.id, name)}
              >
                {name}: {done ? "Done" : "Open"}
              </button>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}

function ListingDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.listings.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker="Listing" title={item.address}>
      <Fields
        rows={[
          { label: "Portal", value: item.portal },
          { label: "Status", value: item.status },
        ]}
      />
      <button
        type="button"
        className="refresh"
        onClick={() => api.publishListing(item.id)}
      >
        Publish
      </button>
    </Page>
  );
}

function ApplicantDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.applicants.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker="Applicant" title={item.name}>
      <Fields
        rows={[
          { label: "Property", value: item.property },
          { label: "Stage", value: item.stage },
          {
            label: "Suggestion",
            value: "Shown as a hint. You make the decision.",
          },
        ]}
      />
      <button
        type="button"
        className="refresh"
        onClick={() => api.acceptApplicant(item.id)}
      >
        Select applicant
      </button>
    </Page>
  );
}

function ViewingDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.viewings.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.when} title={item.property}>
      <Fields
        rows={[
          { label: "Applicant", value: item.applicant },
          { label: "Outcome", value: item.outcome },
        ]}
      />
      <div className="flow-actions">
        <button
          type="button"
          className="refresh"
          onClick={() => api.setViewingOutcome(item.id, "Interested")}
        >
          Interested
        </button>
        <button
          type="button"
          className="refresh"
          onClick={() => api.setViewingOutcome(item.id, "Not proceeding")}
        >
          Not proceeding
        </button>
      </div>
    </Page>
  );
}

function CertDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.certificates.find((row) => row.id === id);
  const [expiry, setExpiry] = useState("18 Sep 2027");
  if (!item) return null;
  return (
    <Page kicker={item.type} title={item.property}>
      <Fields
        rows={[
          { label: "Status", value: item.status },
          { label: "Expiry", value: item.expiry },
          { label: "History", value: item.history.join(" · ") || "None yet" },
        ]}
      />
      <div className="flow-actions">
        <button
          type="button"
          className="refresh"
          onClick={() => api.validateCert(item.id)}
        >
          Mark evidence checked
        </button>
      </div>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          api.renewCert(item.id, expiry);
        }}
      >
        <label>
          New expiry
          <input
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
          />
        </label>
        <button type="submit" className="refresh">
          Save renewal
        </button>
      </form>
    </Page>
  );
}

function PaymentDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.payments.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.reference} title={item.amount}>
      <Fields
        rows={[
          { label: "Tenancy", value: item.tenancy },
          { label: "Status", value: item.status },
        ]}
      />
      <button
        type="button"
        className="refresh"
        onClick={() => api.matchPayment(item.id)}
        disabled={item.status === "Matched"}
      >
        Match to tenancy
      </button>
    </Page>
  );
}

function ArrearsDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.arrears.find((row) => row.id === id);
  const [plan, setPlan] = useState(item?.plan ?? "");
  if (!item) return null;
  return (
    <Page kicker={item.age} title={item.place}>
      <Fields
        rows={[
          { label: "Short", value: item.amount },
          { label: "Plan", value: item.plan || "None" },
        ]}
      />
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          api.savePlan(item.id, plan);
        }}
      >
        <label>
          Payment plan
          <input
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          />
        </label>
        <button type="submit" className="refresh">
          Save plan
        </button>
      </form>
    </Page>
  );
}

function StatementDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.statements.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.period} title={item.landlord}>
      <Fields
        rows={[
          { label: "Status", value: item.status },
          { label: "Landlord sees", value: "Approved lines only" },
        ]}
      />
      <button
        type="button"
        className="refresh"
        onClick={() => api.publishStatement(item.id)}
      >
        Publish
      </button>
    </Page>
  );
}

function MigrationDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const item = state.migrations.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.source} title={item.agency}>
      <Fields
        rows={[
          { label: "Stage", value: item.stage },
          { label: "Note", value: item.note },
        ]}
      />
      <div className="flow-actions">
        <button
          type="button"
          className="refresh"
          onClick={() => api.setMigrationStage(item.id, "Mapped")}
        >
          Save mapping
        </button>
        <button
          type="button"
          className="refresh"
          onClick={() => api.setMigrationStage(item.id, "Dry run")}
        >
          Run dry import
        </button>
        <button
          type="button"
          className="refresh"
          onClick={() => api.setMigrationStage(item.id, "Live")}
        >
          Cut over
        </button>
      </div>
    </Page>
  );
}

function JobDetail({
  id,
  landlord,
  contractor,
}: {
  id: string;
  landlord: boolean;
  contractor: boolean;
}) {
  const { state, api } = useDesk();
  const item = state.jobs.find((row) => row.id === id);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("£180");
  if (!item) return null;
  return (
    <Page kicker={item.address} title={item.title}>
      <Fields
        rows={[
          { label: "Status", value: item.status },
          { label: "Quote", value: item.quote || "None" },
          { label: "Assignee", value: item.assignee },
          { label: "Notes", value: item.notes || "None" },
        ]}
      />
      {landlord ? (
        <div className="flow-actions">
          <button
            type="button"
            className="refresh"
            onClick={() => api.decideJob(item.id, "Approved")}
          >
            Approve
          </button>
          <button
            type="button"
            className="refresh"
            onClick={() => api.decideJob(item.id, "Rejected")}
          >
            Reject
          </button>
        </div>
      ) : null}
      {contractor ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <div className="flow-actions">
            <button
              type="button"
              className="refresh"
              onClick={() => api.acceptJob(item.id)}
            >
              Accept
            </button>
          </div>
          <label>
            Reason if you decline
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="refresh"
            disabled={!reason.trim()}
            onClick={() => api.declineJob(item.id, reason.trim())}
          >
            Decline
          </button>
          <label>
            Completion notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="refresh"
            onClick={() => api.completeJob(item.id, notes)}
          >
            Mark complete
          </button>
          <label>
            Extra quote
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="refresh"
            onClick={() => api.quoteJob(item.id, amount)}
          >
            Send quote
          </button>
        </form>
      ) : null}
    </Page>
  );
}

function RepairForm() {
  const { state, api } = useDesk();
  const [category, setCategory] = useState("Heating");
  const [detail, setDetail] = useState("");
  const mine = state.jobs.filter(
    (item) => item.address.includes("Queen") || item.status === "Submitted",
  );
  return (
    <Page kicker="Repairs" title="Report an issue">
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          api.reportIssue(category, detail);
          setDetail("");
        }}
      >
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {["Heating", "Leak", "Electrics", "Other"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          What happened
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="refresh">
          Submit
        </button>
      </form>
      <h2 className="section-label">Your issues</h2>
      <Table
        columns={["Issue", "Status"]}
        rows={mine.map((item) => ({
          key: item.id,
          cells: [item.title, item.status],
        }))}
      />
    </Page>
  );
}
