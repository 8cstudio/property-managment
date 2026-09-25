"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { APP_DISPLAY_NAME } from "@/i18n/brand";

export function VisitHeader() {
  const t = useTranslations("visit");

  return (
    <header className="visit-header">
      <Link className="visit-header__brand" href="/visit">
        {APP_DISPLAY_NAME}
      </Link>
      <nav className="visit-header__nav" aria-label={t("navLabel")}>
        <Link href="/visit">{t("overview")}</Link>
        <Link href="/visit/register">{t("register")}</Link>
        <Link href="/">{t("signIn")}</Link>
      </nav>
    </header>
  );
}
