"use client";

import { Button, usePendingAction } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDesk } from "../store";

export function CreateOfficePanel({
  orgId: orgIdProp,
  base,
}: {
  orgId?: string;
  base: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tf = useTranslations("forms");
  const orgId =
    orgIdProp ?? searchParams.get("org") ?? "northbridge";
  const { api } = useDesk();
  const { pending, run } = usePendingAction();
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [town, setTown] = useState("London");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [manager, setManager] = useState("");
  const [notes, setNotes] = useState("");

  const canCreate = name.trim().length > 0 && !pending;

  return (
    <div className="wizard">
      <p className="kicker">{tf("wizard.newOffice")}</p>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            if (!canCreate) return;
            const id = api.createOffice(orgId, {
              name,
              line1,
              line2,
              town,
              postcode,
              phone,
              email,
              manager,
              notes,
            });
            router.push(`${base}/${id}`);
          });
        }}
      >
        <label>
          {tf("officeName")}
          <input value={name} onChange={(event) => setName(event.target.value)} required />
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
          {tf("phone")}
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          {tf("email")}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          {tf("manager")}
          <input value={manager} onChange={(event) => setManager(event.target.value)} />
        </label>
        <label>
          {tf("notes")}
          <textarea value={notes} rows={2} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <div className="flow-actions">
          <Button type="button" variant="ghost" asChild>
            <Link href={base}>{tf("cancel")}</Link>
          </Button>
          <Button type="submit" loading={pending} disabled={!canCreate} loadingText={tf("loading.creating")}>
            {tf("wizard.createOffice")}
          </Button>
        </div>
      </form>
    </div>
  );
}
