"use client";

import {
  UnifiedAnalyticsDeck,
  AsyncButton,
  Badge,
  Button,
  DataTable,
  DeskStack,
  DeskToolbar,
  FieldError,
  FieldList,
  Hint,
  PageHeader,
  SectionLabel,
  StatGrid,
  usePendingAction,
  Work,
} from "@ezzi/ui";
import {
  Activity,
  AlertTriangle,
  Building2,
  Users as UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useState } from "react";
import { isEmail } from "./auth";
import {
  CreateListingWizard,
  CreateMigrationProject,
  CreateOrgWizard,
  CreateRentScheduleForm,
  IntegrationDetailPanel,
  JobDetailPanel,
  ListingDetailPanel,
  MigrationDetailPanel,
  OrgDetailPanel,
  PropertyDetailPanel,
  RentSchedulePanel,
  RequirementDetailPanel,
  SetupChecklist,
  TenantOnboardingPanel,
  UserDetailPanel,
  CreateOfficePanel,
  OfficeDetailPanel,
} from "./panels";
import type { DeskState } from "./data";
import { orgOfficeNames } from "./data";
import { managedOrgId } from "./org-scope";
import { type DeskApi, useDesk } from "./store";
import {
  applicantTableFilters,
  certificateTableFilters,
  documentTableFilters,
  integrationTableFilters,
  jobTableFilters,
  listingTableFilters,
  migrationTableFilters,
  paymentTableFilters,
  propertyRowMeta,
  propertyTableFilters,
  requestTableFilters,
  requirementTableFilters,
  scheduleTableFilters,
  statementTableFilters,
  viewingTableFilters,
  workRowMeta,
  workTableFilters,
} from "./table-filters";

function Page({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Work>
      <PageHeader kicker={kicker} title={title} />
      {children}
    </Work>
  );
}

