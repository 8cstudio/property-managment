"use client";

import { localeLabels, type AppLocale, locales } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const [pending, startTransition] = useTransition();

  return (
    <label className="locale-switch">
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        value={locale}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as AppLocale;
          startTransition(async () => {
            await setLocale(next);
            // Full reload so SSR and client always share the same locale cookie.
            window.location.reload();
          });
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
