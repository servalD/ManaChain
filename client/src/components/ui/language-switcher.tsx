"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setUserLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("localeSwitcher");
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: Locale) => {
    if (next === locale || isPending) return;
    startTransition(() => {
      setUserLocale(next);
    });
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="sr-only">{t("label")}</span>
      {locales.map((cur) => (
        <button
          key={cur}
          type="button"
          onClick={() => handleChange(cur)}
          aria-pressed={locale === cur}
          disabled={isPending}
          className={cn(
            "px-2 py-1 rounded-md text-xs font-semibold uppercase transition-colors",
            locale === cur
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          {t(cur)}
        </button>
      ))}
    </div>
  );
}
