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
import { useMemo, useState } from "react";
import { flashDeskSuccess } from "../desk-feedback";
import { useDesk } from "../store";
import { RecordTabs } from "./record-tabs";

export function ListingDetailPanel({
  id,
  base,
}: {
  id: string;
  base: string;
}) {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const tl = useTranslations("panel.listing");
  const tp = useTranslations("panel");
  const tf = useTranslations("forms");
  const item = state.listings.find((row) => row.id === id);
  const [tab, setTab] = useState("overview");
  const [description, setDescription] = useState(item?.description ?? "");
  const [portal, setPortal] = useState(item?.portal ?? "Rightmove");
  const tabs = useMemo(
    () =>
      [
        { id: "overview", label: tl("tabs.overview") },
        { id: "marketing", label: tl("tabs.marketing") },
        { id: "portals", label: tl("tabs.portals") },
        { id: "activity", label: tl("tabs.activity") },
      ] as const,
    [tl],
  );

  if (!item) {
    return (
      <Work>
        <PageHeader kicker={tp("notFound")} title={tl("title")} />
        <Link className="refresh" href={base}>
          {tp("back")}
        </Link>
      </Work>
    );
  }

  return (
    <Work>
      <PageHeader kicker={item.status} title={item.address} />
      <RecordTabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" ? (
        <FieldList
          rows={[
            { label: tl("rent"), value: item.rent || tp("notSet") },
            { label: tl("bedrooms"), value: item.bedrooms || "—" },
            { label: tl("primaryPortal"), value: item.portal },
            { label: tl("published"), value: item.publishedAt ?? tl("notYet") },
          ]}
        />
      ) : null}

      {tab === "marketing" ? (
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              setDescription(description.trim());
              flashDeskSuccess(tl("marketingSaved"));
            });
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
          <Button type="submit" loading={pending} loadingText={tf("loading.saving")}>
            {tl("saveMarketing")}
          </Button>
        </form>
      ) : null}

      {tab === "portals" ? (
        <>
          <FieldList
            rows={[
              { label: tl("channel"), value: portal },
              { label: tl("syncStatus"), value: item.status },
            ]}
          />
          <label>
            {tl("portal")}
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
            <AsyncButton
              type="button"
              loadingText={tf("loading.publishing")}
              onClick={() => api.publishListing(item.id)}
            >
              {tl("publishPortal")}
            </AsyncButton>
            {item.status === "Published" ? (
              <Button type="button" variant="ghost">
                {tl("withdraw")}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {tab === "activity" ? (
        <ul className="field-list">
          <li>
            <span>{tl("created")}</span>
            <strong>{tl("draftSaved")}</strong>
          </li>
          {item.publishedAt ? (
            <li>
              <span>{tl("published")}</span>
              <strong>{item.publishedAt}</strong>
            </li>
          ) : null}
          <li>
            <span>{tl("viewings")}</span>
            <strong>
              {
                state.viewings.filter((row) => row.property === item.address)
                  .length
              }{" "}
              {tl("booked")}
            </strong>
          </li>
        </ul>
      ) : null}

      <p className="hint">
        <Link className="refresh" href={base}>
          {tp("backToListings")}
        </Link>
      </p>
    </Work>
  );
}
