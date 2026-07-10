"use client";

import { useTranslations, useLocale } from "next-intl";
import { Ticket } from "lucide-react";
import { useMyTickets, useEvents } from "@/hooks/api/useEvents";

const USDC_DECIMALS = 6;

export function MyTickets() {
  const t = useTranslations("dashboard.client.myTickets");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const { data: ticketsData, isLoading } = useMyTickets({ limit: 50, offset: 0 });
  const { data: eventsData } = useEvents({ limit: 100, offset: 0 });
  const purchases = ticketsData?.purchases ?? [];
  const eventTitleById = new Map((eventsData?.events ?? []).map((event) => [event.id, event.title]));

  if (isLoading) {
    return (
      <div className="space-y-4 pt-8">
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="space-y-4 pt-8">
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <div className="text-center py-8 border border-border rounded-lg">
          <p className="text-muted-foreground text-sm">{t("noTicketsTitle")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("noTicketsSubtitle")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8">
      <h2 className="text-xl font-bold">{t("title")}</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnEvent")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("columnQuantity")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("columnPaid")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnDate")}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase, index) => (
                <tr
                  key={purchase.id}
                  className={`border-b border-border hover:bg-muted/20 transition-colors ${
                    index === purchases.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                        <Ticket className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="font-semibold text-sm">
                        {eventTitleById.get(purchase.eventId) ?? t("unknownEvent")}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm font-medium">{purchase.quantity}</td>
                  <td className="p-4 text-right text-sm font-medium">
                    {purchase.paid === "0"
                      ? t("free")
                      : `${(Number(purchase.paid) / 10 ** USDC_DECIMALS).toFixed(2)} USDC`}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(purchase.createdAt).toLocaleDateString(dateLocale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
