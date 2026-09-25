"use client";

import {
  Button,
  FieldList,
  PageHeader,
  usePendingAction,
  Work,
} from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDesk } from "../store";

export function RentSchedulePanel({
  id,
  base,
}: {
  id: string;
  base: string;
}) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const tr = useTranslations("panel.rentSchedule");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const tc = useTranslations("col");
  const item = state.rentSchedules.find((row) => row.id === id);
  const [amount, setAmount] = useState(item?.amount ?? "");
  const [frequency, setFrequency] = useState(item?.frequency ?? "Monthly");
  const [method, setMethod] = useState(item?.method ?? "Standing order");
  const [status, setStatus] = useState(item?.status ?? "Active");

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

  return (
    <Work>
      <PageHeader kicker={item.status} title={item.tenancy} />
      <FieldList
        rows={[
          { label: tr("nextDue"), value: item.nextDue },
          { label: tr("currentAmount"), value: item.amount },
          { label: tc("frequency"), value: item.frequency },
          { label: tr("collectionMethod"), value: item.method },
        ]}
      />
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            api.updateRentSchedule(item.id, {
              amount,
              frequency,
              method,
              status,
            });
          });
        }}
      >
        <h2 className="section-label">{tr("amend")}</h2>
        <label>
          {tf("amount")}
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          {tf("frequency")}
          <select
            value={frequency}
            onChange={(event) => setFrequency(event.target.value)}
          >
            {["Weekly", "Monthly", "Quarterly"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          {tf("method")}
          <select
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            {["Standing order", "Open banking", "Direct debit"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          {tf("status")}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {["Active", "Paused", "Ended"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <Button type="submit" loading={pending} loadingText={tf("loading.saving")}>
          {tr("saveChanges")}
        </Button>
      </form>
      <p className="hint">
        <Link className="refresh" href={base}>
          {tp("backToSchedules")}
        </Link>
      </p>
    </Work>
  );
}

export function CreateRentScheduleForm({ base }: { base: string }) {
  const { api } = useDesk();
  const { pending, run } = usePendingAction();
  const tr = useTranslations("panel.rentSchedule");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const [tenancy, setTenancy] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [method, setMethod] = useState("Standing order");

  return (
    <form
      className="form panel"
      onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          api.createRentSchedule({
            tenancy: tenancy.trim(),
            amount: amount.trim(),
            frequency,
            method,
          });
          setTenancy("");
          setAmount("");
        });
      }}
    >
      <h2 className="section-label">{tr("newSchedule")}</h2>
      <label>
        {tf("tenancy")}
        <input
          value={tenancy}
          onChange={(event) => setTenancy(event.target.value)}
          required
        />
      </label>
      <label>
        {tf("amount")}
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder={tf("rentPlaceholder")}
          required
        />
      </label>
      <label>
        {tf("frequency")}
        <select
          value={frequency}
          onChange={(event) => setFrequency(event.target.value)}
        >
          {["Weekly", "Monthly", "Quarterly"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label>
        {tf("method")}
        <select
          value={method}
          onChange={(event) => setMethod(event.target.value)}
        >
          {["Standing order", "Open banking", "Direct debit"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <Button
        type="submit"
        loading={pending}
        disabled={!tenancy.trim() || !amount.trim() || pending}
        loadingText={tf("loading.creating")}
      >
        {tr("createSchedule")}
      </Button>
      <p className="hint">
        <Link className="refresh" href={base}>
          {tp("backToDesk")}
        </Link>
      </p>
    </form>
  );
}
