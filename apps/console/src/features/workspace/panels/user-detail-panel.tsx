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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isEmail } from "../auth";
import { managedOrgId } from "../org-scope";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

export function UserDetailPanel({
  id,
  base,
  orgAdmin,
  contextOrgId,
}: {
  id: string;
  base: string;
  /** Org admin managing their org only (cannot pick org). */
  orgAdmin: boolean;
  /** When set (org hub or ?org=), access is managed for this tenant only. */
  contextOrgId?: string;
}) {
  const router = useRouter();
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const t = useTranslations("panel.user");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const tabs = useMemo(
    () =>
      [
        { id: "profile", label: t("tabs.profile") },
        { id: "access", label: t("tabs.access") },
        { id: "danger", label: t("tabs.danger") },
      ] as const,
    [t],
  );
  const user = state.users.find((item) => item.id === id);
  const accessOrgId = contextOrgId ?? (orgAdmin ? managedOrgId(state) : user?.orgId);
  const accessOrg = state.orgs.find((item) => item.id === accessOrgId);
  const org = accessOrg ?? state.orgs.find((item) => item.id === user?.orgId);
  const [tab, setTab] = useState("profile");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operations");
  const [scope, setScope] = useState("Peckham");
  const [statusReason, setStatusReason] = useState("");
  const [removeReason, setRemoveReason] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setScope(user.scope);
  }, [user]);

  if (!user) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={t("title")} />
        <Link className="refresh" href={base}>
          {tp("backToUsers")}
        </Link>
      </Work>
    );
  }

  const tenantId = managedOrgId(state);
  if (orgAdmin && user.orgId !== tenantId) {
    return (
      <Work>
        <PageHeader kicker={tp("notAllowed")} title={t("outsideOrg")} />
        <p className="hint">{t("outsideHint")}</p>
        <Link className="refresh" href={base}>
          {tp("backToUsers")}
        </Link>
      </Work>
    );
  }

  if (contextOrgId && user.orgId !== contextOrgId) {
    const expected = state.orgs.find((item) => item.id === contextOrgId);
    return (
      <Work>
        <PageHeader
          kicker={expected?.name ?? contextOrgId}
          title={t("notInOrg")}
        />
        <p className="hint">{t("notInOrgHint")}</p>
        <Link
          className="refresh"
          href={`${roleBase(base)}/organisations/${contextOrgId}?tab=users`}
        >
          {tp("backToOrgTeam")}
        </Link>
      </Work>
    );
  }

  const branchOptions =
    org?.offices.map((office) => office.name) ?? [
      "Peckham",
      "Deptford",
      "Greenwich",
    ];
  const roleOptions = orgAdmin
    ? ["Operations", "Lettings", "Compliance", "Finance", "Organisation Admin"]
    : [
        "Organisation Admin",
        "Operations",
        "Lettings",
        "Compliance",
        "Finance",
      ];

  const canSaveProfile =
    name.trim().length > 0 && isEmail(email.trim()) && !pending;
  const canSuspend =
    statusReason.trim().length > 0 && !pending && user.status !== "Deactivated";
  const canRemove = removeReason.trim().length > 0 && !pending;

  const backHref = contextOrgId
    ? orgAdmin
      ? `${roleBase(base)}/organisation?tab=users`
      : `${roleBase(base)}/organisations/${contextOrgId}?tab=users`
    : base;

  return (
    <Work>
      <PageHeader
        kicker={
          contextOrgId || orgAdmin
            ? `${org?.name ?? user.orgId} · ${t("membership")}`
            : org?.name ?? user.orgId
        }
        title={user.name}
      />
      {contextOrgId || orgAdmin ? (
        <p className="hint">
          {t("scopeHint", {
            org: org?.name ?? t("thisOrg"),
          })}
        </p>
      ) : null}
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "profile" ? (
        <>
          <FieldList
            rows={[
              { label: tc("status"), value: user.status },
              {
                label: t("statusNote"),
                value: user.statusNote || tp("none"),
              },
            ]}
          />
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!canSaveProfile) return;
                api.updateUser(user.id, {
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  scope,
                });
              });
            }}
          >
            <label>
              {tf("name")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              {tf("email")}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <Button
              type="submit"
              loading={pending}
              disabled={!canSaveProfile}
              loadingText={tf("loading.saving")}
            >
              {t("saveProfile")}
            </Button>
          </form>
        </>
      ) : null}

      {tab === "access" ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!canSaveProfile) return;
              api.updateUser(user.id, {
                name: name.trim(),
                email: email.trim(),
                role,
                scope,
              });
            });
          }}
        >
          <label>
            {tf("role")}
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              {roleOptions.map((value) => (
                <option key={value}>{value}</option>
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
              {branchOptions.map((office) => (
                <option key={office}>{office}</option>
              ))}
            </select>
          </label>
          {user.status === "Invited" ? (
            <div className="flow-actions">
              <AsyncButton
                type="button"
                onClick={() => api.resendUserInvite(user.id)}
              >
                {t("resendInvite")}
              </AsyncButton>
            </div>
          ) : null}
          <Button
            type="submit"
            loading={pending}
            disabled={!canSaveProfile}
            loadingText={tf("loading.saving")}
          >
            {t("saveAccess")}
          </Button>
        </form>
      ) : null}

      {tab === "danger" ? (
        <>
          <p className="hint">{t("dangerHint")}</p>
          {user.status === "Deactivated" ? (
            <div className="flow-actions">
              <AsyncButton
                type="button"
                onClick={() =>
                  api.setUserStatus(user.id, "Active", "Access reinstated")
                }
              >
                {t("reinstate")}
              </AsyncButton>
            </div>
          ) : (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  if (!canSuspend) return;
                  api.setUserStatus(
                    user.id,
                    "Deactivated",
                    statusReason.trim(),
                  );
                  setStatusReason("");
                });
              }}
            >
              <label>
                {tf("reasonSuspend")}
                <input
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  placeholder={tf("required")}
                />
              </label>
              <Button
                type="submit"
                variant="danger"
                loading={pending}
                disabled={!canSuspend}
                loadingText={tf("loading.suspending")}
              >
                {t("suspendMember")}
              </Button>
            </form>
          )}
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!canRemove) return;
                api.removeUser(user.id, removeReason.trim());
                router.push(base);
              });
            }}
          >
            <label>
              {tf("reasonRemoveMember")}
              <input
                value={removeReason}
                onChange={(event) => setRemoveReason(event.target.value)}
                placeholder={tf("requiredAudit")}
              />
            </label>
            <Button
              type="submit"
              variant="danger"
              loading={pending}
              disabled={!canRemove}
              loadingText={tf("loading.removing")}
            >
              {t("removeMember")}
            </Button>
          </form>
        </>
      ) : null}

      <p className="hint">
        <Link className="refresh" href={backHref}>
          {contextOrgId || orgAdmin ? tp("backToOrgTeam") : tp("backToUsers")}
        </Link>
        {org && !orgAdmin && !contextOrgId ? (
          <>
            {" · "}
            <Link
              className="refresh"
              href={`${roleBase(base)}/organisations/${org.id}`}
            >
              {tp("orgOverview")}
            </Link>
          </>
        ) : null}
        {orgAdmin && !contextOrgId ? (
          <>
            {" · "}
            <Link className="refresh" href={`${roleBase(base)}/organisation?tab=users`}>
              {tp("orgHub")}
            </Link>
          </>
        ) : null}
      </p>
    </Work>
  );
}

function roleBase(usersListBase: string) {
  return usersListBase.replace(/\/users\/?$/, "");
}
