"use client";

import {
  AsyncButton,
  Button,
  DataTable,
  FieldList,
  PageHeader,
  Work,
} from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

export function MigrationDetailPanel({
  id,
  base,
}: {
  id: string;
  base: string;
}) {
  const { state, api } = useDesk();
  const tm = useTranslations("panel.migration");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const item = state.migrations.find((row) => row.id === id);
  const [tab, setTab] = useState<string>("overview");
  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: tm("tabs.overview") },
        { id: "import", label: tm("tabs.import") },
        { id: "mapping", label: tm("tabs.mapping") },
        { id: "validation", label: tm("tabs.validation") },
        { id: "dry-run", label: tm("tabs.dryRun") },
        { id: "cutover", label: tm("tabs.cutover") },
      ] as const,
    [tm],
  );

  if (!item) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={tm("title")} />
        <Link className="refresh" href={base}>
          {tp("back")}
        </Link>
      </Work>
    );
  }

  const issues = state.migrationIssues.filter((row) => row.projectId === id);

  return (
    <Work>
      <PageHeader kicker={item.source} title={item.agency} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <FieldList
          rows={[
            { label: tm("stage"), value: item.stage },
            { label: tm("importedRows"), value: String(item.importedRows) },
            { label: tm("note"), value: item.note },
            {
              label: tm("provenance"),
              value: tm("provenanceValue", { batch: item.sourceBatch }),
            },
          ]}
        />
      ) : null}

      {tab === "import" ? (
        <>
          <p className="hint">{tm("importHint")}</p>
          <div className="flow-actions">
            <AsyncButton
              type="button"
              loadingText={tf("loading.importing")}
              onClick={() => api.runMigrationImport(item.id)}
            >
              {tm("importSample")}
            </AsyncButton>
          </div>
          <FieldList
            rows={[
              { label: tm("rowsStaging"), value: String(item.importedRows) },
              { label: tm("lastImport"), value: item.lastImportAt ?? tm("notYet") },
            ]}
          />
        </>
      ) : null}

      {tab === "mapping" ? (
        <>
          <DataTable
            caption={tm("fieldMapping")}
            columns={[tm("sourceField"), tm("ezziField"), tm("rule")]}
            searchable={false}
            rows={state.migrationMappings
              .filter((row) => row.projectId === id)
              .map((row) => ({
                key: row.id,
                cells: [row.sourceField, row.targetField, row.rule],
              }))}
          />
          <AsyncButton
            type="button"
            loadingText={tf("loading.saving")}
            onClick={() => api.setMigrationStage(item.id, "Mapped")}
          >
            {tm("saveMapping")}
          </AsyncButton>
        </>
      ) : null}

      {tab === "validation" ? (
        <>
          <FieldList
            rows={[
              { label: tm("errors"), value: String(item.errorCount) },
              { label: tm("warnings"), value: String(item.warningCount) },
              { label: tm("duplicates"), value: String(item.duplicateCount) },
            ]}
          />
          <DataTable
            caption={tm("issues")}
            columns={[tm("severity"), tm("record"), tm("message")]}
            searchable
            searchPlaceholder={tm("searchIssues")}
            rows={issues.map((row) => ({
              key: row.id,
              cells: [row.severity, row.record, row.message],
              filterValues: { severity: row.severity.toLowerCase() },
            }))}
            filters={[
              {
                id: "severity",
                label: tm("severity"),
                options: [
                  { value: "", label: tm("all") },
                  { value: "error", label: tm("error") },
                  { value: "warning", label: tm("warning") },
                  { value: "duplicate", label: tm("duplicate") },
                ],
              },
            ]}
          />
          <AsyncButton
            type="button"
            loadingText={tf("loading.validating")}
            onClick={() => api.runMigrationValidation(item.id)}
          >
            {tm("rerunValidation")}
          </AsyncButton>
        </>
      ) : null}

      {tab === "dry-run" ? (
        <>
          <FieldList
            rows={[
              {
                label: tm("properties"),
                value: String(item.dryRunCounts?.properties ?? 0),
              },
              {
                label: tm("tenancies"),
                value: String(item.dryRunCounts?.tenancies ?? 0),
              },
              {
                label: tm("contacts"),
                value: String(item.dryRunCounts?.contacts ?? 0),
              },
              {
                label: tm("reconciliation"),
                value: item.reconciliationOk ? tm("totalsMatch") : tm("notRun"),
              },
            ]}
          />
          <AsyncButton
            type="button"
            loadingText={tf("loading.running")}
            onClick={() => api.setMigrationStage(item.id, "Dry run")}
          >
            {tm("runDryImport")}
          </AsyncButton>
        </>
      ) : null}

      {tab === "cutover" ? (
        <>
          <p className="hint">{tm("cutoverHint")}</p>
          <div className="flow-actions">
            <Button type="button" variant="ghost" asChild>
              <Link href={base}>{tp("backToProjects")}</Link>
            </Button>
            <AsyncButton
              type="button"
              variant="danger"
              loadingText={tf("loading.cuttingOver")}
              onClick={() => api.setMigrationStage(item.id, "Live")}
            >
              {tm("approveCutover")}
            </AsyncButton>
          </div>
        </>
      ) : null}
    </Work>
  );
}
