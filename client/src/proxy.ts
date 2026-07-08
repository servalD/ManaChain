import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieMaxAge,
  localeCookieName,
  locales,
  type Locale,
} from "@/i18n/config";

function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter((tag): tag is string => !!tag);

  for (const tag of preferred) {
    const short = tag.split("-")[0];
    const match = locales.find((locale) => locale === tag || locale === short);
    if (match) return match;
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(localeCookieName)?.value;
  if (isLocale(existing)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const locale = matchLocale(request.headers.get("accept-language"));
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: localeCookieMaxAge,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|health|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
