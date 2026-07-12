"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { useMyNotifications, useMarkNotificationRead } from "@/hooks/api/useNotifications";

/** Cloche de notifications (navbar). Pas de temps réel : se rafraîchit au focus/remount, comme le reste du dashboard. */
export function NotificationBell() {
  const t = useTranslations("navbar.notificationBell");
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [now] = useState(() => Date.now());

  const formatRelative = (iso: string): string => {
    const diffMs = now - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("hoursAgo", { hours });
    const days = Math.floor(hours / 24);
    return t("daysAgo", { days });
  };

  const { data } = useMyNotifications({ limit: 10, offset: 0 });
  const markRead = useMarkNotificationRead();
  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="relative p-2 rounded-lg hover:bg-accent transition-colors text-foreground"
        title={t("ariaLabel")}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg z-50">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold">{t("title")}</h3>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">{t("empty")}</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!notification.readAt) void markRead.mutateAsync({ id: notification.id });
                  }}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-2"
                >
                  {!notification.readAt && <span className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />}
                  <div className={notification.readAt ? "pl-4" : ""}>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{formatRelative(notification.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
