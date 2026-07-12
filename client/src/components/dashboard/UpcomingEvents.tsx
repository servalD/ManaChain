"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, MapPin, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { useEvents } from "@/hooks/api/useEvents";

export function UpcomingEvents() {
  const t = useTranslations("dashboard.client.upcomingEvents");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past">("upcoming");
  const { data, isLoading } = useEvents({ limit: 50, offset: 0 });
  const events = data?.events ?? [];
  const [now] = useState(() => Date.now());

  const filtered = events
    .filter((event) =>
      eventFilter === "upcoming"
        ? new Date(event.startsAt).getTime() >= now
        : new Date(event.startsAt).getTime() < now,
    )
    .sort((a, b) =>
      eventFilter === "upcoming"
        ? new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        : new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatTimeUntil = (iso: string) => {
    const diff = new Date(iso).getTime() - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return t("daysAgo", { days: Math.abs(days) });
    if (days === 0) return t("today");
    if (days === 1) return t("tomorrow");
    return t("inDays", { days });
  };

  const location = (event: { addressCity: string | null; addressCountry: string | null }) =>
    [event.addressCity, event.addressCountry].filter(Boolean).join(", ") || t("onlineTba");

  const Header = (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold">{t("title")}</h2>
      <Select
        value={eventFilter}
        onValueChange={(value) => setEventFilter(value as "upcoming" | "past")}
        className="w-[180px]"
      >
        <SelectItem value="upcoming">{t("upcomingOption")}</SelectItem>
        <SelectItem value="past">{t("pastOption")}</SelectItem>
      </Select>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 pt-8">
        {Header}
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="space-y-4 pt-8">
        {Header}
        <div className="text-center py-12 border border-border rounded-lg">
          <p className="text-muted-foreground text-sm">
            {eventFilter === "upcoming" ? t("noEventsUpcoming") : t("noEventsPast")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8 w-full">
      {Header}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnEvent")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnDate")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnLocation")}</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">{t("columnType")}</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">{t("columnActions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event, index) => (
                <tr
                  key={event.id}
                  className={`border-b border-border hover:bg-muted/20 transition-colors ${
                    index === filtered.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-violet-400">{event.title.charAt(0)}</span>
                      </div>
                      <div className="font-semibold text-sm">{event.title}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{formatDate(event.startsAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatTimeUntil(event.startsAt)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">{location(event)}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500">
                      {event.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => (window.location.href = "/events")}>
                        <MoreHorizontal className="h-3 w-3 mr-1" />
                        {t("viewDetails")}
                      </Button>
                    </div>
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
