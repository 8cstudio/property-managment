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

export function JobDetailPanel({
  id,
  landlord,
  contractor,
  base,
}: {
  id: string;
  landlord: boolean;
  contractor: boolean;
  base: string;
}) {
  const { state, api } = useDesk();
  const tj = useTranslations("panel.job");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.jobs.find((row) => row.id === id);
  const [tab, setTab] = useState("overview");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("£180");
  const { pending, run } = usePendingAction();
  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: tj("tabs.overview") },
        { id: "quote", label: tj("tabs.quote") },
        { id: "work", label: tj("tabs.work") },
        { id: "activity", label: tj("tabs.activity") },
      ] as const,
    [tj],
  );

  if (!item) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={tj("title")} />
        <Link className="refresh" href={base}>
          {tp("back")}
        </Link>
      </Work>
    );
  }

  return (
    <Work>
      <PageHeader kicker={item.address} title={item.title} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <FieldList
          rows={[
            { label: tc("status"), value: item.status },
            { label: tj("assignee"), value: item.assignee },
            { label: tj("quote"), value: item.quote || tp("none") },
            { label: tj("notes"), value: item.notes || tp("none") },
          ]}
        />
      ) : null}

      {tab === "quote" ? (
        <>
          <FieldList
            rows={[
              { label: tj("currentQuote"), value: item.quote || tj("pending") },
              { label: tj("approval"), value: item.status },
            ]}
          />
          {landlord ? (
            <div className="flow-actions">
              <AsyncButton
                type="button"
                onClick={() => api.decideJob(item.id, "Approved")}
              >
                {tj("approveQuote")}
              </AsyncButton>
              <AsyncButton
                type="button"
                variant="ghost"
                onClick={() => api.decideJob(item.id, "Rejected")}
              >
                {tj("rejectQuote")}
              </AsyncButton>
            </div>
          ) : null}
          {contractor ? (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => api.quoteJob(item.id, amount));
              }}
            >
              <label>
                {tf("quoteAmount")}
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </label>
              <Button type="submit" loading={pending} loadingText={tf("loading.sending")}>
                {tj("submitQuote")}
              </Button>
            </form>
          ) : null}
        </>
      ) : null}

      {tab === "work" ? (
        <>
          {contractor ? (
            <form className="form">
              <div className="flow-actions">
                <AsyncButton type="button" onClick={() => api.acceptJob(item.id)}>
                  {tj("acceptJob")}
                </AsyncButton>
              </div>
              <label>
                {tf("declineReason")}
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                disabled={!reason.trim()}
                onClick={() => api.declineJob(item.id, reason.trim())}
              >
                {tj("declineJob")}
              </Button>
              <label>
                {tf("completionNotes")}
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </label>
              <AsyncButton
                type="button"
                onClick={() => api.completeJob(item.id, notes)}
              >
                {tj("markComplete")}
              </AsyncButton>
            </form>
          ) : (
            <p className="hint">{tj("workHint")}</p>
          )}
        </>
      ) : null}

      {tab === "activity" ? (
        <ul className="field-list">
          <li>
            <span>{tj("reported")}</span>
            <strong>{item.notes || tj("tenantReport")}</strong>
          </li>
          {item.declineReason ? (
            <li>
              <span>{tj("declineReason")}</span>
              <strong>{item.declineReason}</strong>
            </li>
          ) : null}
        </ul>
      ) : null}
    </Work>
  );
}
