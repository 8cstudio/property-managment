"use client";

import { AsyncButton, FieldList, PageHeader, Work } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

export function RequirementDetailPanel({
  id,
  base,
}: {
  id: string;
  base: string;
}) {
  const { state, api } = useDesk();
  const tr = useTranslations("panel.requirement");
  const tp = useTranslations("panel");
  const tc = useTranslations("col");
  const item = state.requirements.find((row) => row.id === id);
  const [tab, setTab] = useState("overview");
  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: tr("tabs.overview") },
        { id: "evidence", label: tr("tabs.evidence") },
        { id: "properties", label: tr("tabs.properties") },
      ] as const,
    [tr],
  );

  if (!item) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={tr("title")} />
        <Link className="refresh" href={base}>
          {tp("back")}
        </Link>
      </Work>
    );
  }

  const linkedCerts = state.certificates.filter(
    (row) => row.type.toLowerCase().includes(item.name.split(" ")[0]?.toLowerCase() ?? ""),
  );

  return (
    <Work>
      <PageHeader kicker={item.status} title={item.name} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <>
          <FieldList
            rows={[
              { label: tc("appliesTo"), value: item.appliesTo },
              { label: tc("frequency"), value: item.frequency },
              { label: tc("owner"), value: item.owner },
              { label: tc("status"), value: item.status },
            ]}
          />
          <div className="flow-actions">
            <AsyncButton
              type="button"
              onClick={() => api.setRequirementStatus(item.id, "Active")}
            >
              {tr("markActive")}
            </AsyncButton>
            <AsyncButton
              type="button"
              variant="ghost"
              onClick={() => api.setRequirementStatus(item.id, "Paused")}
            >
              {tr("pause")}
            </AsyncButton>
          </div>
        </>
      ) : null}

      {tab === "evidence" ? (
        <FieldList
          rows={[
            { label: tr("expectedEvidence"), value: item.evidence },
            {
              label: tr("certsInQueue"),
              value: String(linkedCerts.length),
            },
          ]}
        />
      ) : null}

      {tab === "properties" ? (
        <ul className="field-list">
          {state.properties.slice(0, 5).map((property) => (
            <li key={property.id}>
              <span>{property.address}</span>
              <strong>{property.status}</strong>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="hint">
        <Link className="refresh" href={base}>
          {tp("backToRequirements")}
        </Link>
      </p>
    </Work>
  );
}
