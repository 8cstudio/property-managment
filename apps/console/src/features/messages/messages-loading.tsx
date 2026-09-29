"use client";

import { Shimmer, Work } from "@ezzi/ui";
import { useTranslations } from "next-intl";

export function MessagesLoading() {
  const t = useTranslations("messages");

  return (
    <div className="messenger messenger--loading" aria-busy="true" aria-live="polite">
      <Work className="messenger-loading">
        <p className="kicker">{t("loadingTitle")}</p>
        <p className="hint">{t("loadingHint")}</p>
        <Shimmer size="lg" />
      </Work>
    </div>
  );
}
