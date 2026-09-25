"use client";

import { AsyncButton, Button, usePendingAction, Work } from "@ezzi/ui";
import { PageHeader } from "@ezzi/ui";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDesk } from "../store";

export function TenantOnboardingPanel() {
  const { state, api } = useDesk();
  const { pending, run } = usePendingAction();
  const t = useTranslations("panel.tenantOnboarding");
  const tf = useTranslations("forms");
  const ta = useTranslations("auth");
  const steps = state.onboarding;
  const activeId = useMemo(() => {
    const inProgress = steps.find((item) => item.state === "In progress");
    if (inProgress) return inProgress.id;
    const blocked = steps.find((item) => item.state === "Blocked");
    if (blocked) return blocked.id;
    const next = steps.find((item) => item.state === "Not started");
    return next?.id ?? steps[steps.length - 1]?.id ?? "";
  }, [steps]);

  const [focus, setFocus] = useState<string | null>(null);
  const currentId = focus ?? activeId;
  const current = steps.find((item) => item.id === currentId);

  const [phone, setPhone] = useState("07700 900456");
  const [emergency, setEmergency] = useState("Alex Begum · 07700 900457");
  const [idNote, setIdNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [depositRef, setDepositRef] = useState("");

  const complete = steps.every((item) => item.state === "Complete");

  return (
    <Work>
      <PageHeader
        kicker={t("kicker")}
        title={complete ? t("complete") : t("title")}
      />
      <ol className="onboarding-steps">
        {steps.map((item, index) => {
          const on = item.id === currentId;
          const done = item.state === "Complete";
          return (
            <li
              key={item.id}
              className={
                done
                  ? "onboarding-steps__item onboarding-steps__item--done"
                  : on
                    ? "onboarding-steps__item onboarding-steps__item--on"
                    : "onboarding-steps__item"
              }
            >
              <button
                type="button"
                className="onboarding-steps__head"
                onClick={() => setFocus(item.id)}
              >
                <span className="onboarding-steps__index">{index + 1}</span>
                <span>
                  <strong>{item.title}</strong>
                  <span className="onboarding-steps__state">{item.state}</span>
                </span>
              </button>
              {on ? (
                <div className="onboarding-steps__body panel">
                  <p className="hint">{item.summary}</p>
                  {item.blocker ? (
                    <p className="field-error">{item.blocker}</p>
                  ) : null}

                  {item.id === "o1" && item.state !== "Complete" ? (
                    <form
                      className="form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void run(async () => api.submitStep(item.id));
                      }}
                    >
                      <label>
                        {tf("mobile")}
                        <input
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                        />
                      </label>
                      <label>
                        {tf("emergencyContact")}
                        <input
                          value={emergency}
                          onChange={(event) => setEmergency(event.target.value)}
                        />
                      </label>
                      <Button type="submit" loading={pending} loadingText={tf("loading.saving")}>
                        {t("confirmDetails")}
                      </Button>
                    </form>
                  ) : null}

                  {item.id === "o2" ? (
                    <form
                      className="form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void run(async () => api.submitStep(item.id));
                      }}
                    >
                      <label>
                        {tf("uploadIdMock")}
                        <input type="file" accept="image/*,.pdf" />
                      </label>
                      <label>
                        {tf("noteReferencing")}
                        <textarea
                          value={idNote}
                          onChange={(event) => setIdNote(event.target.value)}
                          placeholder={tf("optionalLettingsNote")}
                        />
                      </label>
                      <Button type="submit" loading={pending} loadingText={tf("loading.uploading")}>
                        {t("submitId")}
                      </Button>
                    </form>
                  ) : null}

                  {item.id === "o3" ? (
                    <form
                      className="form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!agreed) return;
                        void run(async () => api.submitStep(item.id));
                      }}
                    >
                      <p className="hint">{t("agreementHint")}</p>
                      <label>
                        <input
                          type="checkbox"
                          checked={agreed}
                          onChange={(event) => setAgreed(event.target.checked)}
                        />
                        {ta("agreeSign")}
                      </label>
                      <Button
                        type="submit"
                        disabled={!agreed || pending}
                        loading={pending}
                        loadingText={tf("loading.signing")}
                      >
                        {t("signAgreement")}
                      </Button>
                    </form>
                  ) : null}

                  {item.id === "o4" ? (
                    <form
                      className="form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!depositRef.trim()) return;
                        void run(async () => api.submitStep(item.id));
                      }}
                    >
                      <p className="hint">{t("depositHint")}</p>
                      <label>
                        {tf("paymentRefBank")}
                        <input
                          value={depositRef}
                          onChange={(event) => setDepositRef(event.target.value)}
                          placeholder={tf("depositRefPlaceholder")}
                        />
                      </label>
                      <Button
                        type="submit"
                        disabled={!depositRef.trim() || pending}
                        loading={pending}
                        loadingText={tf("loading.confirming")}
                      >
                        {t("confirmDeposit")}
                      </Button>
                    </form>
                  ) : null}

                  {item.state === "Complete" ? (
                    <p className="hint">{t("stepComplete")}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </Work>
  );
}
