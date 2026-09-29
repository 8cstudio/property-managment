"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { APP_DISPLAY_NAME } from "@/i18n/brand";
import { usePlatformBrand } from "@/features/platform-brand/brand-provider";

export function VisitHeader() {
  const t = useTranslations("visit");
  const brand = usePlatformBrand();

  return (
    <header className="visit-header">
      <Link className="visit-header__brand" href="/visit">
        {brand.logoUrl ? (
          <img className="brand__logo" src={brand.logoUrl} alt="" />
        ) : null}
        {brand.name || APP_DISPLAY_NAME}
      </Link>
      <nav className="visit-header__nav" aria-label={t("navLabel")}>
        <Link className="visit-nav__link" href="/visit">
          {t("overview")}
        </Link>
        <Link className="visit-nav__link visit-nav__link--register" href="/visit/register">
          {t("register")}
        </Link>
        <Link className="visit-nav__link visit-nav__link--signin" href="/">
          {t("signIn")}
        </Link>
      </nav>
    </header>
  );
}
