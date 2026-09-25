"use client";

import {
  AsyncButton,
  Button,
  FieldList,
  PageHeader,
  usePendingAction,
  Work,
} from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

export function PropertyDetailPanel({
  id,
  landlord,
  base,
}: {
  id: string;
  landlord: boolean;
  base: string;
}) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const tpr = useTranslations("panel.property");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.properties.find((row) => row.id === id);
  const [tab, setTab] = useState<string>("overview");
  const [status, setStatus] = useState(item?.status ?? "Occupied");
  const [reason, setReason] = useState("");
  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: tpr("tabs.overview") },
        { id: "units", label: tpr("tabs.units") },
        { id: "tenancy", label: tpr("tabs.tenancy") },
        { id: "compliance", label: tpr("tabs.compliance") },
        { id: "maintenance", label: tpr("tabs.maintenance") },
        { id: "finance", label: tpr("tabs.finance") },
        { id: "documents", label: tpr("tabs.documents") },
        { id: "activity", label: tpr("tabs.activity") },
      ] as const,
    [tpr],
  );

  if (!item) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={tpr("title")} />
        <Link className="refresh" href={base}>
          {tp("back")}
        </Link>
      </Work>
    );
  }

  const certs = state.certificates.filter((row) =>
    row.property.includes(item.address.split(",")[0] ?? item.address),
  );
  const jobs = state.jobs.filter((row) => row.address === item.address);
  const docs = state.documents.filter(
    (row) => row.linkedTo === item.address || row.linkedTo === item.id,
  );
  const payments = state.payments.filter((row) =>
    row.tenancy.includes(item.address.split(",")[0] ?? ""),
  );

  return (
    <Work>
      <PageHeader kicker={item.branch} title={item.address} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <>
          <FieldList
            rows={[
              { label: tc("status"), value: item.status },
              { label: tc("tenancy"), value: item.tenancy },
              { label: tpr("office"), value: item.branch },
            ]}
          />
          {landlord ? null : (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  if (!reason.trim()) return;
                  api.setPropertyStatus(item.id, status, reason.trim());
                });
              }}
            >
              <label>
                {tf("newStatus")}
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
                {tf("reason")}
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
              <Button
                type="submit"
                loading={pending}
                disabled={!reason.trim() || pending}
                loadingText={tf("loading.updating")}
              >
                {tpr("updateStatus")}
              </Button>
            </form>
          )}
        </>
      ) : null}

      {tab === "units" ? (
        <FieldList
          rows={[
            { label: tpr("unit"), value: tpr("unitPrimary") },
            { label: tf("bedrooms"), value: "2" },
            { label: tpr("floor"), value: "1" },
          ]}
        />
      ) : null}

      {tab === "tenancy" ? (
        <>
          <FieldList
            rows={[
              { label: tpr("current"), value: item.tenancy },
              { label: tpr("renewal"), value: tpr("renewalMock") },
            ]}
          />
          {!landlord ? (
            <div className="flow-actions">
              <Link className="refresh" href={`${base}/tenancies`}>
                {tpr("openTenancies")}
              </Link>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "compliance" ? (
        <ul className="field-list">
          {certs.length === 0 ? (
            <li>{tpr("noCerts")}</li>
          ) : (
            certs.map((cert) => (
              <li key={cert.id}>
                <Link
                  className="rowlink"
                  href={`/role/compliance/certificates/${cert.id}`}
                >
                  {cert.type}
                </Link>{" "}
                · {cert.status} · {cert.expiry}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "maintenance" ? (
        <ul className="field-list">
          {jobs.length === 0 ? (
            <li>{tpr("noJobs")}</li>
          ) : (
            jobs.map((job) => (
              <li key={job.id}>
                {job.title} · {job.status}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "finance" ? (
        <FieldList
          rows={payments.map((payment) => ({
            label: payment.reference,
            value: `${payment.amount} · ${payment.status}`,
          }))}
        />
      ) : null}

      {tab === "documents" ? (
        <ul className="field-list">
          {docs.length === 0 ? (
            <li>{tpr("noDocs")}</li>
          ) : (
            docs.map((doc) => (
              <li key={doc.id}>
                {doc.name} · {doc.type} · {doc.uploaded}
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "activity" ? (
        <ul className="field-list">
          {state.audit
            .filter((row) => row.action.includes(item.address.split(",")[0] ?? ""))
            .slice(0, 8)
            .map((row) => (
              <li key={row.id}>
                {row.when} · {row.actor} · {row.action}
              </li>
            ))}
        </ul>
      ) : null}

      {tab === "overview" && !landlord ? (
        <>
          <h2 className="section-label">{tpr("moveOutChecks")}</h2>
          <div className="flow-actions">
            {Object.entries(item.checks).map(([name, done]) => (
              <AsyncButton
                key={name}
                type="button"
                variant={done ? "ghost" : "primary"}
                onClick={() => api.toggleCheck(item.id, name)}
              >
                {name}: {done ? tpr("done") : tpr("open")}
              </AsyncButton>
            ))}
          </div>
        </>
      ) : null}
    </Work>
  );
}
