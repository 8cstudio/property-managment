"use client";

import { Button, LottiePlayer, PageMain } from "@ezzi/ui";
import { useTranslations } from "next-intl";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <PageMain className="state-splash">
      <LottiePlayer
        className="state-splash__art"
        src="/lottie/error-500.json"
        label={t("errorTitle")}
      />
      <h1>{t("errorTitle")}</h1>
      <p className="note">{t("errorBody")}</p>
      <Button variant="primary" onClick={() => reset()}>
        {t("retry")}
      </Button>
    </PageMain>
  );
}