function certBadgeTone(
  status: string,
): "overdue" | "today" | "open" | "neutral" {
  if (status === "Overdue") return "overdue";
  if (status === "Compliant") return "open";
  if (status === "Due soon") return "today";
  return "neutral";
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
  const t = useTranslations("dash");
  const tc = useTranslations("col");
  if (role === "super-admin") {
    const failed = state.integrations.filter(
      (item) => item.status === "Failed",
    ).length;
    return (
      <Page kicker={t("platform")} title={t("acrossOrgs")}>
        <UnifiedAnalyticsDeck
          title={t("platformPulse")}
          caption={t("platformPulseCaption")}
          metrics={[
            {
              key: "orgs",
              href: `${base}/organisations`,
              value: state.orgs.length,
              label: t("mOrganisations"),
              badge: "Live",
            },
            {
              key: "suspended",
              href: `${base}/organisations`,
              value: state.orgs.filter((item) => item.status === "Suspended")
                .length,
              label: t("mSuspended"),
              tone: "warn",
              badge: "Watch",
            },
            {
              key: "failed",
              href: `${base}/integrations`,
              value: failed,
              label: t("mFailedConnections"),
              tone: "warn",
            },
            {
              key: "audit",
              href: `${base}/audit`,
              value: state.audit.length,
              label: t("mAuditEvents"),
              tone: "calm",
            },
            {
              key: "requests",
              href: `${base}/requests`,
              value: state.requests.filter(
                (item) => item.status === "Requested",
              ).length,
              label: t("mOrgRequests"),
              badge: "Inbox",
            },
          ]}
          donuts={[
            {
              title: t("orgStatus"),
              centerValue: String(state.orgs.length),
              centerLabel: t("mOrganisations"),
              segments: [
                {
                  name: "Active",
                  value: state.orgs.filter((item) => item.status === "Active")
                    .length,
                },
                {
                  name: "Suspended",
                  value: state.orgs.filter(
                    (item) => item.status === "Suspended",
                  ).length,
                },
                {
                  name: "Setup",
                  value: state.orgs.filter((item) => item.status === "Setup")
                    .length,
                },
              ].filter((item) => item.value > 0),
            },
            {
              title: t("connectionHealth"),
              centerValue: String(state.integrations.length),
              centerLabel: t("connectionHealth"),
              segments: [
                {
                  name: "Connected",
                  value: state.integrations.filter(
                    (item) => item.status === "Connected",
                  ).length,
                },
                {
                  name: "Failed",
                  value: failed,
                },
                {
                  name: "Other",
                  value: state.integrations.filter(
                    (item) =>
                      item.status !== "Connected" && item.status !== "Failed",
                  ).length,
                },
              ].filter((item) => item.value > 0),
            },
          ]}
          gauges={[
            {
              title: t("activeOrgRate"),
              value: state.orgs.filter((item) => item.status === "Active")
                .length,
              max: Math.max(state.orgs.length, 1),
              label: "Active",
            },
          ]}
          bars={{
            title: t("platformSnapshot"),
            rows: [
              { name: "Orgs", value: state.orgs.length },
              { name: "Audit", value: state.audit.length },
              {
                name: "Requests",
                value: state.requests.filter(
                  (item) => item.status === "Requested",
                ).length,
              },
              { name: "Failed", value: failed },
            ],
          }}
        />
        <div className="flow-actions">
          <Button variant="primary" asChild>
            <Link href={`${base}/organisations`}>{t("manageOrganisations")}</Link>
          </Button>
          <Link className="refresh" href={`${base}/requests`}>
            {t("organisationRequests")}
          </Link>
        </div>
        <SectionLabel>{t("needsALook")}</SectionLabel>
        <DataTable
          columns={[tc("organisation"), tc("issue")]}
          rows={state.integrations
            .filter((item) => item.status === "Failed")
            .map((item) => ({
              key: item.id,
              cells: [
                <Link
                  key="n"
                  className="rowlink"
                  href={`${base}/integrations/${item.id}`}
                >
                  {state.orgs.find((org) => org.id === item.orgId)?.name}
                </Link>,
                item.name,
              ],
            }))}
        />
        <SectionLabel>{t("failedSignins")}</SectionLabel>
        <DataTable
          columns={[tc("account"), tc("when")]}
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
    const orgUsers = state.users.filter((user) => user.orgId === org?.id);
    const openWork = state.work.filter((item) => item.state !== "Resolved");
    return (
      <Page kicker={org?.name ?? "Organisation"} title={t("dashboard")}>
        {org ? <SetupChecklist base={base} org={org} state={state} /> : null}
        <UnifiedAnalyticsDeck
          title={t("orgPulse")}
          caption={t("orgPulseCaption")}
          metrics={[
            {
              key: "offices",
              href: `${base}/branches`,
              value: org?.offices.length ?? 0,
              label: t("mOffices"),
            },
            {
              key: "users",
              href: `${base}/users`,
              value: orgUsers.length,
              label: t("mUsers"),
              badge: "Team",
            },
            {
              key: "invited",
              href: `${base}/users`,
              value: orgUsers.filter((user) => user.status === "Invited")
                .length,
              label: t("mInvited"),
              tone: "calm",
            },
            {
              key: "work",
              href: `${base}/audit`,
              value: openWork.length,
              label: t("mOpenWork"),
              tone: "warn",
            },
          ]}
        />
        <p className="hint">
          {t("officesLine", {
            offices: org ? orgOfficeNames(org).join(", ") : t("noneYet"),
          })}
        </p>
        <p className="hint">
          {t("reminderLine", {
            days: org?.settings.reminderDays ?? state.reminderDays,
          })}
        </p>
        <div className="flow-actions">
          <Button variant="primary" asChild>
            <Link href={`${base}/organisation`}>{t("manageOrganisation")}</Link>
          </Button>
          <Link className="refresh" href={`${base}/users`}>
            {t("manageUsers")}
          </Link>
          <Link className="refresh" href={`${base}/branches`}>
            {t("manageOffices")}
          </Link>
        </div>
      </Page>
    );
  }

  if (role === "operations" || role === "property") {
    const rows = role === "property" ? state.properties : state.work;
    return (
      <Page kicker={t("today")} title={t("dashboard")}>
        {role === "operations" ? (
          <UnifiedAnalyticsDeck
            title={t("queuePulse")}
            caption={t("queuePulseCaption")}
            metrics={[
              {
                key: "overdue",
                href: `${base}/exceptions`,
                value: state.work.filter((item) => item.state === "Overdue")
                  .length,
                label: t("mOverdue"),
                tone: "warn",
                badge: "Act",
              },
              {
                key: "blocked",
                href: `${base}/exceptions`,
                value: state.work.filter((item) => item.state === "Blocked")
                  .length,
                label: t("mBlocked"),
                tone: "warn",
              },
              {
                key: "open",
                href: `${base}`,
                value: state.work.filter((item) => item.state === "Open")
                  .length,
                label: t("mOpen"),
                tone: "calm",
              },
              {
                key: "resolved",
                href: `${base}/team`,
                value: state.work.filter((item) => item.state === "Resolved")
                  .length,
                label: t("mResolved"),
              },
            ]}
          />
        ) : (
          <UnifiedAnalyticsDeck
            title={t("portfolioPulse")}
            caption={t("portfolioPulseCaption")}
            metrics={[
              {
                key: "occupied",
                href: `${base}`,
                value: state.properties.filter(
                  (item) => item.status === "Occupied",
                ).length,
                label: t("mOccupied"),
              },
              {
                key: "available",
                href: `${base}`,
                value: state.properties.filter(
                  (item) => item.status === "Available",
                ).length,
                label: t("mAvailable"),
                tone: "calm",
              },
              {
                key: "void",
                href: `${base}`,
                value: state.properties.filter((item) => item.status === "Void")
                  .length,
                label: t("mVoid"),
                tone: "warn",
              },
              {
                key: "onboarding",
                href: `${base}`,
                value: state.properties.filter(
                  (item) => item.status === "Onboarding",
                ).length,
                label: t("mOnboarding"),
              },
            ]}
          />
        )}
        {role === "operations" ? (
          <DataTable
            caption={t("queue")}
            searchPlaceholder="Search work, owner, place…"
            filters={workTableFilters(state.work)}
            columns={[tc("due"), tc("what"), tc("owner"), tc("state")]}
            rows={state.work.map((item) => ({
              key: item.id,
              ...workRowMeta(item),
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
                <Badge
                  key="s"
                  tone={
                    item.state === "Overdue"
                      ? "overdue"
                      : item.state === "Blocked"
                        ? "blocked"
                        : "open"
                  }
                >
                  {item.state}
                </Badge>,
              ],
            }))}
          />
        ) : (
          <DataTable
            caption={t("properties")}
            searchPlaceholder="Search address, branch, tenancy…"
            filters={propertyTableFilters(state.properties)}
            columns={[tc("address"), tc("branch"), tc("status"), tc("tenancy")]}
            rows={state.properties.map((item) => ({
              key: item.id,
              ...propertyRowMeta(item),
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
          {t("recordsInView", { count: rows.length })}
        </p>
      </Page>
    );
  }

  if (role === "lettings") {
    return (
      <Page kicker={t("lettings")} title={t("dashboard")}>
        <UnifiedAnalyticsDeck
          title={t("lettingsPulse")}
          caption={t("lettingsPulseCaption")}
          metrics={[
            {
              key: "listings",
              href: `${base}`,
              value: state.listings.length,
              label: t("mListings"),
            },
            {
              key: "published",
              href: `${base}`,
              value: state.listings.filter((item) => item.status === "Published")
                .length,
              label: t("mPublished"),
              tone: "calm",
            },
            {
              key: "applicants",
              href: `${base}/applicants`,
              value: state.applicants.length,
              label: t("mApplicants"),
            },
            {
              key: "viewings",
              href: `${base}/viewings`,
              value: state.viewings.length,
              label: t("mViewings"),
              badge: "Live",
            },
          ]}
        />
        <DeskStack>
          <DeskToolbar
            title={t("newListing")}
            description={t("newListingDesc")}
          >
            <Button variant="primary" asChild>
              <Link href={`${base}/listings/new`}>{t("createListing")}</Link>
            </Button>
          </DeskToolbar>
        <DataTable
          caption={t("availableHomes")}
          searchPlaceholder="Search address, portal, status…"
          filters={listingTableFilters(state.listings)}
          columns={[tc("address"), tc("portal"), tc("status")]}
          rows={state.listings.map((item) => ({
            key: item.id,
            searchText: `${item.address} ${item.portal} ${item.status}`,
            filterValues: { portal: item.portal, status: item.status },
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
        </DeskStack>
      </Page>
    );
  }

  if (role === "compliance") {
    const compliant = state.certificates.filter(
      (item) => item.status === "Compliant",
    ).length;
    const overdue = state.certificates.filter(
      (item) => item.status === "Overdue",
    ).length;
    const dueSoon = state.certificates.filter(
      (item) => item.status === "Due soon",
    ).length;
    return (
      <Page kicker={t("compliance")} title={t("evidenceExpiry")}>
        <UnifiedAnalyticsDeck
          title={t("complianceRiver")}
          caption={t("complianceRiverCaption")}
          metrics={[
            {
              key: "compliant",
              href: `${base}/certificates`,
              value: compliant,
              label: t("mCompliant"),
              badge: "OK",
            },
            {
              key: "soon",
              href: `${base}/certificates`,
              value: dueSoon,
              label: t("mDueSoon"),
              tone: "calm",
            },
            {
              key: "overdue",
              href: `${base}/certificates`,
              value: overdue,
              label: t("mOverdueCert"),
              tone: "warn",
              badge: "Act",
            },
          ]}
        />
        <DataTable
          caption={t("certificateQueue")}
          searchPlaceholder="Search property, type, status…"
          filters={certificateTableFilters(state.certificates)}
          columns={[tc("property"), tc("type"), tc("expiry"), tc("status")]}
          rows={state.certificates.map((item) => ({
            key: item.id,
            searchText: `${item.property} ${item.type} ${item.status} ${item.expiry}`,
            filterValues: { status: item.status, type: item.type },
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
              <Badge key="s" tone={certBadgeTone(item.status)}>
                {item.status}
              </Badge>,
            ],
          }))}
        />
      </Page>
    );
  }

  if (role === "finance") {
    const matched = state.payments.filter(
      (item) => item.status === "Matched",
    ).length;
    const unmatched = state.payments.filter(
      (item) => item.status === "Unmatched",
    ).length;
    return (
      <Page kicker={t("finance")} title={t("moneyDecision")}>
        <UnifiedAnalyticsDeck
          title={t("cashDeskRiver")}
          caption={t("cashDeskRiverCaption")}
          metrics={[
            {
              key: "unmatched",
              href: `${base}/payments`,
              value: unmatched,
              label: t("mUnmatched"),
              tone: "warn",
              badge: "Match",
            },
            {
              key: "matched",
              href: `${base}/payments`,
              value: matched,
              label: t("mMatched"),
              tone: "accent",
            },
            {
              key: "arrears",
              href: `${base}/arrears`,
              value: state.arrears.length,
              label: t("mArrears"),
              tone: "warn",
            },
            {
              key: "drafts",
              href: `${base}/statements`,
              value: state.statements.filter((item) => item.status === "Draft")
                .length,
              label: t("mDraftStatements"),
              tone: "calm",
            },
          ]}
        />
        <DataTable
          caption={t("paymentsDesk")}
          searchPlaceholder="Search amount, reference, tenancy…"
          filters={paymentTableFilters(state.payments)}
          columns={[tc("amount"), tc("reference"), tc("tenancy"), tc("status")]}
          rows={state.payments.map((item) => ({
            key: item.id,
            searchText: `${item.amount} ${item.reference} ${item.tenancy} ${item.status}`,
            filterValues: { status: item.status },
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
      <Page kicker={t("migration")} title={t("dashboard")}>
        <UnifiedAnalyticsDeck
          title={t("importPulse")}
          caption={t("importPulseCaption")}
          metrics={[
            {
              key: "mapped",
              href: `${base}`,
              value: state.migrations.filter((item) => item.stage === "Mapped")
                .length,
              label: t("mMapped"),
            },
            {
              key: "dry",
              href: `${base}`,
              value: state.migrations.filter(
                (item) => item.stage === "Dry run",
              ).length,
              label: t("mDryRun"),
              tone: "calm",
            },
            {
              key: "live",
              href: `${base}`,
              value: state.migrations.filter((item) => item.stage === "Live")
                .length,
              label: t("mLive"),
              badge: "Cutover",
            },
            {
              key: "total",
              href: `${base}`,
              value: state.migrations.length,
              label: t("mProjects"),
            },
          ]}
        />
        <DeskStack>
          <DeskToolbar title={t("newProject")} description={t("newProjectDesc")}>
            <Button variant="primary" asChild>
              <Link href={`${base}/projects/new`}>{t("newMigrationProject")}</Link>
            </Button>
          </DeskToolbar>
        <DataTable
          caption={t("agencyImports")}
          searchPlaceholder="Search agency, source, stage…"
          filters={migrationTableFilters(state.migrations)}
          columns={[tc("agency"), tc("source"), tc("stage")]}
          rows={state.migrations.map((item) => ({
            key: item.id,
            searchText: `${item.agency} ${item.source} ${item.stage}`,
            filterValues: { stage: item.stage, source: item.source },
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
        </DeskStack>
      </Page>
    );
  }

  if (role === "landlord") {
    const mine = state.properties.filter((item) => item.orgId === "harbour");
    return (
      <Page kicker={t("yourPortfolio")} title={t("dashboard")}>
        <UnifiedAnalyticsDeck
          title={t("portfolioPulse")}
          caption={t("portfolioPulseCaption")}
          metrics={[
            {
              key: "homes",
              href: `${base}`,
              value: mine.length,
              label: t("properties"),
            },
            {
              key: "approvals",
              href: `${base}/approvals`,
              value: state.jobs.filter(
                (item) => item.status === "Waiting approval",
              ).length,
              label: t("mNeedApproval"),
              tone: "warn",
              badge: "Act",
            },
            {
              key: "statements",
              href: `${base}/statements`,
              value: state.statements.length,
              label: t("mStatements"),
              tone: "calm",
            },
          ]}
        />
        <DataTable
          caption={t("yourProperties")}
          searchPlaceholder="Search address, tenancy…"
          filters={propertyTableFilters(mine)}
          columns={[tc("property"), tc("status"), tc("tenancy")]}
          rows={mine.map((item) => ({
            key: item.id,
            ...propertyRowMeta(item),
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
    const openSteps = state.onboarding.filter(
      (item) => item.state !== "Complete",
    ).length;
    const myJobs = state.jobs.filter(
      (item) => item.address.includes("Queen") || item.status === "Submitted",
    );
    return (
      <Page kicker="22 Queen's Road" title={t("dashboard")}>
        <UnifiedAnalyticsDeck
          title={t("tenancyPulse")}
          caption={t("tenancyPulseCaption")}
          metrics={[
            {
              key: "steps",
              href: `${base}/onboarding`,
              value: openSteps,
              label: t("mOpenSteps"),
              ...(openSteps > 0 ? { tone: "warn" as const } : {}),
            },
            {
              key: "repairs",
              href: `${base}/maintenance`,
              value: myJobs.length,
              label: t("mRepairItems"),
              tone: "calm",
            },
          ]}
        />
        <section className="panel">
          <ul className="field-list">
            <li>
              <span>{t("nextStep")}</span>
              <strong>{next ? next.title : t("nothingWaiting")}</strong>
            </li>
            <li>
              <span>{t("rentThisMonth")}</span>
              <strong>£1,150</strong>
            </li>
          </ul>
        </section>
        <div className="flow-actions">
          <Link className="refresh" href={`${base}/onboarding`}>
            {t("openChecklist")}
          </Link>
          <Link className="refresh" href={`${base}/maintenance`}>
            {t("reportRepair")}
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
    <Page kicker={t("assignedToYou")} title={t("dashboard")}>
      <UnifiedAnalyticsDeck
        title={t("jobsPulse")}
        caption={t("jobsPulseCaption")}
        metrics={[
          {
            key: "scheduled",
            href: `${base}`,
            value: mine.filter((item) => item.status === "Scheduled").length,
            label: t("mScheduled"),
            tone: "calm",
          },
          {
            key: "assigned",
            href: `${base}`,
            value: mine.filter((item) => item.status === "Assigned").length,
            label: t("mAssigned"),
          },
          {
            key: "active",
            href: `${base}`,
            value: mine.length,
            label: t("mInView"),
            badge: "Live",
          },
        ]}
      />
      <DataTable
        caption={t("yourJobs")}
        searchPlaceholder="Search job, address, status…"
        filters={jobTableFilters(mine)}
        columns={[tc("job"), tc("address"), tc("status")]}
        rows={mine.map((item) => ({
          key: item.id,
          searchText: `${item.title} ${item.address} ${item.status}`,
          filterValues: { status: item.status },
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
  const t = useTranslations("list");
  const tc = useTranslations("col");

  if (screen === "organisations") {
    return (
      <Page kicker={t("organisations")} title={t("organisations")}>
        <DeskStack>
          <DeskToolbar
            title={t("tenantOrgs")}
            description={t("tenantOrgsDesc")}
          >
            <Button variant="primary" asChild>
              <Link href={`${base}/organisations/new`}>
                {t("createOrganisation")}
              </Link>
            </Button>
          </DeskToolbar>
          <DataTable
            caption={t("allOrganisations")}
            searchable
            searchPlaceholder={t("orgNameOrOffice")}
            filters={[
              {
                id: "status",
                label: tc("status"),
                options: [
                  { value: "", label: t("allStatuses") },
                  { value: "Active", label: "Active" },
                  { value: "Setup", label: "Setup" },
                  { value: "Suspended", label: "Suspended" },
                ],
              },
            ]}
            columns={[tc("name"), tc("status"), tc("offices"), ""]}
            rows={state.orgs.map((item) => ({
              key: item.id,
              searchText: `${item.name} ${item.status} ${orgOfficeNames(item).join(" ")}`,
              filterValues: { status: item.status },
              cells: [
                <Link
                  key="n"
                  className="rowlink"
                  href={`${base}/organisations/${item.id}`}
                >
                  {item.name}
                </Link>,
                item.status,
                orgOfficeNames(item).join(", ") || t("none"),
                <Link
                  key="m"
                  className="refresh"
                  href={`${base}/organisations/${item.id}`}
                >
                  {t("manage")}
                </Link>,
              ],
            }))}
          />
        </DeskStack>
      </Page>
    );
  }

  if (screen === "users") {
    return <Users base={base} orgWide={role === "super-admin"} />;
  }

  if (screen === "integrations") {
    const orgScope =
      role === "org-admin"
        ? state.orgs.find((o) => o.id === "northbridge")?.id
        : null;
    const rows = state.integrations.filter((item) =>
      orgScope ? item.orgId === orgScope : true,
    );
    return (
      <Page kicker={t("connections")} title={t("integrations")}>
        <p className="hint">{t("integrationsHint")}</p>
        <DataTable
          caption={t("allConnections")}
          searchPlaceholder={t("connectionsSearch")}
          filters={integrationTableFilters(rows)}
          columns={[tc("provider"), tc("organisation"), tc("status"), tc("lastSync"), ""]}
          rows={rows.map((item) => {
            const org = state.orgs.find((row) => row.id === item.orgId);
            return {
              key: item.id,
              searchText: `${item.name} ${item.status} ${org?.name ?? ""}`,
              filterValues: { status: item.status },
              cells: [
                <Link
                  key="n"
                  className="rowlink"
                  href={`${base}/integrations/${item.id}`}
                >
                  {item.name}
                </Link>,
                org?.name ?? item.orgId,
                item.status,
                item.lastSyncAt,
                <Link key="c" className="refresh" href={`${base}/integrations/${item.id}`}>
                  {t("open")}
                </Link>,
              ],
            };
          })}
        />
      </Page>
    );
  }

  if (screen === "modules") {
    return (
      <Page kicker={t("organisations")} title={t("moduleAccess")}>
        <p className="hint">{t("moduleHint")}</p>
        <DataTable
          caption={t("organisations")}
          searchPlaceholder={t("orgSearch")}
          columns={[tc("organisation"), tc("status"), ""]}
          rows={state.orgs.map((item) => ({
            key: item.id,
            searchText: item.name,
            cells: [
              item.name,
              item.status,
              <Link
                key="m"
                className="refresh"
                href={`${base}/organisations/${item.id}`}
              >
                {t("manageModules")}
              </Link>,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "organisation" && role === "org-admin") {
    return (
      <OrgDetailPanel
        orgId={managedOrgId(state)}
        base={`${base}/organisation`}
        integrationsBase={base}
        usersBase={base}
        officesBase={base}
        platformAdmin={false}
      />
    );
  }

  if (screen === "settings" && role === "org-admin") {
    return (
      <OrgDetailPanel
        orgId={managedOrgId(state)}
        base={`${base}/organisation`}
        integrationsBase={base}
        usersBase={base}
        officesBase={base}
        platformAdmin={false}
        initialTab="settings"
      />
    );
  }

  if (screen === "audit") {
    return (
      <Page kicker={t("recordedChanges")} title={t("audit")}>
        <DataTable
          caption={t("auditLog")}
          searchPlaceholder={t("auditSearch")}
          columns={[tc("when"), tc("who"), tc("what")]}
          rows={state.audit.map((item) => ({
            key: item.id,
            searchText: `${item.when} ${item.actor} ${item.action} ${item.org}`,
            cells: [item.when, item.actor, item.action],
          }))}
        />
      </Page>
    );
  }

  if (screen === "reports") {
    return (
      <Page kicker={t("organisations")} title={t("reports")}>
        <StatGrid
          items={[
            {
              href: `${base}/organisations`,
              value: state.orgs.length,
              label: t("organisations"),
            },
            {
              href: `${base}/audit`,
              value: state.audit.length,
              label: t("changesToday"),
            },
          ]}
        />
      </Page>
    );
  }

  if (screen === "branches") {
    return <Branches base={base} />;
  }

  if (screen === "requests") {
    return (
      <Page kicker={t("organisations")} title={t("orgRequests")}>
        <DeskStack>
          <DeskToolbar
            title={t("visitorRequests")}
            description={t("visitorRequestsDesc")}
          />
          <DataTable
            caption={t("requestsCaption")}
            emptyMessage={t("requestsEmpty")}
            searchPlaceholder={t("requestsSearch")}
            filters={requestTableFilters(state.requests)}
            columns={[tc("company"), tc("office"), tc("contact"), tc("status")]}
            rows={state.requests.map((item) => ({
              key: item.id,
              searchText: `${item.company} ${item.branch} ${item.email} ${item.contact} ${item.status}`,
              filterValues: { status: item.status },
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
        </DeskStack>
      </Page>
    );
  }

  if (screen === "settings") {
    return <Settings />;
  }

  if (screen === "team") {
    const owners = ["Unassigned", "A. Okonkwo", "L. Shah"];
    return (
      <Page kicker={t("workload")} title={t("whoHolding")}>
        <DataTable
          searchPlaceholder={t("personSearch")}
          columns={[tc("person"), tc("openItems")]}
          rows={owners.map((owner) => ({
            key: owner,
            searchText: owner,
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
      <Page kicker={t("blocked")} title={t("exceptions")}>
        <DataTable
          searchPlaceholder={t("blockedSearch")}
          filters={workTableFilters(blocked)}
          columns={[tc("item"), tc("where")]}
          rows={blocked.map((item) => ({
            key: item.id,
            ...workRowMeta(item),
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
      <Page kicker={t("tenancies")} title={t("currentTenancies")}>
        <DataTable
          searchPlaceholder={t("tenanciesSearch")}
          filters={propertyTableFilters(state.properties)}
          columns={[tc("address"), tc("tenancy")]}
          rows={state.properties
            .filter((item) => item.tenancy !== "None")
            .map((item) => ({
              key: item.id,
              ...propertyRowMeta(item),
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
      <Page kicker={t("lettings")} title={t("applicants")}>
        <DataTable
          searchPlaceholder={t("applicantsSearch")}
          filters={applicantTableFilters(state.applicants)}
          columns={[tc("name"), tc("property"), tc("stage")]}
          rows={state.applicants.map((item) => ({
            key: item.id,
            searchText: `${item.name} ${item.property} ${item.stage}`,
            filterValues: { stage: item.stage },
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
      <Page kicker={t("lettings")} title={t("viewings")}>
        <DataTable
          searchPlaceholder={t("viewingsSearch")}
          filters={viewingTableFilters(state.viewings)}
          columns={[tc("when"), tc("property"), tc("outcome")]}
          rows={state.viewings.map((item) => ({
            key: item.id,
            searchText: `${item.when} ${item.property} ${item.applicant} ${item.outcome}`,
            filterValues: { outcome: item.outcome },
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
      <Page kicker={t("compliance")} title={t("certificates")}>
        <DataTable
          searchPlaceholder={t("certificatesSearch")}
          filters={certificateTableFilters(state.certificates)}
          columns={[tc("property"), tc("type"), tc("status")]}
          rows={state.certificates.map((item) => ({
            key: item.id,
            searchText: `${item.property} ${item.type} ${item.status}`,
            filterValues: { status: item.status, type: item.type },
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
        kicker={t("finance")}
        title={role === "tenant" ? t("yourRent") : t("payments")}
      >
        <DataTable
          searchPlaceholder={t("paymentsSearch")}
          filters={paymentTableFilters(state.payments)}
          columns={[tc("amount"), tc("reference"), tc("status")]}
          rows={(role === "tenant"
            ? state.payments.filter((item) => item.tenancy.includes("Queen"))
            : state.payments
          ).map((item) => ({
            key: item.id,
            searchText: `${item.amount} ${item.reference} ${item.status}`,
            filterValues: { status: item.status },
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
      <Page kicker={t("finance")} title={t("arrears")}>
        <DataTable
          searchPlaceholder={t("arrearsSearch")}
          columns={[tc("place"), tc("short"), tc("age")]}
          rows={state.arrears.map((item) => ({
            key: item.id,
            searchText: `${item.place} ${item.amount} ${item.age} ${item.plan}`,
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
      <Page kicker={t("finance")} title={t("statements")}>
        <DataTable
          searchPlaceholder={t("statementsSearch")}
          filters={statementTableFilters(state.statements)}
          columns={[tc("who"), tc("period"), tc("status")]}
          rows={state.statements.map((item) => ({
            key: item.id,
            searchText: `${item.landlord} ${item.period} ${item.status}`,
            filterValues: { status: item.status },
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
      <Page kicker={t("yourDecision")} title={t("approvals")}>
        <DataTable
          searchPlaceholder={t("approvalsSearch")}
          filters={jobTableFilters(waiting)}
          columns={[tc("job"), tc("quote"), tc("status")]}
          rows={waiting.map((item) => ({
            key: item.id,
            searchText: `${item.title} ${item.quote} ${item.status}`,
            filterValues: { status: item.status },
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
    return <TenantOnboardingPanel />;
  }

  if (screen === "tenancy") {
    return (
      <Page kicker={t("yourTenancy")} title="22 Queen's Road">
        <FieldList
          rows={[
            { label: t("agreement"), value: t("waitingSignature") },
            { label: t("rent"), value: t("rentMonthly") },
            { label: t("otherTenants"), value: t("notShown") },
          ]}
        />
      </Page>
    );
  }

  if (screen === "maintenance") {
    return <RepairForm />;
  }

  if (screen === "documents") {
    const docs =
      role === "landlord" || role === "tenant"
        ? state.documents.filter((row) => row.orgId === "harbour" || row.orgId === "northbridge")
        : state.documents;
    return (
      <DocumentsPage role={role} docs={docs} api={api} />
    );
  }

  if (screen === "requirements") {
    return (
      <Page kicker={t("compliance")} title={t("requirements")}>
        <DataTable
          caption={t("requirementTemplates")}
          searchPlaceholder={t("requirementsSearch")}
          filters={requirementTableFilters(state.requirements)}
          columns={[tc("requirement"), tc("appliesTo"), tc("frequency"), tc("status")]}
          rows={state.requirements.map((item) => ({
            key: item.id,
            searchText: `${item.name} ${item.appliesTo} ${item.frequency} ${item.status}`,
            filterValues: { status: item.status },
            cells: [
              <Link
                key="n"
                className="rowlink"
                href={`${base}/requirements/${item.id}`}
              >
                {item.name}
              </Link>,
              item.appliesTo,
              item.frequency,
              item.status,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "schedules") {
    return (
      <Page kicker={t("finance")} title={t("rentSchedules")}>
        <DeskStack>
          <CreateRentScheduleForm base={`${base}/schedules`} />
          <DataTable
            caption={t("expectedCharges")}
            searchPlaceholder={t("scheduleSearch")}
            filters={scheduleTableFilters(state.rentSchedules)}
            columns={[tc("tenancy"), tc("amount"), tc("frequency"), tc("status")]}
            rows={state.rentSchedules.map((item) => ({
              key: item.id,
              searchText: `${item.tenancy} ${item.amount} ${item.frequency} ${item.status}`,
              filterValues: {
                status: item.status,
                frequency: item.frequency,
              },
              cells: [
                <Link
                  key="t"
                  className="rowlink"
                  href={`${base}/schedules/${item.id}`}
                >
                  {item.tenancy}
                </Link>,
                item.amount,
                item.frequency,
                item.status,
              ],
            }))}
          />
        </DeskStack>
      </Page>
    );
  }

  if (screen === "maintenance" && role === "operations") {
    return (
      <Page kicker={t("operations")} title={t("maintenanceQueue")}>
        <DataTable
          caption={t("issuesWorkOrders")}
          searchPlaceholder={t("maintenanceSearch")}
          columns={[tc("job"), tc("address"), tc("status"), tc("assignee")]}
          rows={state.jobs.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="t"
                className="rowlink"
                href={`${base.replace("/operations", "/contractor")}/jobs/${item.id}`}
              >
                {item.title}
              </Link>,
              item.address,
              item.status,
              item.assignee,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "properties" && role === "operations") {
    return (
      <Page kicker={t("operations")} title={t("properties")}>
        <DataTable
          caption={t("portfolio")}
          searchPlaceholder={t("propertiesSearch")}
          columns={[tc("address"), tc("office"), tc("status"), tc("tenancy")]}
          rows={state.properties.map((item) => ({
            key: item.id,
            cells: [
              <Link
                key="a"
                className="rowlink"
                href={`${base.replace("/operations", "/property")}/properties/${item.id}`}
              >
                {item.address}
              </Link>,
              item.branch,
              item.status,
              item.tenancy,
            ],
          }))}
        />
      </Page>
    );
  }

  if (screen === "profile") {
    return (
      <Page kicker={t("contact2")} title={t("yourDetails")}>
        <FieldList
          rows={[
            {
              label: t("profileName"),
              value: role === "landlord" ? "Harbour portfolio" : "J. Adeyemi",
            },
            { label: t("phone"), value: "07700 900123" },
            {
              label: t("change"),
              value: t("changeValue"),
            },
          ]}
        />
      </Page>
    );
  }

  return (
    <Page kicker={t("missing")} title={t("notInRole")}>
      <Link className="refresh" href={base}>
        {t("backToDesk")}
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
  const t = useTranslations("detail");
  const td = useTranslations("dash");
  const tl = useTranslations("list");
  const tf = useTranslations("forms");
  const tc = useTranslations("common");

  if (screen === "organisations" && id === "new") {
    return (
      <Page kicker={td("platform")} title={t("createOrganisation")}>
        <CreateOrgWizard base={base} />
      </Page>
    );
  }

  if (screen === "organisations") {
    const org = state.orgs.find((item) => item.id === id);
    if (!org) return <Missing base={base} />;
    return (
      <OrgDetailPanel
        orgId={org.id}
        base={`${base}/organisations`}
        integrationsBase={base}
        usersBase={base}
        officesBase={base}
        platformAdmin={role === "super-admin"}
      />
    );
  }

  if (screen === "branches" && id === "new") {
    const org =
      state.orgs.find((item) => item.id === "northbridge") ?? state.orgs[0];
    return (
      <Page kicker={t("offices")} title={t("addOfficePage")}>
        <CreateOfficePanel
          orgId={org?.id ?? "northbridge"}
          base={`${base}/branches`}
        />
      </Page>
    );
  }

  if (screen === "branches" && id) {
    const found = state.orgs
      .map((org) => ({
        org,
        office: org.offices.find((office) => office.id === id),
      }))
      .find((row) => row.office);
    if (!found?.office) return <Missing base={base} />;
    return (
      <OfficeDetailPanel
        orgId={found.org.id}
        officeId={found.office.id}
        base={`${base}/branches`}
      />
    );
  }

  if (screen === "users") {
    return (
      <UserDetailFromQuery
        id={id}
        base={`${base}/users`}
        orgAdmin={role === "org-admin"}
      />
    );
  }

  if (screen === "integrations") {
    return <IntegrationDetailPanel id={id} base={base} />;
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
    return (
      <PropertyDetailPanel
        id={item.id}
        landlord={role === "landlord"}
        base={base}
      />
    );
  }

  if (screen === "listings" && id === "new") {
    return (
      <Page kicker={tl("lettings")} title={t("createListing")}>
        <CreateListingWizard base={`${base}/listings`} />
      </Page>
    );
  }
  if (screen === "listings")
    return <ListingDetailPanel id={id} base={`${base}/listings`} />;
  if (screen === "applicants") return <ApplicantDetail id={id} />;
  if (screen === "viewings") return <ViewingDetail id={id} />;
  if (screen === "certificates") return <CertDetail id={id} />;
  if (screen === "payments") return <PaymentDetail id={id} />;
  if (screen === "arrears") return <ArrearsDetail id={id} />;
  if (screen === "statements") return <StatementDetail id={id} />;
  if (screen === "requirements")
    return <RequirementDetailPanel id={id} base={`${base}/requirements`} />;
  if (screen === "schedules")
    return <RentSchedulePanel id={id} base={`${base}/schedules`} />;
  if (screen === "projects" && id === "new") {
    return (
      <Page kicker={td("migration")} title={t("newMigrationProject")}>
        <CreateMigrationProject base={`${base}/projects`} />
      </Page>
    );
  }
  if (screen === "projects")
    return <MigrationDetailPanel id={id} base={base} />;
  if (screen === "jobs")
    return (
      <JobDetailPanel
        id={id}
        base={base}
        landlord={role === "landlord"}
        contractor={role === "contractor"}
      />
    );

  return <Missing base={base} />;
}

function Missing({ base }: { base: string }) {
  const t = useTranslations("detail");
  const tc = useTranslations("common");
  const tf = useTranslations("forms");
  return (
    <Page kicker={tc("notFound")} title={t("recordMissing")}>
      <Link className="refresh" href={base}>
        {tf("back")}
      </Link>
    </Page>
  );
}

function RequestDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const t = useTranslations("detail");
  const tf = useTranslations("forms");
  const tl = useTranslations("list");
  const item = state.requests.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={t("request")} title={item.company}>
      <FieldList
        rows={[
          { label: tf("status"), value: item.status },
          { label: tl("contact2"), value: item.contact },
          { label: tf("email"), value: item.email },
          { label: t("firstOffice"), value: item.branch },
        ]}
      />
      {item.status === "Requested" ? (
        <div className="flow-actions">
          <AsyncButton
            type="button"
            loadingText={t("approving")}
            onClick={() => api.decideRequest(item.id, "Approved")}
          >
            {t("approveAndCreate")}
          </AsyncButton>
          <AsyncButton
            type="button"
            variant="danger"
            loadingText={t("declining")}
            onClick={() => api.decideRequest(item.id, "Declined")}
          >
            {t("decline")}
          </AsyncButton>
        </div>
      ) : (
        <p className="hint">{t("requestAlready", { status: item.status })}</p>
      )}
    </Page>
  );
}

function UserDetailFromQuery({
  id,
  base,
  orgAdmin,
}: {
  id: string;
  base: string;
  orgAdmin: boolean;
}) {
  const { state } = useDesk();
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("org") ?? undefined;
  const contextOrgId = orgAdmin ? managedOrgId(state) : fromQuery;
  return (
    <UserDetailPanel
      id={id}
      base={base}
      orgAdmin={orgAdmin}
      {...(contextOrgId ? { contextOrgId } : {})}
    />
  );
}

function Users({ base, orgWide }: { base: string; orgWide: boolean }) {
  const { state, api } = useDesk();
  const searchParams = useSearchParams();
  const { pending, run } = usePendingAction();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const tl = useTranslations("list");
  const staffRoleLabel = (value: string) => {
    const keys: Record<string, string> = {
      "Organisation Admin": tf("staffRole.orgAdmin"),
      Operations: tf("staffRole.operations"),
      Lettings: tf("staffRole.lettings"),
      Compliance: tf("staffRole.compliance"),
      Finance: tf("staffRole.finance"),
    };
    return keys[value] ?? value;
  };
  const scopedOrgId = searchParams.get("org");
  const defaultOrgId = managedOrgId(state);
  const org =
    (scopedOrgId
      ? state.orgs.find((item) => item.id === scopedOrgId)
      : undefined) ??
    state.orgs.find((item) => item.id === defaultOrgId) ??
    state.orgs[0];
  const orgId = org?.id ?? defaultOrgId;
  const roster =
    orgWide && !scopedOrgId
      ? state.users
      : state.users.filter((user) => user.orgId === orgId);
  const userLink = (userId: string) =>
    scopedOrgId || !orgWide
      ? `${base}/users/${userId}?org=${encodeURIComponent(orgId)}`
      : `${base}/users/${userId}`;
  const branchOptions =
    org?.offices.map((office) => office.name) ?? [
      "Peckham",
      "Deptford",
      "Greenwich",
    ];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Lettings");
  const [scope, setScope] = useState(branchOptions[0] ?? "Peckham");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const canInvite =
    name.trim().length > 0 && isEmail(email.trim()) && !pending;
  const roles = orgWide
    ? ["Organisation Admin", "Operations", "Lettings", "Compliance", "Finance"]
    : [
        "Organisation Admin",
        "Operations",
        "Lettings",
        "Compliance",
        "Finance",
      ];
  return (
    <Page
      kicker={
        orgWide && scopedOrgId
          ? org?.name ?? td("organisation")
          : td("access")
      }
      title={
        orgWide && scopedOrgId
          ? td("teamInOrg")
          : orgWide
            ? td("usersPlatform")
            : td("users")
      }
    >
      {orgWide && scopedOrgId && org ? (
        <p className="hint">
          {td("showingMembers", { org: org.name })}{" "}
          <Link className="refresh" href={`${base}/users`}>
            {td("viewAllPlatformUsers")}
          </Link>
          {" · "}
          <Link
            className="refresh"
            href={`${base.replace(/\/users$/, "")}/organisations/${org.id}?tab=users`}
          >
            {td("organisationHub")}
          </Link>
        </p>
      ) : null}
      <DeskStack>
        <DeskToolbar
          title={td("inviteUser")}
          description={
            scopedOrgId || !orgWide
              ? td("inviteScoped", {
                  org: org?.name ?? td("organisation"),
                })
              : td("invitePlatform")
          }
        >
          <form
            className="form form--inline"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const person = name.trim();
                const mail = email.trim();
                const next: { name?: string; email?: string } = {};
                if (!person) next.name = tf("errors.enterPersonName");
                if (!isEmail(mail)) next.email = tf("errors.validEmail");
                else if (
                  state.users.some(
                    (user) => user.email?.toLowerCase() === mail.toLowerCase(),
                  )
                ) {
                  next.email = tf("errors.emailTaken");
                }
                setErrors(next);
                if (next.name || next.email) return;
                api.inviteUser({
                  name: person,
                  email: mail,
                  role,
                  scope,
                  orgId,
                });
                setName("");
                setEmail("");
              });
            }}
          >
            <label>
              {tf("name")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={errors.name ? true : undefined}
                required
              />
            </label>
            {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            <label>
              {tf("email")}
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={errors.email ? true : undefined}
                required
              />
            </label>
            {errors.email ? <FieldError>{errors.email}</FieldError> : null}
            <label>
              {tf("role")}
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {roles.map((item) => (
                  <option key={item}>{staffRoleLabel(item)}</option>
                ))}
              </select>
            </label>
            <label>
              {tf("branchScope")}
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value)}
              >
                <option>{tf("allBranches")}</option>
                {branchOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <Button
              type="submit"
              loading={pending}
              disabled={!canInvite}
              loadingText={tf("loading.sending")}
            >
              {tf("sendInvite")}
            </Button>
          </form>
        </DeskToolbar>
        <DataTable
          caption={td("activeInvitedUsers")}
          searchable
          searchPlaceholder={td("usersSearch")}
          filters={[
            {
              id: "role",
              label: tf("role"),
              options: [
                { value: "", label: tf("allRoles") },
                ...[
                  "Organisation Admin",
                  "Operations",
                  "Lettings",
                  "Compliance",
                  "Finance",
                ].map((label) => ({
                  value: label,
                  label: staffRoleLabel(label),
                })),
              ],
            },
            {
              id: "status",
              label: tf("status"),
              options: [
                { value: "", label: tf("allStatuses") },
                { value: "Active", label: tf("userStatus.active") },
                { value: "Invited", label: tf("userStatus.invited") },
                { value: "Deactivated", label: tf("userStatus.suspended") },
              ],
            },
            {
              id: "scope",
              label: tf("scope"),
              options: [
                { value: "", label: tf("allScopes") },
                ...branchOptions.map((label) => ({
                  value: label,
                  label,
                })),
                { value: "All branches", label: tf("allBranches") },
              ],
            },
          ]}
          columns={[
            tc("name"),
            tf("email"),
            tf("role"),
            tf("scope"),
            tc("status"),
            "",
          ]}
          rows={roster.map((item) => ({
            key: item.id,
            searchText: `${item.name} ${item.email ?? ""} ${item.role} ${item.scope} ${item.status}`,
            filterValues: {
              role: item.role,
              status: item.status,
              scope: item.scope,
            },
            cells: [
              <Link key="n" className="rowlink" href={userLink(item.id)}>
                {item.name}
              </Link>,
              item.email || "—",
              staffRoleLabel(item.role),
              item.scope,
              item.status,
              <Link key="m" className="refresh" href={userLink(item.id)}>
                {tl("manage")}
              </Link>,
            ],
          }))}
        />
      </DeskStack>
    </Page>
  );
}

function Branches({ base }: { base: string }) {
  const { state } = useDesk();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const tl = useTranslations("list");
  const org =
    state.orgs.find((item) => item.id === "northbridge") ?? state.orgs[0];
  if (!org) return null;
  return (
    <Page kicker={org.name} title={td("offices")}>
      <DeskStack>
        <DeskToolbar
          title={td("offices")}
          description={td("officesDesc")}
        >
          <Button variant="primary" asChild>
            <Link href={`${base}/branches/new`}>{td("addOffice")}</Link>
          </Button>
        </DeskToolbar>
        <DataTable
          caption={td("allOffices")}
          searchPlaceholder={td("officesSearch")}
          filters={[
            {
              id: "status",
              label: tf("status"),
              options: [
                { value: "", label: tf("allStatuses") },
                { value: "Active", label: tf("officeStatus.active") },
                { value: "Closed", label: tf("officeStatus.closed") },
              ],
            },
          ]}
          columns={[tc("office"), tc("address"), tc("person"), tc("status"), ""]}
          rows={org.offices.map((office) => ({
            key: office.id,
            searchText: `${office.name} ${office.line1} ${office.town} ${office.postcode} ${office.manager}`,
            filterValues: { status: office.status },
            cells: [
              <Link
                key="n"
                className="rowlink"
                href={`${base}/branches/${office.id}`}
              >
                {office.name}
              </Link>,
              [office.line1, office.postcode].filter(Boolean).join(", ") || "—",
              office.manager || "—",
              office.status,
              <Link
                key="m"
                className="refresh"
                href={`${base}/branches/${office.id}`}
              >
                {tl("manage")}
              </Link>,
            ],
          }))}
        />
      </DeskStack>
    </Page>
  );
}

function Settings() {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tCommon = useTranslations("common");
  const [days, setDays] = useState(state.reminderDays);
  const canSave = days.trim().length > 0 && !pending;
  return (
    <Page kicker={td("organisation")} title={td("settings")}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            api.saveSettings(days);
          });
        }}
      >
        <label>
          {td("certReminderDays")}
          <input
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </label>
        <Button
          type="submit"
          loading={pending}
          disabled={!canSave}
          loadingText={tf("loading.saving")}
        >
          {tCommon("save")}
        </Button>
      </form>
    </Page>
  );
}

function WorkDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.work.find((row) => row.id === id);
  const [owner, setOwner] = useState(item?.owner ?? "Unassigned");
  if (!item) return null;
  return (
    <Page kicker={item.kind} title={item.title}>
      <FieldList
        rows={[
          { label: tc("where"), value: item.place },
          { label: tc("owner"), value: item.owner },
          { label: tc("state"), value: item.state },
          { label: td("work.detail"), value: item.detail },
        ]}
      />
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            api.assignWork(item.id, owner);
          });
        }}
      >
        <label>
          {tf("assign")}
          <select
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
          >
            {["Unassigned", "A. Okonkwo", "L. Shah"].map((person) => (
              <option key={person}>
                {person === "Unassigned" ? td("work.unassigned") : person}
              </option>
            ))}
          </select>
        </label>
        <div className="flow-actions">
          <Button
            type="submit"
            loading={pending}
            loadingText={tf("loading.assigning")}
          >
            {td("work.assign")}
          </Button>
          <AsyncButton
            type="button"
            loadingText={tf("loading.resolving")}
            onClick={() => api.resolveWork(item.id)}
          >
            {td("work.resolve")}
          </AsyncButton>
        </div>
      </form>
    </Page>
  );
}

function ApplicantDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.applicants.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={td("applicant.kicker")} title={item.name}>
      <FieldList
        rows={[
          { label: tc("property"), value: item.property },
          { label: tc("stage"), value: item.stage },
          {
            label: td("applicant.suggestionLabel"),
            value: td("applicant.suggestion"),
          },
        ]}
      />
      <AsyncButton
        type="button"
        loadingText={tf("loading.saving")}
        onClick={() => api.acceptApplicant(item.id)}
      >
        {td("applicant.select")}
      </AsyncButton>
    </Page>
  );
}

function ViewingDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const td = useTranslations("detail");
  const tc = useTranslations("col");
  const item = state.viewings.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.when} title={item.property}>
      <FieldList
        rows={[
          { label: tc("person"), value: item.applicant },
          { label: tc("outcome"), value: item.outcome },
        ]}
      />
      <div className="flow-actions">
        <AsyncButton
          type="button"
          onClick={() => api.setViewingOutcome(item.id, "Interested")}
        >
          {td("viewing.interested")}
        </AsyncButton>
        <AsyncButton
          type="button"
          variant="ghost"
          onClick={() => api.setViewingOutcome(item.id, "Not proceeding")}
        >
          {td("viewing.notProceeding")}
        </AsyncButton>
      </div>
    </Page>
  );
}

function CertDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.certificates.find((row) => row.id === id);
  const [expiry, setExpiry] = useState("18 Sep 2027");
  const canRenew = expiry.trim().length > 0 && !pending;
  if (!item) return null;
  return (
    <Page kicker={item.type} title={item.property}>
      <FieldList
        rows={[
          { label: tc("status"), value: item.status },
          { label: tc("expiry"), value: item.expiry },
          {
            label: td("cert.history"),
            value: item.history.join(" · ") || td("cert.noneYet"),
          },
        ]}
      />
      <div className="flow-actions">
        <AsyncButton
          type="button"
          loadingText={tf("loading.checking")}
          onClick={() => api.validateCert(item.id)}
        >
          {td("cert.markChecked")}
        </AsyncButton>
      </div>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            api.renewCert(item.id, expiry);
          });
        }}
      >
        <label>
          {tf("newExpiry")}
          <input
            value={expiry}
            onChange={(event) => setExpiry(event.target.value)}
          />
        </label>
        <Button
          type="submit"
          loading={pending}
          disabled={!canRenew}
          loadingText={tf("loading.saving")}
        >
          {td("cert.saveRenewal")}
        </Button>
      </form>
    </Page>
  );
}

function PaymentDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.payments.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.reference} title={item.amount}>
      <FieldList
        rows={[
          { label: tc("tenancy"), value: item.tenancy },
          { label: tc("status"), value: item.status },
        ]}
      />
      <AsyncButton
        type="button"
        loadingText={tf("loading.matching")}
        disabled={item.status === "Matched"}
        onClick={() => api.matchPayment(item.id)}
      >
        {td("payment.matchTenancy")}
      </AsyncButton>
    </Page>
  );
}

function ArrearsDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.arrears.find((row) => row.id === id);
  const [plan, setPlan] = useState(item?.plan ?? "");
  const canSave = plan.trim().length > 0 && !pending;
  if (!item) return null;
  return (
    <Page kicker={item.age} title={item.place}>
      <FieldList
        rows={[
          { label: tc("short"), value: item.amount },
          {
            label: td("arrears.plan"),
            value: item.plan || td("arrears.none"),
          },
        ]}
      />
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            api.savePlan(item.id, plan);
          });
        }}
      >
        <label>
          {tf("paymentPlan")}
          <input
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
          />
        </label>
        <Button
          type="submit"
          loading={pending}
          disabled={!canSave}
          loadingText={tf("loading.saving")}
        >
          {td("arrears.savePlan")}
        </Button>
      </form>
    </Page>
  );
}

function StatementDetail({ id }: { id: string }) {
  const { state, api } = useDesk();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.statements.find((row) => row.id === id);
  if (!item) return null;
  return (
    <Page kicker={item.period} title={item.landlord}>
      <FieldList
        rows={[
          { label: tc("status"), value: item.status },
          {
            label: td("statement.landlordSees"),
            value: td("statement.approvedOnly"),
          },
        ]}
      />
      <AsyncButton
        type="button"
        loadingText={tf("loading.publishing")}
        onClick={() => api.publishStatement(item.id)}
      >
        {td("statement.publish")}
      </AsyncButton>
    </Page>
  );
}

function DocumentsPage({
  role,
  docs,
  api,
}: {
  role: string;
  docs: DeskState["documents"];
  api: DeskApi;
}) {
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const [name, setName] = useState("");
  const [type, setType] = useState("PDF");
  const [linkedTo, setLinkedTo] = useState("");
  const orgId =
    role === "landlord" ? "harbour" : role === "tenant" ? "northbridge" : "northbridge";
  const docTypeLabel = (value: string) => {
    const map: Record<string, string> = {
      PDF: tf("docType.pdf"),
      Image: tf("docType.image"),
      Spreadsheet: tf("docType.spreadsheet"),
      Other: tf("docType.other"),
    };
    return map[value] ?? value;
  };

  return (
    <Page kicker={td("records")} title={td("documents")}>
      <DeskStack>
        <DeskToolbar title={td("uploadTitle")} description={td("uploadDesc")}>
          <form
            className="form form--inline"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return;
              api.uploadDocument({
                name,
                type,
                linkedTo: linkedTo.trim() || "General",
                orgId,
              });
              setName("");
              setLinkedTo("");
            }}
          >
            <label>
              {tf("fileName")}
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              {tf("type")}
              <select value={type} onChange={(event) => setType(event.target.value)}>
                {["PDF", "Image", "Spreadsheet", "Other"].map((value) => (
                  <option key={value}>{docTypeLabel(value)}</option>
                ))}
              </select>
            </label>
            <label>
              {tf("linkedRecord")}
              <input
                value={linkedTo}
                onChange={(event) => setLinkedTo(event.target.value)}
                placeholder={tf("linkedRecordPlaceholder")}
              />
            </label>
            <Button type="submit" disabled={!name.trim()}>
              {tf("upload")}
            </Button>
          </form>
        </DeskToolbar>
        <DataTable
          caption={td("linkedFiles")}
          searchPlaceholder={td("documentsSearch")}
          columns={[tc("name"), tf("type"), td("linkedTo"), td("uploaded")]}
          rows={docs.map((item) => ({
            key: item.id,
            cells: [item.name, item.type, item.linkedTo, item.uploaded],
          }))}
        />
      </DeskStack>
    </Page>
  );
}

function RepairForm() {
  const { state, api } = useDesk();
  const td = useTranslations("detail");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const [category, setCategory] = useState("Heating");
  const [detail, setDetail] = useState("");
  const mine = state.jobs.filter(
    (item) => item.address.includes("Queen") || item.status === "Submitted",
  );
  const repairCategoryLabel = (value: string) => {
    const map: Record<string, string> = {
      Heating: tf("repairCategory.heating"),
      Leak: tf("repairCategory.leak"),
      Electrics: tf("repairCategory.electrics"),
      Other: tf("repairCategory.other"),
    };
    return map[value] ?? value;
  };
  return (
    <Page kicker={td("repairs")} title={td("reportIssue")}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          api.reportIssue(category, detail);
          setDetail("");
        }}
      >
        <label>
          {tf("category")}
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {["Heating", "Leak", "Electrics", "Other"].map((item) => (
              <option key={item}>{repairCategoryLabel(item)}</option>
            ))}
          </select>
        </label>
        <label>
          {tf("whatHappened")}
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="refresh">
          {tf("submit")}
        </button>
      </form>
      <h2 className="section-label">{td("yourIssues")}</h2>
      <DataTable
        columns={[td("issue"), tc("status")]}
        rows={mine.map((item) => ({
          key: item.id,
          cells: [item.title, item.status],
        }))}
      />
    </Page>
  );
}
