import { EzziLoader, PageMain } from "@ezzi/ui";
import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");

  return (
    <PageMain aria-busy="true" aria-live="polite" className="state-splash">
      <EzziLoader className="state-splash__loader" label={t("loading")} />
      <p className="kicker">{t("loading")}</p>
    </PageMain>
  );
}
