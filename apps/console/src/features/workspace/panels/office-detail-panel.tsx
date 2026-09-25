"use client";

import {
  Button,
  DataTable,
  FieldList,
  PageHeader,
  usePendingAction,
  Work,
} from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

export function OfficeDetailPanel({
  orgId,
  officeId,
  base,
}: {
  orgId: string;
  officeId: string;
  base: string;
}) {
  const router = useRouter();
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const to = useTranslations("panel.office");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const tabs = useMemo(
    () =>
      [
        { id: "details", label: to("tabs.details") },
        { id: "contact", label: to("tabs.contact") },
        { id: "team", label: to("tabs.team") },
        { id: "manage", label: to("tabs.manage") },
      ] as const,
    [to],
  );
  const org = state.orgs.find((item) => item.id === orgId);
  const office = org?.offices.find((item) => item.id === officeId);
  const [tab, setTab] = useState("details");

  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [town, setTown] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [manager, setManager] = useState("");
  const [notes, setNotes] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [removeReason, setRemoveReason] = useState("");

  useEffect(() => {
    if (!office) return;
    setName(office.name);
    setLine1(office.line1);
    setLine2(office.line2);
    setTown(office.town);
    setPostcode(office.postcode);
    setPhone(office.phone);
    setEmail(office.email);
    setManager(office.manager);
    setNotes(office.notes);
  }, [office]);

  if (!org || !office) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={to("title")} />
        <Link className="refresh" href={base}>
          {tp("backToOffices")}
        </Link>
      </Work>
    );
  }

  const team = state.users.filter(
    (user) =>
      user.orgId === orgId &&
      (user.scope === office.name || user.scope === "All branches"),
  );
  const properties = state.properties.filter(
    (property) => property.orgId === orgId && property.branch === office.name,
  );

  function payload() {
    return {
      name: name.trim(),
      line1: line1.trim(),
      line2: line2.trim(),
      town: town.trim(),
      postcode: postcode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      manager: manager.trim(),
      notes: notes.trim(),
      status: office!.status,
    };
  }

  const canSave = name.trim().length > 0 && !pending;

  return (
    <Work>
      <PageHeader kicker={org.name} title={office.name} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "details" ? (
        <>
          <FieldList
            rows={[
              { label: tc("status"), value: office.status },
              {
                label: tc("address"),
                value:
                  [line1, line2, town, postcode].filter(Boolean).join(", ") ||
                  tp("notSet"),
              },
            ]}
          />
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                if (!canSave) return;
                api.updateOffice(orgId, officeId, payload());
              });
            }}
          >
            <label>
              {tf("officeName")}
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              {tf("addressLine1")}
              <input value={line1} onChange={(event) => setLine1(event.target.value)} />
            </label>
            <label>
              {tf("addressLine2")}
              <input value={line2} onChange={(event) => setLine2(event.target.value)} />
            </label>
            <label>
              {tf("townCity")}
              <input value={town} onChange={(event) => setTown(event.target.value)} />
            </label>
            <label>
              {tf("postcode")}
              <input value={postcode} onChange={(event) => setPostcode(event.target.value)} />
            </label>
            <label>
              {tf("internalNotes")}
              <textarea
                value={notes}
                rows={3}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            <Button type="submit" loading={pending} disabled={!canSave} loadingText={tf("loading.saving")}>
              {to("saveDetails")}
            </Button>
          </form>
        </>
      ) : null}

      {tab === "contact" ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => api.updateOffice(orgId, officeId, payload()));
          }}
        >
          <label>
            {tf("officePhone")}
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            {tf("officeEmail")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            {tf("officeManager")}
            <input
              value={manager}
              onChange={(event) => setManager(event.target.value)}
              placeholder={tf("managerPlaceholder")}
            />
          </label>
          <Button type="submit" loading={pending} disabled={!canSave} loadingText={tf("loading.saving")}>
            {to("saveContact")}
          </Button>
        </form>
      ) : null}

      {tab === "team" ? (
        <>
          <DataTable
            caption={to("peopleScoped")}
            searchPlaceholder={to("peopleSearch")}
            columns={[tc("name"), tf("role"), tc("status")]}
            rows={team.map((user) => ({
              key: user.id,
              searchText: `${user.name} ${user.role}`,
              cells: [user.name, user.role, user.status],
            }))}
          />
          <DataTable
            caption={to("propertiesAssigned")}
            searchPlaceholder={to("propertiesSearch")}
            columns={[tc("address"), tc("status"), tc("tenancy")]}
            rows={properties.map((property) => ({
              key: property.id,
              searchText: property.address,
              cells: [property.address, property.status, property.tenancy],
            }))}
          />
        </>
      ) : null}

      {tab === "manage" ? (
        <>
          <p className="hint">{to("manageHint")}</p>
          {office.status === "Closed" ? (
            <Button
              type="button"
              onClick={() =>
                api.setOfficeStatus(orgId, officeId, "Active", "Reopened")
              }
            >
              {to("reopen")}
            </Button>
          ) : (
            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!statusReason.trim()) return;
                void run(async () => {
                  api.setOfficeStatus(
                    orgId,
                    officeId,
                    "Closed",
                    statusReason.trim(),
                  );
                  setStatusReason("");
                });
              }}
            >
              <label>
                {tf("reasonCloseOffice")}
                <input
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                />
              </label>
              <Button
                type="submit"
                variant="danger"
                disabled={!statusReason.trim() || pending}
                loading={pending}
                loadingText={tf("loading.closing")}
              >
                {to("close")}
              </Button>
            </form>
          )}
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!removeReason.trim()) return;
              void run(async () => {
                api.removeOffice(orgId, officeId, removeReason.trim());
                router.push(base);
              });
            }}
          >
            <label>
              {tf("reasonRemoveOffice")}
              <input
                value={removeReason}
                onChange={(event) => setRemoveReason(event.target.value)}
              />
            </label>
            <Button
              type="submit"
              variant="danger"
              disabled={!removeReason.trim() || pending}
              loading={pending}
              loadingText={tf("loading.removing")}
            >
              {to("remove")}
            </Button>
          </form>
        </>
      ) : null}

      <p className="hint">
        <Link className="refresh" href={base}>
          {tp("backToOffices")}
        </Link>
      </p>
    </Work>
  );
}
