"use client";

import { useTranslations, useLocale } from "next-intl";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminEvents } from "@/hooks/api/useEvents";

/**
 * Table admin : tous les événements, toutes marques, tous statuts
 * (modération) — contrairement à `BrandEvents` (sa propre marque) ou la
 * découverte publique (`published` uniquement).
 */
export function AdminEventsTable() {
  const t = useTranslations("dashboard.admin.adminEventsTable");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useAdminEvents({ limit: 100, offset: 0 });
  const entries = data?.events ?? [];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.eventName")}</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.brand")}</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.date")}</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.type")}</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr
                  key={entry.event.id}
                  className={cn(
                    "border-b border-border hover:bg-muted/20 transition-colors",
                    index === entries.length - 1 && "border-b-0",
                  )}
                >
                  <td className="p-4">
                    <div className="font-semibold text-sm">{entry.event.title}</div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{entry.brandName ?? t("unknownBrand")}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm font-medium">{formatDate(entry.event.startsAt)}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500">
                      {entry.event.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        entry.event.status === "published" && "bg-green-500/10 text-green-500",
                        entry.event.status === "draft" && "bg-muted text-muted-foreground",
                        entry.event.status === "cancelled" && "bg-destructive/10 text-destructive",
                      )}
                    >
                      {t.has(`columns.statusValues.${entry.event.status}`)
                        ? t(`columns.statusValues.${entry.event.status}`)
                        : entry.event.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
