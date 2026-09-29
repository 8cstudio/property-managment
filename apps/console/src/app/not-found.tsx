import { Button, LottiePlayer, PageMain } from "@ezzi/ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <PageMain className="state-splash">
      <LottiePlayer
        className="state-splash__art"
        src="/lottie/error-404.json"
        label={t("notFoundTitle")}
      />
      <p className="kicker">{t("notFound")}</p>
      <h1>{t("notFoundTitle")}</h1>
      <p className="note">{t("notFoundBody")}</p>
      <Button variant="primary" asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </PageMain>
  );
}
