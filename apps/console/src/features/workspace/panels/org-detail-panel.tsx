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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { localeLabels, locales } from "@/i18n/config";
import { isEmail } from "../auth";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

const tabIds = [
  "overview",
  "profile",
  "offices",
  "users",
  "modules",
  "integrations",
  "properties",
  "settings",
  "activity",
] as const;

export function OrgDetailPanel({
  orgId,
  base,
  integrationsBase,
  usersBase,
  officesBase,
  platformAdmin,
  initialTab = "overview",
}: {
  orgId: string;
  base: string;
  integrationsBase: string;
  usersBase: string;
  officesBase: string;
  /** Super Admin — platform lifecycle (suspend, activate). */
  platformAdmin: boolean;
  initialTab?: string;
}) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const org = state.orgs.find((item) => item.id === orgId);
  const t = useTranslations("org");
  const tCommon = useTranslations("common");
  const [tab, setTab] = useState(initialTab);

  const setTabWithUrl = (next: string) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl && tabIds.includes(fromUrl as (typeof tabIds)[number])) {
      setTab(fromUrl);
    }
  }, [searchParams]);

  const [reason, setReason] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [reminderDays, setReminderDays] = useState("30");
  const [timezone, setTimezone] = useState("Europe/London");
  const [currency, setCurrency] = useState("GBP");
  const [defaultLocale, setDefaultLocale] = useState("en-GB");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Operations");
  const [inviteScope, setInviteScope] = useState("All branches");

  const [newIntegrationName, setNewIntegrationName] = useState("Rightmove");
  const [newIntegrationKind, setNewIntegrationKind] = useState("Listing portal");

  useEffect(() => {
    if (!org) return;
    setDisplayName(org.name);
    setLegalName(org.legalName);
    setCompanyNumber(org.companyNumber);
    setBillingEmail(org.billingEmail);
    setReminderDays(org.settings.reminderDays);
    setTimezone(org.settings.timezone);
    setCurrency(org.settings.defaultCurrency);
    setDefaultLocale(org.settings.defaultLocale);
    setInviteScope(org.offices[0]?.name ?? "All branches");
  }, [org]);

  if (!org) {
    return (
      <Work>
        <PageHeader kicker={tCommon("notFound")} title={t("organisationTitle")} />
        <Link className="refresh" href={base}>
          Back
        </Link>
      </Work>
    );
  }

  const team = state.users.filter((user) => user.orgId === org.id);
  const links = state.integrations.filter((row) => row.orgId === org.id);
  const activity = state.audit.filter((row) => row.org === org.name);
  const properties = state.properties.filter((row) => row.orgId === org.id);
  const canSuspend = reason.trim().length > 0 && !pending;
  const canInvite =
    inviteName.trim().length > 0 && isEmail(inviteEmail.trim()) && !pending;
  const canSaveProfile =
    displayName.trim().length > 0 && !pending;
  const canSaveSettings =
    reminderDays.trim().length > 0 && !pending;

  const visibleTabIds = platformAdmin
    ? tabIds
    : tabIds.filter((id) => id !== "activity" || activity.length > 0);

  const tabs = visibleTabIds.map((id) => ({
    id,
    label: t(`tabs.${id}`),
  }));

  return (
    <Work>
      <PageHeader
        kicker={platformAdmin ? t("kickerPlatform") : t("kickerYours")}
        title={org.name}
      />
      <p className="hint">
        {platformAdmin ? t("hintPlatform") : t("hintYours")}
      </p>
      <RecordTabs tabs={tabs} active={tab} onChange={setTabWithUrl} />

      {tab === "overview" ? (
        <>
          <FieldList
            rows={[
              { label: t("fields.status"), value: org.status },
              { label: t("fields.legalName"), value: org.legalName || "—" },
              { label: t("fields.billingEmail"), value: org.billingEmail || "—" },
              { label: t("fields.offices"), value: String(org.offices.length) },
              {
                label: t("fields.activeUsers"),
                value: String(team.filter((u) => u.status === "Active").length),
              },
              { label: t("fields.properties"), value: String(properties.length) },
              {
                label: t("fields.reasonOnFile"),
                value: org.reason || t("fields.none"),
              },
            ]}
          />
          <div className="flow-actions">
            <Button type="button" variant="primary" onClick={() => setTabWithUrl("profile")}>
              {t("overview.editCompany")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTabWithUrl("settings")}>
              {t("overview.orgSettings")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setTabWithUrl("users")}>
              {t("overview.manageTeam")}
            </Button>
          </div>
          {org.status === "Setup" ? (
            <div className="flow-actions">
              <AsyncButton
                type="button"
                onClick={() =>
                  api.setOrgStatus(org.id, "Active", "Setup completed")
                }
              >
                {t("overview.markActive")}
              </AsyncButton>
            </div>
          ) : null}
          {platformAdmin && org.status !== "Suspended" ? (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  if (!reason.trim()) return;
                  api.setOrgStatus(org.id, "Suspended", reason.trim());
                  setReason("");
                });
              }}
            >
              <label>
                {t("overview.suspendReason")}
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={t("overview.suspendReasonPlaceholder")}
                />
              </label>
              <Button
                type="submit"
                variant="danger"
                loading={pending}
                disabled={!canSuspend}
                loadingText="Suspending…"
              >
                {t("overview.suspendOrg")}
              </Button>
            </form>
          ) : null}
          {platformAdmin && org.status === "Suspended" ? (
            <div className="flow-actions">
              <AsyncButton
                type="button"
                onClick={() => api.setOrgStatus(org.id, "Active", "Reinstated")}
              >
                {t("overview.reinstate")}
              </AsyncButton>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "profile" ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!canSaveProfile) return;
              api.updateOrgProfile(org.id, {
                name: displayName.trim(),
                legalName: legalName.trim(),
                companyNumber: companyNumber.trim(),
                billingEmail: billingEmail.trim(),
              });
            });
          }}
        >
          <label>
            {t("fields.displayName")}
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label>
            {t("fields.legalName")}
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
            />
          </label>
          <label>
            {t("fields.companyNumber")}
            <input
              value={companyNumber}
              onChange={(event) => setCompanyNumber(event.target.value)}
            />
          </label>
          <label>
            {t("fields.billingEmail")}
            <input
              type="email"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
            />
          </label>
          <Button
            type="submit"
            loading={pending}
            disabled={!canSaveProfile}
            loadingText="Saving…"
          >
            {t("fields.saveCompany")}
          </Button>
        </form>
      ) : null}

      {tab === "offices" ? (
        <>
          <div className="flow-actions">
            <Button variant="primary" asChild>
              <Link href={`${officesBase}/branches/new?org=${org.id}`}>
                {t("addOffice")}
              </Link>
            </Button>
          </div>
          <DataTable
            caption={t("officesCaption")}
            searchPlaceholder={t("officesSearch")}
            filters={[
              {
                id: "status",
                label: t("fields.status"),
                options: [
                  { value: "", label: t("allStatuses") },
                  { value: "Active", label: "Active" },
                  { value: "Closed", label: "Closed" },
                ],
              },
            ]}
            columns={[
              t("tabs.offices"),
              "Town",
              "Manager",
              t("fields.status"),
              "",
            ]}
            rows={org.offices.map((office) => ({
              key: office.id,
              searchText: `${office.name} ${office.town} ${office.manager}`,
              filterValues: { status: office.status },
              cells: [
                <Link
                  key="n"
                  className="rowlink"
                  href={`${officesBase}/branches/${office.id}`}
                >
                  {office.name}
                </Link>,
                office.town || "—",
                office.manager || "—",
                office.status,
                <Link
                  key="m"
                  className="refresh"
                  href={`${officesBase}/branches/${office.id}`}
                >
                  {t("manage")}
                </Link>,
              ],
            }))}
          />
        </>
      ) : null}

      {tab === "users" ? (
        <>
          <p className="hint">
            {t.rich("users.hint", {
              org: () => <strong>{org.name}</strong>,
            })}
          </p>
          <div className="flow-actions">
            <Button variant="ghost" asChild>
              <Link href={`${usersBase}/users?org=${encodeURIComponent(org.id)}`}>
                {t("users.openDirectory")}
              </Link>
            </Button>
          </div>
          <DataTable
            caption={t("users.caption")}
            searchPlaceholder={t("users.search")}
            columns={["Name", "Email", "Role", "Scope", "Status", ""]}
            rows={team.map((user) => ({
              key: user.id,
              searchText: `${user.name} ${user.email} ${user.role}`,
              cells: [
                <Link
                  key="n"
                  className="rowlink"
                  href={`${usersBase}/users/${user.id}?org=${encodeURIComponent(org.id)}`}
                >
                  {user.name}
                </Link>,
                user.email,
                user.role,
                user.scope,
                user.status,
                <Link
                  key="m"
                  className="refresh"
                  href={`${usersBase}/users/${user.id}?org=${encodeURIComponent(org.id)}`}
                >
                  {t("users.manageAccess")}
                </Link>,
              ],
            }))}
          />
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!canInvite) return;
                api.inviteUser({
                  name: inviteName.trim(),
                  email: inviteEmail.trim(),
                  role: inviteRole,
                  scope: inviteScope,
                  orgId: org.id,
                });
                setInviteName("");
                setInviteEmail("");
              });
            }}
          >
            <h2 className="section-label">{t("users.inviteTitle")}</h2>
            <label>
              {t("users.inviteName")}
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
              />
            </label>
            <label>
              {t("users.inviteEmail")}
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </label>
            <label>
              {t("users.inviteRole")}
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              >
                {[
                  "Organisation Admin",
                  "Operations",
                  "Lettings",
                  "Compliance",
                  "Finance",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              {t("users.inviteScope")}
              <select
                value={inviteScope}
                onChange={(event) => setInviteScope(event.target.value)}
              >
                <option value="All branches">{t("users.allBranches")}</option>
                {org.offices.map((office) => (
                  <option key={office.id} value={office.name}>
                    {office.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="submit"
              loading={pending}
              disabled={!canInvite}
              loadingText="Sending…"
            >
              {t("users.sendInvite")}
            </Button>
          </form>
        </>
      ) : null}

      {tab === "modules" ? (
        <>
          <p className="hint">
            Module access controls which areas of the product this organisation
            can use. Existing data is kept when a module is turned off.
          </p>
          <div className="flow-actions">
            {Object.entries(org.modules).map(([name, on]) => (
              <AsyncButton
                key={name}
                type="button"
                variant={on ? "primary" : "ghost"}
                onClick={() => api.toggleModule(org.id, name)}
              >
                {name}: {on ? "On" : "Off"}
              </AsyncButton>
            ))}
          </div>
        </>
      ) : null}

      {tab === "integrations" ? (
        <>
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const id = api.addOrgIntegration(org.id, {
                  name: newIntegrationName,
                  kind: newIntegrationKind,
                });
                void id;
              });
            }}
          >
            <label>
              Provider
              <input
                value={newIntegrationName}
                onChange={(event) => setNewIntegrationName(event.target.value)}
              />
            </label>
            <label>
              Kind
              <select
                value={newIntegrationKind}
                onChange={(event) => setNewIntegrationKind(event.target.value)}
              >
                {[
                  "Listing portal",
                  "Transactional email",
                  "Accounting",
                  "Payments",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <Button type="submit" loading={pending} loadingText="Adding…">
              Add connection
            </Button>
          </form>
          {links.length === 0 ? (
            <p className="hint">No connections yet. Add one above.</p>
          ) : (
            <DataTable
              caption={t("connectionsCaption")}
              searchPlaceholder={t("connectionsSearch")}
              columns={[t("tabs.integrations"), "Kind", t("fields.status"), ""]}
              rows={links.map((item) => ({
                key: item.id,
                searchText: `${item.name} ${item.kind} ${item.status}`,
                cells: [
                  <Link
                    key="n"
                    className="rowlink"
                    href={`${integrationsBase}/integrations/${item.id}`}
                  >
                    {item.name}
                  </Link>,
                  item.kind,
                  item.status,
                  <Link
                    key="c"
                    className="refresh"
                    href={`${integrationsBase}/integrations/${item.id}`}
                  >
                    {t("configure")}
                  </Link>,
                ],
              }))}
            />
          )}
        </>
      ) : null}

      {tab === "properties" ? (
        <DataTable
          caption={t("propertiesCaption")}
          searchPlaceholder={t("propertiesSearch")}
          columns={[
            t("fields.properties"),
            t("tabs.offices"),
            t("fields.status"),
            "Tenancy",
          ]}
          rows={properties.map((item) => ({
            key: item.id,
            searchText: `${item.address} ${item.branch} ${item.status}`,
            cells: [item.address, item.branch, item.status, item.tenancy],
          }))}
        />
      ) : null}

      {tab === "settings" ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!canSaveSettings) return;
              api.saveOrgSettings(org.id, {
                reminderDays: reminderDays.trim(),
                timezone,
                defaultCurrency: currency,
                defaultLocale,
              });
            });
          }}
        >
          <label>
            {t("fields.reminderDays")}
            <input
              value={reminderDays}
              onChange={(event) => setReminderDays(event.target.value)}
            />
          </label>
          <label>
            {t("fields.timezone")}
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {["Europe/London", "Europe/Dublin"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            {t("fields.defaultCurrency")}
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {["GBP", "EUR"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            {t("fields.defaultLanguage")}
            <select
              value={defaultLocale}
              onChange={(event) => setDefaultLocale(event.target.value)}
            >
              {locales.map((code) => (
                <option key={code} value={code}>
                  {localeLabels[code]}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="submit"
            loading={pending}
            disabled={!canSaveSettings}
            loadingText="Saving…"
          >
            {t("fields.saveSettings")}
          </Button>
        </form>
      ) : null}

      {tab === "activity" ? (
        <DataTable
          caption={t("auditCaption")}
          searchPlaceholder={t("auditSearch")}
          columns={["When", "Who", "What"]}
          rows={
            activity.length > 0
              ? activity.map((item) => ({
                  key: item.id,
                  searchText: `${item.when} ${item.actor} ${item.action}`,
                  cells: [item.when, item.actor, item.action],
                }))
              : [
                  {
                    key: "empty",
                    cells: ["—", "—", t("noEventsYet")],
                  },
                ]
          }
        />
      ) : null}

      {!platformAdmin ? (
        <p className="hint">
          <Link className="refresh" href={base.replace(/\/organisation$/, "")}>
            {t("backDashboard")}
          </Link>
        </p>
      ) : (
        <p className="hint">
          <Link className="refresh" href={base}>
            {t("backOrgs")}
          </Link>
        </p>
      )}
    </Work>
  );
}
