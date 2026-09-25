"use client";

import { Button, usePendingAction } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDesk } from "../store";

export function CreateMigrationProject({ base }: { base: string }) {
  const router = useRouter();
  const { api } = useDesk();
  const { pending, run } = usePendingAction();
  const tf = useTranslations("forms");
  const [agency, setAgency] = useState("");
  const [source, setSource] = useState("Legacy PMS export");

  return (
    <div className="wizard">
      <p className="kicker">{tf("wizard.newMigration")}</p>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            const id = api.createMigrationProject({
              agency: agency.trim(),
              source: source.trim(),
            });
            router.push(`${base}/${id}`);
          });
        }}
      >
        <label>
          {tf("agencyName")}
          <input
            value={agency}
            onChange={(event) => setAgency(event.target.value)}
            required
          />
        </label>
        <label>
          {tf("sourceSystem")}
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            {[
              "Legacy PMS export",
              "Excel workbook",
              "Reapit archive",
              "Custom CSV",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <p className="hint">{tf("wizard.migrationHint")}</p>
        <div className="flow-actions">
          <Button type="button" variant="ghost" asChild>
            <Link href={base.replace(/\/new$/, "")}>{tf("cancel")}</Link>
          </Button>
          <Button
            type="submit"
            loading={pending}
            disabled={!agency.trim() || pending}
            loadingText={tf("loading.creating")}
          >
            {tf("wizard.createProject")}
          </Button>
        </div>
      </form>
    </div>
  );
}
