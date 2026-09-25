export const locales = ["en-GB", "fr-FR", "es-ES", "pl-PL"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en-GB";

export const localeLabels: Record<AppLocale, string> = {
  "en-GB": "English (UK)",
  "fr-FR": "Français (France)",
  "es-ES": "Español (España)",
  "pl-PL": "Polski",
};

export function isAppLocale(value: string | undefined): value is AppLocale {
  return locales.includes(value as AppLocale);
}
