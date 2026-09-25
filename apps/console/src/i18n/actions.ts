"use server";

import { cookies } from "next/headers";
import { isAppLocale } from "./config";

export async function setLocale(locale: string) {
  if (!isAppLocale(locale)) return;
  const store = await cookies();
  store.set("ezzi-locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
