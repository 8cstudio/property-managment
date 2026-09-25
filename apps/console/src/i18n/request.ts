import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isAppLocale, locales } from "./config";

/**
 * Locale comes only from the `ezzi-locale` cookie (set by the language switcher).
 * Do not infer from Accept-Language on SSR — that caused hydration mismatches
 * when the cookie and browser language disagreed.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("ezzi-locale")?.value;
  let locale = isAppLocale(fromCookie) ? fromCookie : defaultLocale;

  if (!locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    onError(error) {
      if (error.code === "MISSING_MESSAGE") return;
      console.error(error);
    },
    getMessageFallback({ namespace, key }) {
      if (process.env.NODE_ENV === "development") {
        return `[${namespace}.${key}]`;
      }
      return key;
    },
  };
});
