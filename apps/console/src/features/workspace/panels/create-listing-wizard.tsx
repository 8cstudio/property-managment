"use client";

import { Button, usePendingAction } from "@ezzi/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useDesk } from "../store";

export function CreateListingWizard({ base }: { base: string }) {
  const router = useRouter();
  const { api } = useDesk();
  const { pending, run } = usePendingAction();
  const tf = useTranslations("forms");
  const steps = useMemo(
    () =>
      [
        tf("wizard.listingSteps.property"),
        tf("wizard.listingSteps.marketing"),
        tf("wizard.listingSteps.portals"),
        tf("wizard.listingSteps.review"),
      ] as const,
    [tf],
  );
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [bedrooms, setBedrooms] = useState("2");
  const [description, setDescription] = useState("");
  const [portal, setPortal] = useState("Rightmove");

  return (
    <div className="wizard">
      <p className="kicker">
        {tf("stepOf", { current: step + 1, total: steps.length })}
      </p>
      <ol className="wizard__steps" aria-label={tf("progress")}>
        {steps.map((label, index) => (
          <li
            key={label}
            className={
              index === step
                ? "wizard__step wizard__step--on"
                : index < step
                  ? "wizard__step wizard__step--done"
                  : "wizard__step"
            }
          >
            {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (address.trim()) setStep(1);
          }}
        >
          <label>
            {tf("address")}
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
            />
          </label>
          <label>
            {tf("rentPcm")}
            <input
              value={rent}
              onChange={(event) => setRent(event.target.value)}
              placeholder={tf("rentPlaceholder")}
            />
          </label>
          <label>
            {tf("bedrooms")}
            <select
              value={bedrooms}
              onChange={(event) => setBedrooms(event.target.value)}
            >
              {["1", "2", "3", "4+"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <div className="flow-actions">
            <Button type="button" variant="ghost" asChild>
              <Link href={base}>{tf("cancel")}</Link>
            </Button>
            <Button type="submit">{tf("continue")}</Button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            setStep(2);
          }}
        >
          <label>
            {tf("description")}
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
            />
          </label>
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(0)}>
              {tf("back")}
            </Button>
            <Button type="submit">{tf("continue")}</Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="form">
          <label>
            {tf("primaryPortal")}
            <select
              value={portal}
              onChange={(event) => setPortal(event.target.value)}
            >
              {["Rightmove", "Zoopla", "OnTheMarket"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              {tf("back")}
            </Button>
            <Button type="button" onClick={() => setStep(3)}>
              {tf("continue")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="form">
          <ul className="wizard__review">
            <li>
              <strong>{tf("wizard.reviewAddress")}</strong> {address}
            </li>
            <li>
              <strong>{tf("wizard.reviewRent")}</strong>{" "}
              {rent || tf("wizard.notSet")}
            </li>
            <li>
              <strong>{tf("wizard.reviewBedrooms")}</strong> {bedrooms}
            </li>
            <li>
              <strong>{tf("wizard.reviewPortal")}</strong> {portal}
            </li>
          </ul>
          <div className="flow-actions">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              {tf("back")}
            </Button>
            <Button
              type="button"
              loading={pending}
              loadingText={tf("loading.creating")}
              onClick={() =>
                void run(async () => {
                  const id = api.createListing({
                    address: address.trim(),
                    portal,
                    rent: rent.trim() || "TBC",
                    bedrooms,
                    description: description.trim(),
                  });
                  router.push(`${base}/${id}`);
                })
              }
            >
              {tf("wizard.createDraftListing")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
