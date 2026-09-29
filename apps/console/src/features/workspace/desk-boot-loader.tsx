"use client";

import { Shimmer, Work } from "@ezzi/ui";
import { useTranslations } from "next-intl";

export type DeskBootStep = 1 | 2 | 3;

const STEP_PERCENT: Record<DeskBootStep, number> = {
  1: 28,
  2: 58,
  3: 88,
};

function bootLabel(step: DeskBootStep, t: ReturnType<typeof useTranslations>): string {
  return step === 1
    ? t("deskBoot.identity")
    : step === 2
      ? t("deskBoot.requests")
      : t("deskBoot.collections");
}

/** Full-page boot (auth slow path only). */
export function DeskBootLoader({ step }: { step: DeskBootStep }) {
  const t = useTranslations("common");
  const label = bootLabel(step, t);
  const pct = STEP_PERCENT[step];

  return (
    <Work className="desk-boot" aria-busy="true" aria-live="polite">
      <p className="kicker">{t("deskBoot.title")}</p>
      <div
        className="desk-boot__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div className="desk-boot__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="hint desk-boot__step">{label}</p>
      <Shimmer size="lg" />
    </Work>
  );
}

/** Non-blocking sync bar while more desk data loads in the background. */
export function DeskBootFloating({
  step,
  failed = false,
  onRetry,
}: {
  step: DeskBootStep;
  failed?: boolean;
  onRetry?: () => void;
}) {
  const t = useTranslations("common");
  const label = failed ? t("deskBoot.failed") : bootLabel(step, t);
  const pct = STEP_PERCENT[step];

  return (
    <div
      className="desk-boot desk-boot--floating"
      aria-busy={failed ? undefined : true}
      aria-live="polite"
      role="status"
    >
      <p className="desk-boot__floating-title">{t("deskBoot.title")}</p>
      <div
        className="desk-boot__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label}
      >
        <div className="desk-boot__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="hint desk-boot__step">{label}</p>
      {failed && onRetry ? (
        <button type="button" className="desk-boot__retry" onClick={onRetry}>
          {t("retry")}
        </button>
      ) : null}
    </div>
  );
}
