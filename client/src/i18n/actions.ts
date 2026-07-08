"use server";

import { cookies } from "next/headers";
import { isLocale, localeCookieMaxAge, localeCookieName, type Locale } from "./config";

export async function setUserLocale(locale: Locale) {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set(localeCookieName, locale, {
    path: "/",
    maxAge: localeCookieMaxAge,
    sameSite: "lax",
  });
}
