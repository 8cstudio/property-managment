"use client";

import {
  AsyncButton,
  Button,
  DataTable,
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

const cadenceKeys = [
  { value: "On send", key: "onSend" },
  { value: "Every 15 minutes", key: "every15" },
  { value: "Hourly", key: "hourly" },
  { value: "Daily at 02:00", key: "daily" },
  { value: "Manual", key: "manual" },
] as const;

export function IntegrationDetailPanel({
  id,
  base,
}: {
  id: string;
  base: string;
}) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const ti = useTranslations("panel.integration");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.integrations.find((row) => row.id === id);
  const org = state.orgs.find((row) => row.id === item?.orgId);
  const logs = state.integrationLogs.filter((row) => row.integrationId === id);

  const [tab, setTab] = useState<string>("overview");
  const [endpoint, setEndpoint] = useState(item?.endpoint ?? "");
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState(item?.webhookUrl ?? "");
  const [syncCadence, setSyncCadence] = useState(item?.syncCadence ?? "");
  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: ti("tabs.overview") },
        { id: "configure", label: ti("tabs.configure") },
        { id: "monitor", label: ti("tabs.monitor") },
      ] as const,
    [ti],
  );

  if (!item) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={ti("title")} />
        <Link className="refresh" href={`${base}/integrations`}>
          {tp("backToConnections")}
        </Link>
      </Work>
    );
  }

  const canSave =
    endpoint.trim().length > 0 &&
    syncCadence.trim().length > 0 &&
    !pending;

  return (
    <Work>
      <PageHeader kicker={org?.name ?? ti("organisation")} title={item.name} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <>
          <FieldList
            rows={[
              { label: tc("status"), value: item.status },
              { label: ti("kind"), value: item.kind },
              { label: ti("syncCadence"), value: item.syncCadence },
              { label: ti("lastSync"), value: item.lastSyncAt },
              {
                label: ti("lastError"),
                value: item.lastError || tp("none"),
              },
              {
                label: ti("organisation"),
                value: org?.name ?? item.orgId,
              },
            ]}
          />
          <div className="flow-actions">
            <AsyncButton
              type="button"
              loadingText={tf("loading.testing")}
              onClick={() => api.testIntegration(item.id)}
            >
              {ti("testConnection")}
            </AsyncButton>
            <Button type="button" variant="ghost" onClick={() => setTab("configure")}>
              {ti("editConfig")}
            </Button>
          </div>
        </>
      ) : null}

      {tab === "configure" ? (
        <>
          <p className="hint">{ti("configureHint")}</p>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!canSave) return;
                api.saveIntegrationConfig(item.id, {
                  endpoint,
                  apiKey,
                  webhookUrl,
                  syncCadence,
                });
                setApiKey("");
              });
            }}
          >
            <label>
              {tf("apiEndpoint")}
              <input
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                required
              />
            </label>
            <label>
              {tf("apiKey")}
              <input
                type="password"
                value={apiKey}
                autoComplete="off"
                placeholder={
                  item.apiKeyHint
                    ? tf("apiKeyRotate", { hint: item.apiKeyHint })
                    : tf("enterApiKey")
                }
                onChange={(event) => setApiKey(event.target.value)}
              />
            </label>
            <label>
              {tf("webhookOptional")}
              <input
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://"
              />
            </label>
            <label>
              {tf("syncCadence")}
              <select
                value={syncCadence}
                onChange={(event) => setSyncCadence(event.target.value)}
              >
                {cadenceKeys.map(({ value, key }) => (
                  <option key={value} value={value}>
                    {tf(`syncCadenceOption.${key}`)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flow-actions">
              <Button
                type="submit"
                loading={pending}
                disabled={!canSave}
                loadingText={tf("loading.saving")}
              >
                {ti("saveSettings")}
              </Button>
              <AsyncButton
                type="button"
                variant="danger"
                loadingText={tf("loading.disconnecting")}
                onClick={() => api.disconnectIntegration(item.id)}
              >
                {ti("disconnect")}
              </AsyncButton>
            </div>
          </form>
        </>
      ) : null}

      {tab === "monitor" ? (
        <>
          <FieldList
            rows={[
              { label: ti("health"), value: item.status },
              { label: ti("lastSync"), value: item.lastSyncAt },
              {
                label: ti("recentError"),
                value: item.lastError || ti("noRecentErrors"),
              },
            ]}
          />
          <DataTable
            caption={ti("eventLog")}
            searchPlaceholder={ti("logSearch")}
            columns={[ti("logWhen"), ti("logLevel"), ti("logMessage")]}
            rows={
              logs.length > 0
                ? logs.map((row) => ({
                    key: row.id,
                    searchText: row.message,
                    cells: [row.when, row.level, row.message],
                  }))
                : [
                    {
                      key: "empty",
                      cells: ["—", "info", ti("noEvents")],
                    },
                  ]
            }
          />
          <div className="flow-actions">
            <AsyncButton
              type="button"
              loadingText={tf("loading.testing")}
              onClick={() => api.testIntegration(item.id)}
            >
              {ti("runHealthCheck")}
            </AsyncButton>
          </div>
        </>
      ) : null}

      <p className="hint">
        <Link className="refresh" href={`${base}/integrations`}>
          {tp("backToAllConnections")}
        </Link>
      </p>
    </Work>
  );
}
