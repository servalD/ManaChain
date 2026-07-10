"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Megaphone, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMyNotifications, useMarkNotificationRead } from "@/hooks/api/useNotifications";
import type { NotificationResponse } from "@/api/generated/models";

const getNotificationIcon = (type: NotificationResponse["type"]) => {
  switch (type) {
    case "brand_whitelisted":
      return <ShieldCheck className="h-5 w-5" />;
    case "brand_banned":
      return <ShieldAlert className="h-5 w-5" />;
    case "admin_message":
    default:
      return <Megaphone className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: NotificationResponse["type"]) => {
  switch (type) {
    case "brand_whitelisted":
      return "bg-violet-500/10 text-violet-500 border-violet-500/20";
    case "brand_banned":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "admin_message":
    default:
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
  }
};

export function BrandNotifications() {
  const t = useTranslations("dashboard.brand.brandNotifications");
  const { data, isLoading } = useMyNotifications({ limit: 20, offset: 0 });
  const markRead = useMarkNotificationRead();
  const notifications = data?.notifications ?? [];
  const [now] = useState(() => Date.now());

  const formatTimestamp = (iso: string) => {
    const diff = now - new Date(iso).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    if (hours < 24) return t("hoursAgo", { count: hours });
    return t("daysAgo", { count: days });
  };

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showAll, setShowAll] = useState(false);

  const filteredNotifications = notifications.filter((notif) => (filter === "unread" ? !notif.readAt : true));
  const unreadCount = data?.unreadCount ?? 0;
  const displayedNotifications = showAll ? filteredNotifications : filteredNotifications.slice(0, 3);
  const hasMore = filteredNotifications.length > 3;

  const markAllAsRead = () => {
    notifications.filter((n) => !n.readAt).forEach((n) => void markRead.mutateAsync({ id: n.id }));
  };

  return (
    <div className="space-y-4 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold">{t("heading")}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilter("all");
                setShowAll(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
                filter === "all"
                  ? "bg-violet-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t("all")}
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setShowAll(false);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors h-9",
                filter === "unread"
                  ? "bg-violet-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t("unreadCount", { count: unreadCount })}
            </button>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm" className="h-9 text-xs">
              {t("markAllAsRead")}
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="border border-border rounded-lg p-12 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">
            {filter === "unread" ? t("noUnreadNotifications") : t("noNotifications")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "border border-border rounded-lg p-4 transition-all",
                !notification.readAt && "bg-muted/30 border-violet-500/30"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn("p-2 rounded-lg border shrink-0", getNotificationColor(notification.type))}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        {!notification.readAt && <div className="h-2 w-2 rounded-full bg-violet-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(notification.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    {!notification.readAt && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          onClick={() => void markRead.mutateAsync({ id: notification.id })}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          {t("markAsRead")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Show More/Less Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button onClick={() => setShowAll(!showAll)} variant="ghost" size="sm" className="h-9">
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    {t("showLess")}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    {t("showAll", { count: filteredNotifications.length })}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
