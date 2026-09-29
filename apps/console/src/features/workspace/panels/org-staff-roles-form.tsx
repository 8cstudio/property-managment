"use client";

import { AsyncButton, Button, FieldList } from "@ezzi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Org, OrgRoleDefinition } from "../data";
import { useDesk } from "../store";
import {
  assignableRoleLabels,
  BUILTIN_STAFF_ROLE_LABELS,
  normalizeRoleCatalog,
  PORTAL_ACCESS_SLUGS,
  SLUG_TO_DISPLAY,
  type OrgRole,
} from "../staff-roles";

export function OrgStaffRolesForm({ org }: { org: Org }) {
  const { state, api } = useDesk();
  const t = useTranslations("org.staffRoles");
  const [disabled, setDisabled] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<OrgRoleDefinition[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newAccess, setNewAccess] = useState<OrgRole>("operations");
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");

  useEffect(() => {
    setDisabled(org.settings.disabledRoleLabels ?? []);
    setCatalog(org.settings.roleCatalog ?? []);
  }, [org]);

  const team = state.users.filter((user) => user.orgId === org.id);
  const assignable = assignableRoleLabels({
    ...org,
    settings: { ...org.settings, disabledRoleLabels: disabled, roleCatalog: catalog },
  });

  function toggleBuiltIn(label: string) {
    setDisabled((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  }

  function addCustomRole() {
    const label = newLabel.trim();
    if (!label) return;
    if (
      (BUILTIN_STAFF_ROLE_LABELS as readonly string[]).includes(label) ||
      catalog.some((row) => row.label === label)
    ) {
      return;
    }
    setCatalog((current) => [...current, { label, access: newAccess }]);
    setNewLabel("");
  }

  function removeCustom(label: string) {
    if (team.some((user) => user.role === label)) return;
    setCatalog((current) => current.filter((row) => row.label !== label));
  }

  function saveRoles() {
    api.saveOrgStaffRoles(org.id, {
      roleCatalog: normalizeRoleCatalog(catalog),
      disabledRoleLabels: disabled,
    });
  }

  function applyRename() {
    const from = renameFrom.trim();
    const to = renameTo.trim();
    if (!from || !to || from === to) return;
    api.renameOrgStaffRole(org.id, from, to);
    setRenameFrom("");
    setRenameTo("");
  }

  return (
    <section className="panel">
      <h2 className="section-label">{t("title")}</h2>
      <p className="hint">{t("hint")}</p>

      <FieldList
        rows={[
          { label: t("assignableCount"), value: String(assignable.length) },
          { label: t("teamCount"), value: String(team.length) },
        ]}
      />

      <h3 className="section-label">{t("builtInTitle")}</h3>
      <ul className="field-list">
        {BUILTIN_STAFF_ROLE_LABELS.map((label) => {
          const inUse = team.some((user) => user.role === label);
          const isDisabled = disabled.includes(label);
          return (
            <li key={label}>
              <span>{label}</span>
              <span>
                {inUse ? t("inUse") : t("available")}
                {" · "}
                <button
                  type="button"
                  className="refresh"
                  disabled={inUse && !isDisabled}
                  onClick={() => toggleBuiltIn(label)}
                >
                  {isDisabled ? t("enable") : t("disable")}
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      <h3 className="section-label">{t("customTitle")}</h3>
      {catalog.length === 0 ? (
        <p className="hint">{t("customEmpty")}</p>
      ) : (
        <ul className="field-list">
          {catalog.map((row) => (
            <li key={row.label}>
              <span>
                {row.label} → {SLUG_TO_DISPLAY[row.access as OrgRole] ?? row.access}
              </span>
              <AsyncButton
                type="button"
                disabled={team.some((user) => user.role === row.label)}
                onClick={() => removeCustom(row.label)}
              >
                {t("remove")}
              </AsyncButton>
            </li>
          ))}
        </ul>
      )}

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          addCustomRole();
        }}
      >
        <label>
          {t("newLabel")}
          <input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder={t("newLabelPlaceholder")}
          />
        </label>
        <label>
          {t("portalAccess")}
          <select
            value={newAccess}
            onChange={(event) => setNewAccess(event.target.value as OrgRole)}
          >
            {PORTAL_ACCESS_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {SLUG_TO_DISPLAY[slug]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="ghost">
          {t("addCustom")}
        </Button>
      </form>

      <h3 className="section-label">{t("renameTitle")}</h3>
      <form
        className="form form--inline"
        onSubmit={(event) => {
          event.preventDefault();
          applyRename();
        }}
      >
        <label>
          {t("renameFrom")}
          <select
            value={renameFrom}
            onChange={(event) => setRenameFrom(event.target.value)}
          >
            <option value="">{t("pickRole")}</option>
            {[...new Set(team.map((user) => user.role))].map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("renameTo")}
          <input
            value={renameTo}
            onChange={(event) => setRenameTo(event.target.value)}
            placeholder={t("renameToPlaceholder")}
          />
        </label>
        <Button type="submit" variant="ghost">
          {t("renameApply")}
        </Button>
      </form>

      <div className="flow-actions">
        <Button type="button" variant="primary" onClick={saveRoles}>
          {t("save")}
        </Button>
      </div>
    </section>
  );
}
